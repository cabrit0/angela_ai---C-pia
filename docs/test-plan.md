# Plano de Testes Adicionais - API Angela Quiz

Este documento define exatamente quais testes extra queremos implementar para garantir a robustez e segurança da API.

## Testes de Integração para Fluxos E2E

### 1. Fluxo 1: Professor cria quiz e usa com a própria turma

#### Teste 1.1: Criação Completa de Quiz com Assignment
**Arquivo:** `api/src/__tests__/integration/quiz-creation-flow.test.ts`
**Descrição:** Testa o fluxo completo de criação de quiz, adição de perguntas, criação de turma, inscrição de aluno e assignment.
**Cenários:**
- Professor cria quiz com perguntas
- Professor cria turma e inscreve aluno
- Professor cria assignment para turma
- Aluno visualiza assignment
- Aluno inicia e submete attempt
- Professor visualiza attempt submetido

#### Teste 1.2: Validação de Disponibilidade Temporal
**Arquivo:** `api/src/__tests__/integration/assignment-availability.test.ts`
**Descrição:** Testa se assignments respeitam as restrições de tempo (availableFrom/availableTo).
**Cenários:**
- Assignment não disponível antes de availableFrom
- Assignment disponível após availableFrom
- Assignment não disponível após availableTo
- Assignment sem restrições de tempo

### 2. Fluxo 2: Professor A partilha quiz com Professor B → B faz fork → B usa o fork em turmas próprias

#### Teste 2.1: Compartilhamento e Fork de Quiz
**Arquivo:** `api/src/__tests__/integration/quiz-sharing-flow.test.ts`
**Descrição:** Testa o fluxo completo de compartilhamento e fork de quiz entre professores.
**Cenários:**
- Professor A compartilha quiz com Professor B
- Professor B visualiza quizzes compartilhados
- Professor B faz fork do quiz
- Fork mantém todas as perguntas originais
- Fork é independente do original (alterações no original não afetam fork)

#### Teste 2.2: Permissões de Compartilhamento
**Arquivo:** `api/src/__tests__/integration/share-permissions.test.ts`
**Descrição:** Testa as permissões de compartilhamento e revogação.
**Cenários:**
- Apenas owner pode compartilhar quiz
- Apenas TEACHER pode receber compartilhamento
- Owner pode revogar compartilhamento
- Compartilhamento revogado impede novo fork
- Fork existente permanece após revogação

### 3. Fluxo 3: Assignments para turma/aluno → Student vê assignment → inicia attempt → submete → Teacher vê attempts

#### Teste 3.1: Ciclo de Vida de Attempt
**Arquivo:** `api/src/__tests__/integration/attempt-lifecycle.test.ts`
**Descrição:** Testa o ciclo completo de vida de um attempt.
**Cenários:**
- Aluno inicia attempt (status IN_PROGRESS)
- Aluno não pode iniciar segundo attempt para mesmo assignment
- Aluno submete attempt (status SUBMITTED)
- Aluno não pode submet mesmo attempt novamente
- Professor visualiza attempt submetido

#### Teste 3.2: Assignments para Turma vs Aluno Individual
**Arquivo:** `api/src/__tests__/integration/assignment-targets.test.ts`
**Descrição:** Testa diferenças entre assignments para turma inteira vs aluno específico.
**Cenários:**
- Assignment para turma aparece para todos os alunos inscritos
- Assignment para aluno específico aparece apenas para esse aluno
- Aluno não inscrito não vê assignment para turma
- Aluno específico vê ambos os tipos de assignment

## Testes Unitários

### 1. quiz.access

#### Teste 1.1: canReadQuiz
**Arquivo:** `api/src/__tests__/unit/quiz-access.test.ts`
**Cenários:**
- ADMIN pode ler qualquer quiz
- TEACHER pode ler próprio quiz
- TEACHER pode ler quiz compartilhado (sem edição)
- TEACHER não pode ler quiz de outro TEACHER sem compartilhamento
- STUDENT não pode ler quiz diretamente

#### Teste 1.2: canEditQuiz
**Arquivo:** `api/src/__tests__/unit/quiz-access.test.ts`
**Cenários:**
- ADMIN pode editar qualquer quiz
- TEACHER pode editar próprio quiz
- TEACHER pode editar quiz compartilhado com canEdit=true
- TEACHER não pode editar quiz compartilhado com canEdit=false
- TEACHER não pode editar quiz de outro TEACHER sem compartilhamento
- STUDENT não pode editar quiz

### 2. class.access

#### Teste 2.1: canManageClass
**Arquivo:** `api/src/__tests__/unit/class-access.test.ts`
**Cenários:**
- ADMIN pode gerenciar qualquer turma
- TEACHER pode gerenciar própria turma
- TEACHER não pode gerenciar turma de outro TEACHER
- STUDENT não pode gerenciar turma

### 3. share.service

#### Teste 3.1: shareQuiz
**Arquivo:** `api/src/__tests__/unit/share-service.test.ts`
**Cenários:**
- Owner pode compartilhar quiz com TEACHER
- ADMIN pode compartilhar quiz de qualquer TEACHER
- Não é possível compartilhar com STUDENT
- Não é possível compartilhar consigo mesmo
- Compartilhamento atualiza canEdit se já existir

#### Teste 3.2: revokeShare
**Arquivo:** `api/src/__tests__/unit/share-service.test.ts`
**Cenários:**
- Owner pode revogar compartilhamento
- ADMIN pode revogar qualquer compartilhamento
- TEACHER não pode revogar compartilhamento de outro
- Revogar compartilhamento inexistente retorna 404

#### Teste 3.3: forkSharedQuiz
**Arquivo:** `api/src/__tests__/unit/share-service.test.ts`
**Cenários:**
- TEACHER pode fazer fork de próprio quiz
- TEACHER pode fazer fork de quiz compartilhado
- TEACHER não pode fazer fork de quiz não compartilhado
- Fork cria cópia independente com novo ownerId
- Fork copia todas as perguntas do original

### 4. assignment.service

#### Teste 4.1: createAssignment
**Arquivo:** `api/src/__tests__/unit/assignment-service.test.ts`
**Cenários:**
- TEACHER pode criar assignment para próprio quiz e turma
- ADMIN pode criar assignment para qualquer quiz e turma
- Não é possível criar assignment sem quizId
- Não é possível criar assignment sem classId ou studentId
- Não é possível criar assignment para turma de outro TEACHER
- studentId deve pertencer a usuário com role STUDENT

#### Teste 4.2: listAssignmentsForUser
**Arquivo:** `api/src/__tests__/unit/assignment-service.test.ts`
**Cenários:**
- ADMIN vê todos os assignments
- TEACHER vê assignments de próprios quizzes
- STUDENT vê assignments de próprias turmas
- STUDENT vê assignments diretos para si
- STUDENT não vê assignments de outras turmas

#### Teste 4.3: updateAssignment
**Arquivo:** `api/src/__tests__/unit/assignment-service.test.ts`
**Cenários:**
- TEACHER pode atualizar próprio assignment
- ADMIN pode atualizar qualquer assignment
- TEACHER não pode atualizar assignment de outro TEACHER
- Atualização preserva campos não informados

### 5. attempt.service

#### Teste 5.1: startAttempt
**Arquivo:** `api/src/__tests__/unit/attempt-service.test.ts`
**Cenários:**
- STUDENT pode iniciar attempt para assignment disponível
- Não é possível iniciar attempt para assignment inativo
- Não é possível iniciar attempt antes de availableFrom
- Não é possível iniciar attempt após availableTo
- Não é possível iniciar segundo attempt IN_PROGRESS
- Não é possível iniciar attempt para assignment não acessível

#### Teste 5.2: submitAttempt
**Arquivo:** `api/src/__tests__/unit/attempt-service.test.ts`
**Cenários:**
- STUDENT pode submeter attempt próprio IN_PROGRESS
- Não é possível submeter attempt de outro STUDENT
- Não é possível submeter attempt já SUBMITTED
- Não é possível submeter attempt não existente
- Respostas são validadas e salvas

#### Teste 5.3: getAttemptById
**Arquivo:** `api/src/__tests__/unit/attempt-service.test.ts`
**Cenários:**
- ADMIN pode ver qualquer attempt
- TEACHER pode ver attempts de próprios quizzes
- STUDENT pode ver apenas attempts próprios
- TEACHER não pode ver attempts de outros quizzes
- STUDENT não pode ver attempts de outros alunos

## Testes de Segurança

### 1. Validação de Input

#### Teste 1.1: Sanitização de XSS
**Arquivo:** `api/src/__tests__/security/xss-prevention.test.ts`
**Cenários:**
- Títulos de quiz com scripts maliciosos são sanitizados
- Descrições com HTML são sanitizadas
- Prompts de perguntas com scripts são sanitizados

#### Teste 1.2: Injeção de SQL/NoSQL
**Arquivo:** `api/src/__tests__/security/injection-prevention.test.ts`
**Cenários:**
- Tentativas de injeção em campos de texto são rejeitadas
- ObjectId malformados são rejeitados
- Consultas com operadores especiais são tratadas seguramente

### 2. Autenticação e Autorização

#### Teste 2.1: Bypass de Autenticação
**Arquivo:** `api/src/__tests__/security/auth-bypass.test.ts`
**Cenários:**
- Endpoints protegidos rejeitam requisições sem token
- Tokens inválidos são rejeitados
- Tokens expirados são rejeitados
- Tokens manipulados são rejeitados

#### Teste 2.2: Escalonamento de Privilégios
**Arquivo:** `api/src/__tests__/security/privilege-escalation.test.ts`
**Cenários:**
- STUDENT não pode acessar endpoints de TEACHER
- TEACHER não pode acessar endpoints de ADMIN
- Usuário não pode acessar recursos de outro usuário
- Manipulação de IDs não permite acesso não autorizado

### 3. Rate Limiting

#### Teste 3.1: Limitação de Requisições
**Arquivo:** `api/src/__tests__/security/rate-limiting.test.ts`
**Cenários:**
- Login é limitado após X tentativas
- Registro é limitado após X tentativas
- Limitação é por IP
- Limitação é resetada após período de tempo

## Testes de Performance

### 1. Consultas Otimizadas

#### Teste 1.1: Paginação e Limites
**Arquivo:** `api/src/__tests__/performance/pagination.test.ts`
**Cenários:**
- Listagens grandes são paginadas
- Limites de tamanho são respeitados
- Performance é aceitável com muitos registros

#### Teste 1.2: Índices de Banco
**Arquivo:** `api/src/__tests__/performance/database-indexes.test.ts`
**Cenários:**
- Consultas usam índices apropriados
- Não há consultas de coleção inteira
- Tempo de resposta é aceitável

## Testes de Carga

### 1. Múltiplos Usuários

#### Teste 1.1: Concorrência de Attempts
**Arquivo:** `api/src/__tests__/load/concurrent-attempts.test.ts`
**Cenários:**
- Múltiplos alunos podem iniciar attempts simultaneamente
- Sistema mantém consistência com alta concorrência
- Não há corrupção de dados com acessos simultâneos

#### Teste 1.2: Carga de Assignments
**Arquivo:** `api/src/__tests__/load/assignment-load.test.ts`
**Cenários:**
- Sistema suporta criação de muitos assignments
- Listagens permanecem rápidas com muitos registros
- Performance é degradada gracefulmente

## Estrutura de Diretórios de Testes

```
api/src/__tests__/
├── integration/
│   ├── quiz-creation-flow.test.ts
│   ├── assignment-availability.test.ts
│   ├── quiz-sharing-flow.test.ts
│   ├── share-permissions.test.ts
│   ├── attempt-lifecycle.test.ts
│   └── assignment-targets.test.ts
├── unit/
│   ├── quiz-access.test.ts
│   ├── class-access.test.ts
│   ├── share-service.test.ts
│   ├── assignment-service.test.ts
│   └── attempt-service.test.ts
├── security/
│   ├── xss-prevention.test.ts
│   ├── injection-prevention.test.ts
│   ├── auth-bypass.test.ts
│   ├── privilege-escalation.test.ts
│   └── rate-limiting.test.ts
├── performance/
│   ├── pagination.test.ts
│   └── database-indexes.test.ts
└── load/
    ├── concurrent-attempts.test.ts
    └── assignment-load.test.ts
```

## Ferramentas e Bibliotecas Recomendadas

### 1. Framework de Testes
- **Jest**: Já configurado no projeto
- **Supertest**: Para testes de integração HTTP
- **MongoDB Memory Server**: Para testes isolados de banco

### 2. Mocks e Stubs
- **Jest mocks**: Para mock de serviços externos
- **MongoDB mocks**: Para isolar testes de banco

### 3. Testes de Segurança
- **Jest**: Para testes unitários de segurança
- **Supertest**: Para testes de segurança HTTP
- **Fuzz testing**: Para testes de robustez de input

### 4. Testes de Performance
- **Artillery**: Para testes de carga
- **Jest**: Para medições de performance simples
- **MongoDB explain**: Para análise de consultas

## Configuração de Testes

### 1. Ambiente de Teste
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### 2. Setup de Testes
```typescript
// src/__tests__/setup.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

## Priorização de Implementação

### Fase 1: Crítico (1-2 semanas)
1. Testes unitários de access control (quiz.access, class.access)
2. Testes unitários de share.service
3. Testes unitários de attempt.service
4. Testes de integração básicos dos fluxos E2E

### Fase 2: Importante (2-3 semanas)
1. Testes de segurança (autenticação, autorização)
2. Testes unitários de assignment.service
3. Testes de integração de compartilhamento e fork
4. Testes de validação de input

### Fase 3: Recomendado (3-4 semanas)
1. Testes de performance
2. Testes de carga
3. Testes de rate limiting
4. Cobertura de código completa

## Métricas de Sucesso

### 1. Cobertura de Código
- Mínimo 80% de cobertura em todos os módulos
- 100% de cobertura em camadas críticas (auth, access control)

### 2. Testes de Segurança
- Todos os endpoints críticos testados contra vulnerabilidades comuns
- Todos os cenários de bypass de autenticação testados

### 3. Testes de Integração
- Todos os fluxos E2E principais testados
- Todos os cenários de erro importantes testados

### 4. Performance
- Tempo de resposta médio < 200ms para 95% das requisições
- Sistema suporta 100 usuários simultâneos sem degradação significativa