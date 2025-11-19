# Implementação de Endpoints de Estatísticas no Backend

## Visão Geral

Este documento descreve os endpoints de estatísticas que precisam ser implementados no backend da API Angela Quiz para que a funcionalidade de relatórios funcione corretamente no frontend.

## Endpoints Necessários

### 1. GET /api/quizzes/{quizId}/statistics

**Descrição**: Obtém estatísticas detalhadas de um quiz específico.

**Parâmetros de Path**:
- `quizId` (string, obrigatório): ID do quiz

**Autenticação**: Requer token JWT válido

**Roles Permitidas**: TEACHER (owner do quiz), ADMIN

**Resposta Esperada (200)**:
```json
{
  "success": true,
  "data": {
    "quizId": "string",
    "title": "string",
    "totalAttempts": "number",
    "averageScore": "number",
    "maxScore": "number",
    "minScore": "number",
    "passRate": "number",
    "averageTimeMinutes": "number",
    "questionStatistics": [
      {
        "questionId": "string",
        "prompt": "string",
        "type": "string",
        "correctAnswers": "number",
        "incorrectAnswers": "number",
        "correctRate": "number",
        "mostCommonWrongAnswer": "string"
      }
    ],
    "attemptsByDate": [
      {
        "date": "string",
        "count": "number",
        "averageScore": "number"
      }
    ]
  }
}
```

**Lógica de Implementação**:
1. Verificar se o usuário tem permissão para acessar o quiz (owner ou admin)
2. Buscar todos os attempts do quiz
3. Calcular estatísticas agregadas:
   - Total de attempts
   - Pontuação média, máxima e mínima
   - Taxa de aprovação (considerando score >= 70%)
   - Tempo médio de conclusão
4. Para cada pergunta, calcular:
   - Número de respostas corretas e incorretas
   - Taxa de acerto
   - Resposta errada mais comum
5. Agrupar attempts por data
6. Retornar dados calculados

---

### 2. GET /api/classes/{classId}/statistics

**Descrição**: Obtém estatísticas de uma turma específica.

**Parâmetros de Path**:
- `classId` (string, obrigatório): ID da turma

**Autenticação**: Requer token JWT válido

**Roles Permitidas**: TEACHER (owner da turma), ADMIN

**Resposta Esperada (200)**:
```json
{
  "success": true,
  "data": {
    "classId": "string",
    "name": "string",
    "totalStudents": "number",
    "activeStudents": "number",
    "totalAttempts": "number",
    "averageScore": "number",
    "quizStatistics": [
      // Mesma estrutura de QuizStatistics para cada quiz da turma
    ],
    "topPerformers": [
      {
        "studentId": "string",
        "name": "string",
        "email": "string",
        "totalAttempts": "number",
        "averageScore": "number",
        "lastActivity": "string",
        "completedQuizzes": ["string"]
      }
    ],
    "strugglingStudents": [
      // Mesma estrutura de topPerformers para alunos com dificuldades
    ]
  }
}
```

**Lógica de Implementação**:
1. Verificar se o usuário tem permissão para acessar a turma (owner ou admin)
2. Buscar todos os alunos inscritos na turma
3. Buscar todos os attempts dos alunos da turma
4. Calcular estatísticas agregadas:
   - Total de alunos e alunos ativos (com pelo menos um attempt)
   - Total de attempts e pontuação média
5. Identificar top performers (melhores pontuações médias)
6. Identificar struggling students (piores pontuações médias)
7. Para cada quiz atribuído à turma, calcular estatísticas individuais
8. Retornar dados calculados

---

### 3. GET /api/students/{studentId}/attempts

**Descrição**: Obtém todas as tentativas de um aluno, opcionalmente filtradas por quiz.

**Parâmetros de Path**:
- `studentId` (string, obrigatório): ID do aluno

**Parâmetros de Query**:
- `quizId` (string, opcional): ID do quiz para filtrar tentativas

**Autenticação**: Requer token JWT válido

**Roles Permitidas**: 
- STUDENT (apenas para o próprio studentId)
- TEACHER (se o aluno estiver em suas turmas)
- ADMIN

**Resposta Esperada (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "quizId": "string",
      "quizTitle": "string",
      "assignmentId": "string",
      "studentId": "string",
      "studentName": "string",
      "score": "number",
      "maxScore": "number",
      "percentage": "number",
      "status": "IN_PROGRESS|SUBMITTED",
      "startedAt": "string",
      "submittedAt": "string|null",
      "timeSpentMinutes": "number",
      "answers": "object"
    }
  ]
}
```

**Lógica de Implementação**:
1. Verificar permissões:
   - Se STUDENT: verificar se studentId == req.user.id
   - Se TEACHER: verificar se aluno está em turmas do professor
   - ADMIN: acesso total
2. Buscar attempts do aluno
3. Se quizId fornecido, filtrar attempts por quiz
4. Para cada attempt, enriquecer com:
   - Título do quiz
   - Nome do aluno
   - Calcular percentage = (score / maxScore) * 100
   - Calcular timeSpentMinutes
5. Retornar lista de attempts

---

### 4. GET /api/quizzes/{quizId}/attempts

**Descrição**: Obtém todas as tentativas de um quiz específico.

**Parâmetros de Path**:
- `quizId` (string, obrigatório): ID do quiz

**Autenticação**: Requer token JWT válido

**Roles Permitidas**: TEACHER (owner do quiz), ADMIN

**Resposta Esperada (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "quizId": "string",
      "quizTitle": "string",
      "assignmentId": "string",
      "studentId": "string",
      "studentName": "string",
      "score": "number",
      "maxScore": "number",
      "percentage": "number",
      "status": "IN_PROGRESS|SUBMITTED",
      "startedAt": "string",
      "submittedAt": "string|null",
      "timeSpentMinutes": "number",
      "answers": "object"
    }
  ]
}
```

**Lógica de Implementação**:
1. Verificar se o usuário tem permissão para acessar o quiz (owner ou admin)
2. Buscar todos os attempts do quiz
3. Para cada attempt, enriquecer com:
   - Nome do aluno (join com User)
   - Calcular percentage = (score / maxScore) * 100
   - Calcular timeSpentMinutes
4. Retornar lista de attempts ordenada por data de submissão

---

### 5. GET /api/assignments/{assignmentId}/statistics

**Descrição**: Obtém estatísticas de um assignment específico.

**Parâmetros de Path**:
- `assignmentId` (string, obrigatório): ID do assignment

**Autenticação**: Requer token JWT válido

**Roles Permitidas**: TEACHER (owner do assignment), ADMIN

**Resposta Esperada (200)**:
```json
{
  "success": true,
  "data": {
    "assignmentId": "string",
    "quizId": "string",
    "quizTitle": "string",
    "classId": "string|null",
    "className": "string|null",
    "totalAssigned": "number",
    "totalAttempts": "number",
    "completionRate": "number",
    "averageScore": "number",
    "averageTimeMinutes": "number",
    "dueDate": "string|null",
    "status": "ACTIVE|EXPIRED|DRAFT"
  }
}
```

**Lógica de Implementação**:
1. Verificar se o usuário tem permissão para acessar o assignment (owner ou admin)
2. Buscar detalhes do assignment
3. Calcular totalAssigned:
   - Se for para turma: número de alunos na turma
   - Se for para aluno específico: 1
4. Buscar todos os attempts do assignment
5. Calcular estatísticas:
   - totalAttempts = número de attempts
   - completionRate = (totalAttempts / totalAssigned) * 100
   - averageScore = média dos scores
   - averageTimeMinutes = média do tempo gasto
6. Determinar status:
   - EXPIRED: se dueDate < agora
   - ACTIVE: se não expirou e isActive = true
   - DRAFT: se isActive = false
7. Retornar dados calculados

## Considerações de Implementação

### Performance
1. **Índices de Banco**: Garantir índices adequados para:
   - QuizAttempt.quizId
   - QuizAttempt.studentId
   - QuizAttempt.assignmentId
   - Enrollment.classId
   - QuizAssignment.classId

2. **Agregações**: Usar agregações do MongoDB para cálculos eficientes:
   - $group para calcular médias, totais
   - $lookup para joins entre coleções
   - $project para selecionar campos necessários

### Segurança
1. **Validação de Permissões**: Implementar checks rigorosos:
   - TEACHER só pode ver dados de seus próprios recursos
   - STUDENT só pode ver seus próprios attempts
   - ADMIN tem acesso total

2. **Sanitização**: Validar todos os parâmetros de entrada

### Estrutura de Código Sugerida

```javascript
// api/src/modules/statistics/statistics.controller.js
class StatisticsController {
  async getQuizStatistics(req, res) {
    // Implementação do endpoint 1
  }
  
  async getClassStatistics(req, res) {
    // Implementação do endpoint 2
  }
  
  async getStudentAttempts(req, res) {
    // Implementação do endpoint 3
  }
  
  async getQuizAttempts(req, res) {
    // Implementação do endpoint 4
  }
  
  async getAssignmentStatistics(req, res) {
    // Implementação do endpoint 5
  }
}

// api/src/modules/statistics/statistics.routes.js
router.get('/quizzes/:quizId/statistics', statisticsController.getQuizStatistics)
router.get('/classes/:classId/statistics', statisticsController.getClassStatistics)
router.get('/students/:studentId/attempts', statisticsController.getStudentAttempts)
router.get('/quizzes/:quizId/attempts', statisticsController.getQuizAttempts)
router.get('/assignments/:assignmentId/statistics', statisticsController.getAssignmentStatistics)
```

## Testes Recomendados

1. **Testes Unitários**: Para cada função de cálculo de estatísticas
2. **Testes de Integração**: Para cada endpoint com diferentes roles
3. **Testes de Performance**: Com volumes grandes de dados
4. **Testes de Segurança**: Verificar controle de acesso

## Prioridade de Implementação

1. **Alta Prioridade**:
   - GET /api/quizzes/{quizId}/statistics
   - GET /api/students/{studentId}/attempts

2. **Média Prioridade**:
   - GET /api/classes/{classId}/statistics
   - GET /api/quizzes/{quizId}/attempts

3. **Baixa Prioridade**:
   - GET /api/assignments/{assignmentId}/statistics

## Integração com Frontend

O frontend já está implementado e espera estas respostas exatas. Após implementar os endpoints, a página de relatórios funcionará automaticamente sem necessidade de alterações no frontend.