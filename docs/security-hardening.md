# Lista de Validações Adicionais (Hardening) - API Angela Quiz

Este documento define uma lista clara e curta de hardenings que devem ser aplicados no código para aumentar a segurança e robustez da API.

## assignment.service

### 1. Validação de Role do Aluno
**Localização:** `createAssignment` e `updateAssignment`
**Implementação:** Validar sempre que `studentId` é um utilizador com `role = STUDENT`
**Código:**
```typescript
// Em createAssignment, após validar studentId
if (studentId) {
  const student = await UserModel.findById(studentObjectId).lean().exec();
  if (!student || student.role !== "STUDENT") {
    httpError("Provided studentId does not belong to a STUDENT", 400);
  }
}
```

### 2. Validação de Disponibilidade Temporal
**Localização:** `startAttempt` (attempt.service)
**Implementação:** Validar se a data atual está dentro do período de disponibilidade do assignment
**Código:**
```typescript
// Já implementado, mas garantir que está sendo verificado
if (assignment.availableFrom && assignment.availableFrom > now) {
  httpError("Assignment is not yet available", 400);
}
if (assignment.availableTo && assignment.availableTo < now) {
  httpError("Assignment is no longer available", 400);
}
```

## share.service

### 1. Validação de Role do Destinatário
**Localização:** `shareQuiz`
**Implementação:** Confirmar que já garantimos `sharedWithTeacherId` com `role = TEACHER`
**Status:** ✅ Já implementado em `assertTargetIsTeacher`

### 2. Validação de Auto-Partilha
**Localização:** `shareQuiz`
**Implementação:** Impedir que um professor partilhe um quiz consigo mesmo
**Código:**
```typescript
// Em shareQuiz, após validar target user
if (sharedWithTeacherId === owner.id) {
  httpError("Cannot share quiz with yourself", 400);
}
```

### 3. Validação de Duplicação de Share
**Localização:** `shareQuiz`
**Implementação:** Verificar se já existe um share para o mesmo quiz e mesmo professor antes de criar
**Status:** ✅ Já implementado via `findOneAndUpdate` com `upsert: true`

## attempt.service

### 1. Unicidade de Attempt IN_PROGRESS
**Localização:** `startAttempt`
**Implementação:** Assegurar unicidade de attempt IN_PROGRESS por `(assignmentId, quizId, studentId)`
**Status:** ✅ Já implementado, mas garantir que o índice composto existe no banco

### 2. Bloqueio de Submit Múltiplo
**Localização:** `submitAttempt`
**Implementação:** Bloquear submit se já estiver `SUBMITTED`
**Status:** ✅ Já implementado

### 3. Validação de Timeout
**Localização:** `submitAttempt`
**Implementação:** Adicionar validação de tempo máximo para submissão (ex: 24 horas após início)
**Código:**
```typescript
// Em submitAttempt, após validar attempt
const maxDuration = 24 * 60 * 60 * 1000; // 24 horas em ms
if (now.getTime() - attempt.startedAt.getTime() > maxDuration) {
  httpError("Attempt timed out", 400);
}
```

### 4. Validação de Respostas
**Localização:** `submitAttempt`
**Implementação:** Validar estrutura das respostas contra as perguntas do quiz
**Código:**
```typescript
// Em submitAttempt, após validar answers
const questions = await QuizQuestionModel.find({ quizId: attempt.quizId }).lean().exec();
const questionIds = new Set(questions.map(q => q._id.toString()));

for (const [questionId, answer] of Object.entries(answers)) {
  if (!questionIds.has(questionId)) {
    httpError(`Invalid question ID: ${questionId}`, 400);
  }
  
  // Validar tipo da resposta baseado no tipo da pergunta
  const question = questions.find(q => q._id.toString() === questionId);
  if (question.type === "MULTIPLE_CHOICE" && !question.options?.includes(answer)) {
    httpError(`Invalid answer for question ${questionId}`, 400);
  }
}
```

## class.service

### 1. Validação de Role do Professor
**Localização:** `createClass`
**Implementação:** Garantir que `teacherId` é TEACHER/ADMIN quando ADMIN cria turma
**Status:** ✅ Já implementado em `createClass`

### 2. Validação de Auto-Inscrever
**Localização:** `enrollStudent`
**Implementação:** Impedir que um professor se inscreva como aluno em sua própria turma
**Código:**
```typescript
// Em enrollStudent, após validar student
if (student.role === "TEACHER" || student.role === "ADMIN") {
  httpError("Teachers and admins cannot be enrolled as students", 400);
}
```

### 3. Validação de Limite de Alunos por Turma
**Localização:** `enrollStudent`
**Implementação:** Adicionar limite máximo de alunos por turma (configurável)
**Código:**
```typescript
// Em enrollStudent, após validar class
const MAX_STUDENTS_PER_CLASS = 50; // Configurável
const currentEnrollments = await EnrollmentModel.countDocuments({ 
  classId: classObjectId 
}).exec();

if (currentEnrollments >= MAX_STUDENTS_PER_CLASS) {
  httpError("Class has reached maximum student capacity", 400);
}
```

## quiz.service

### 1. Validação de Perguntas Obrigatórias
**Localização:** `updateQuiz` (ao publicar)
**Implementação:** Impedir publicação de quiz sem perguntas
**Código:**
```typescript
// Em updateQuiz, quando isPublished = true
if (data.isPublished === true) {
  const questionCount = await QuizQuestionModel.countDocuments({ 
    quizId: new Types.ObjectId(quizId) 
  }).exec();
  
  if (questionCount === 0) {
    httpError("Cannot publish quiz without questions", 400);
  }
}
```

### 2. Validação de Edição de Quiz Publicado
**Localização:** `updateQuiz` e `deleteQuiz`
**Implementação:** Restringir edição/exclusão de quiz publicado se já tiver attempts
**Código:**
```typescript
// Em updateQuiz e deleteQuiz
const quiz = await QuizModel.findById(quizId).lean().exec();
if (quiz.isPublished) {
  const attemptCount = await QuizAttemptModel.countDocuments({ 
    quizId: new Types.ObjectId(quizId) 
  }).exec();
  
  if (attemptCount > 0) {
    httpError("Cannot modify/delete published quiz with existing attempts", 400);
  }
}
```

## auth.service

### 1. Rate Limiting
**Localização:** `login` e `registerTeacher`
**Implementação:** Implementar rate limiting para prevenir brute force
**Código:**
```typescript
// Usar middleware de rate limiting como express-rate-limit
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // limite de 5 tentativas
  message: "Too many authentication attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 2. Validação de Força de Senha
**Localização:** `registerTeacher`
**Implementação:** Exigir senhas mais fortes
**Código:**
```typescript
// Em registerTeacher
function validatePasswordStrength(password: string): boolean {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return password.length >= minLength && 
         hasUpperCase && 
         hasLowerCase && 
         hasNumbers && 
         hasSpecialChar;
}

if (!validatePasswordStrength(input.password)) {
  throw Object.assign(new Error("Password must be at least 8 characters long and contain uppercase, lowercase, numbers and special characters"), {
    statusCode: 400,
  });
}
```

## Validações Globais

### 1. Sanitização de Input
**Localização:** Todos os controllers
**Implementação:** Sanitizar inputs para prevenir XSS e injection
**Código:**
```typescript
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

function sanitizeString(input: string): string {
  return purify.sanitize(input.trim());
}

// Usar em todos os campos de texto recebidos
if (typeof input.title === 'string') {
  input.title = sanitizeString(input.title);
}
```

### 2. Validação de ObjectId
**Localização:** Todos os serviços
**Implementação:** Validar formato de todos os ObjectIds recebidos
**Código:**
```typescript
function validateObjectId(id: string, fieldName: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    httpError(`Invalid ${fieldName}`, 400);
  }
  return new Types.ObjectId(id);
}

// Usar para todos os IDs recebidos
const quizObjectId = validateObjectId(quizId, "quizId");
```

### 3. Padronização de Erros
**Localização:** Todos os serviços e controllers
**Implementação:** Garantir respostas de erro consistentes
**Código:**
```typescript
// Criar helper centralizado para erros HTTP
export class HttpError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Padronizar códigos de erro:
// 400 para input inválido
// 401 para falta de auth
// 403 para falta de permissões
// 404 para recurso não encontrado
// 409 para conflito (duplicação)
// 429 para rate limit
// 500 para erros inesperados
```

### 4. Logging de Segurança
**Localização:** Middleware de autenticação e endpoints críticos
**Implementação:** Logar eventos de segurança para auditoria
**Código:**
```typescript
// Em auth middleware
if (!user) {
  securityLogger.warn('Unauthorized access attempt', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
}

// Em endpoints críticos (login, register, etc.)
securityLogger.info('User authentication', {
  userId: user.id,
  action: 'login',
  ip: req.ip,
  timestamp: new Date().toISOString()
});
```

### 5. Validação de CORS
**Localização:** Middleware CORS
**Implementação:** Configurar CORS adequadamente para ambiente de produção
**Código:**
```typescript
// Em produção, especificar domínios permitidos
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://frontend.example.com'] 
    : true,
  credentials: true,
  optionsSuccessStatus: 200
};
```

## Índices de Banco de Dados Recomendados

### 1. QuizAttempt
```javascript
// Índice composto para unicidade de attempt IN_PROGRESS
{ quizId: 1, assignmentId: 1, studentId: 1, status: 1 }

// Índice para consultas de attempts por student
{ studentId: 1, createdAt: -1 }

// Índice para consultas de attempts por assignment
{ assignmentId: 1, status: 1 }
```

### 2. QuizShare
```javascript
// Índice único para evitar duplicação de shares
{ quizId: 1, sharedWithTeacherId: 1 }

// Índice para consultas de shares recebidos
{ sharedWithTeacherId: 1 }
```

### 3. Enrollment
```javascript
// Índice único para evitar duplicação de enrollments
{ classId: 1, studentId: 1 }

// Índice para consultas de turmas por student
{ studentId: 1 }
```

## Configurações de Ambiente

### 1. Variáveis de Ambiente Obrigatórias
```bash
# Segurança
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
BCRYPT_SALT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_ATTEMPTS=5

# CORS
ALLOWED_ORIGINS=https://frontend.example.com

# Banco de Dados
MONGODB_URI=mongodb://localhost:27017/angela-quiz
```

### 2. Configurações de Produção
```javascript
// Timeout de sessão
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 horas

// Tamanho máximo de upload
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB

// Limite de requisições por minuto
const REQUESTS_PER_MINUTE = 60;
```

## Priorização de Implementação

### Alta Prioridade (Crítico)
1. Validação de ObjectId em todos os endpoints
2. Padronização de erros HTTP
3. Validação de role do aluno em assignments
4. Prevenir auto-partilha de quizzes

### Média Prioridade (Importante)
1. Rate limiting em endpoints de autenticação
2. Validação de força de senha
3. Sanitização de inputs
4. Validação de perguntas obrigatórias para publicar quiz

### Baixa Prioridade (Recomendado)
1. Logging de segurança
2. Validação de timeout em attempts
3. Validação de limite de alunos por turma
4. Validação de edição de quiz publicado com attempts

## Testes de Segurança Recomendados

1. **Teste de Injeção**: Tentar injetar código malicioso em campos de texto
2. **Teste de Bypass de Autenticação**: Tentar acessar endpoints sem token ou com token inválido
3. **Teste de Escalonamento de Privilégios**: Tentar acessar recursos de outros usuários
4. **Teste de Rate Limiting**: Tentar sobrecarregar endpoints com múltiplas requisições
5. **Teste de Manipulação de IDs**: Tentar acessar recursos usando IDs de outros usuários
6. **Teste de CORS**: Tentar acessar API de origens não autorizadas