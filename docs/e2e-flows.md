# Fluxos End-to-End (E2E) da API Angela Quiz

Este documento define os fluxos E2E chave que devem ser testados e garantidos, com sequência de chamadas HTTP e requisitos de autenticação.

## Fluxo 1: Professor cria quiz e usa com a própria turma

### Descrição
Um professor (Teacher) cria um quiz, adiciona perguntas, cria uma turma, inscreve alunos, cria um assignment para a turma e os alunos realizam o quiz.

### Pré-requisitos
- Professor autenticado (token JWT)
- Pelo menos um aluno existente no sistema

### Sequência de Chamadas HTTP

#### 1. Autenticação do Professor
```
POST /api/auth/login
Role: TEACHER
Body: {
  "email": "teacher@example.com",
  "password": "password123"
}
Response: {
  "success": true,
  "data": {
    "user": {...},
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```
Dependência: accessToken para todas as chamadas seguintes

#### 2. Criar Quiz
```
POST /api/quizzes
Role: TEACHER
Headers: Authorization: Bearer {accessToken}
Body: {
  "title": "Quiz de Matemática",
  "description": "Quiz sobre operações básicas"
}
Response: {
  "success": true,
  "data": {
    "_id": "quiz_id_here",
    "title": "Quiz de Matemática",
    "description": "Quiz sobre operações básicas",
    "ownerId": "teacher_id_here",
    "isPublished": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```
Dependência: quizId para passos seguintes

#### 3. Adicionar Pergunta ao Quiz
```
POST /api/quizzes/{quizId}/questions
Role: TEACHER
Headers: Authorization: Bearer {accessToken}
Body: {
  "type": "MULTIPLE_CHOICE",
  "prompt": "Quanto é 2 + 2?",
  "options": ["3", "4", "5", "6"],
  "correctAnswer": "4",
  "order": 1
}
Response: {
  "success": true,
  "data": {
    "_id": "question_id_here",
    "quizId": "quiz_id_here",
    "type": "MULTIPLE_CHOICE",
    "prompt": "Quanto é 2 + 2?",
    "options": ["3", "4", "5", "6"],
    "correctAnswer": "4",
    "order": 1
  }
}
```
Dependência: questionId (opcional para fluxo básico)

#### 4. Publicar Quiz
```
PATCH /api/quizzes/{quizId}
Role: TEACHER
Headers: Authorization: Bearer {accessToken}
Body: {
  "isPublished": true
}
Response: {
  "success": true,
  "data": {
    "_id": "quiz_id_here",
    "title": "Quiz de Matemática",
    "description": "Quiz sobre operações básicas",
    "ownerId": "teacher_id_here",
    "isPublished": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### 5. Criar Turma
```
POST /api/classes
Role: TEACHER
Headers: Authorization: Bearer {accessToken}
Body: {
  "name": "Turma de Matemática 101",
  "description": "Turma do primeiro semestre"
}
Response: {
  "success": true,
  "data": {
    "_id": "class_id_here",
    "name": "Turma de Matemática 101",
    "description": "Turma do primeiro semestre",
    "teacherId": "teacher_id_here",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```
Dependência: classId para passos seguintes

#### 6. Inscrever Aluno na Turma
```
POST /api/classes/{classId}/enroll
Role: TEACHER
Headers: Authorization: Bearer {accessToken}
Body: {
  "studentId": "student_id_here"
}
Response: {
  "success": true,
  "data": {
    "_id": "enrollment_id_here",
    "classId": "class_id_here",
    "studentId": "student_id_here",
    "createdAt": "..."
  }
}
```
Dependência: studentId deve ser um ID válido de usuário com role STUDENT

#### 7. Criar Assignment para a Turma
```
POST /api/assignments
Role: TEACHER
Headers: Authorization: Bearer {accessToken}
Body: {
  "quizId": "quiz_id_here",
  "classId": "class_id_here",
  "availableFrom": "2024-01-01T00:00:00Z",
  "availableTo": "2024-12-31T23:59:59Z"
}
Response: {
  "success": true,
  "data": {
    "_id": "assignment_id_here",
    "quizId": "quiz_id_here",
    "classId": "class_id_here",
    "isActive": true,
    "availableFrom": "2024-01-01T00:00:00Z",
    "availableTo": "2024-12-31T23:59:59Z",
    "createdAt": "..."
  }
}
```
Dependência: assignmentId para passos seguintes

#### 8. Autenticação do Aluno
```
POST /api/auth/login
Role: STUDENT
Body: {
  "email": "student@example.com",
  "password": "password123"
}
Response: {
  "success": true,
  "data": {
    "user": {...},
    "accessToken": "student_jwt_token_here",
    "refreshToken": "student_refresh_token_here"
  }
}
```
Dependência: studentAccessToken para passos seguintes

#### 9. Listar Assignments do Aluno
```
GET /api/assignments
Role: STUDENT
Headers: Authorization: Bearer {studentAccessToken}
Response: {
  "success": true,
  "data": [
    {
      "_id": "assignment_id_here",
      "quizId": "quiz_id_here",
      "classId": "class_id_here",
      "isActive": true,
      "availableFrom": "2024-01-01T00:00:00Z",
      "availableTo": "2024-12-31T23:59:59Z",
      "createdAt": "..."
    }
  ]
}
```

#### 10. Iniciar Attempt do Aluno
```
POST /api/quizzes/{quizId}/attempts
Role: STUDENT
Headers: Authorization: Bearer {studentAccessToken}
Body: {
  "assignmentId": "assignment_id_here"
}
Response: {
  "success": true,
  "data": {
    "_id": "attempt_id_here",
    "quizId": "quiz_id_here",
    "assignmentId": "assignment_id_here",
    "studentId": "student_id_here",
    "answers": {},
    "status": "IN_PROGRESS",
    "startedAt": "..."
  }
}
```
Dependência: attemptId para passo seguinte

#### 11. Submeter Attempt
```
POST /api/attempts/{attemptId}/submit
Role: STUDENT
Headers: Authorization: Bearer {studentAccessToken}
Body: {
  "answers": {
    "question_id_here": "4"
  }
}
Response: {
  "success": true,
  "data": {
    "_id": "attempt_id_here",
    "quizId": "quiz_id_here",
    "assignmentId": "assignment_id_here",
    "studentId": "student_id_here",
    "answers": {
      "question_id_here": "4"
    },
    "status": "SUBMITTED",
    "startedAt": "...",
    "submittedAt": "..."
  }
}
```

#### 12. Professor Visualizar Attempts
```
GET /api/attempts/{attemptId}
Role: TEACHER
Headers: Authorization: Bearer {accessToken}
Response: {
  "success": true,
  "data": {
    "_id": "attempt_id_here",
    "quizId": "quiz_id_here",
    "assignmentId": "assignment_id_here",
    "studentId": "student_id_here",
    "answers": {
      "question_id_here": "4"
    },
    "status": "SUBMITTED",
    "startedAt": "...",
    "submittedAt": "..."
  }
}
```

## Fluxo 2: Professor A partilha quiz com Professor B → B faz fork → B usa o fork em turmas próprias

### Descrição
Professor A cria um quiz e partilha com Professor B. Professor B faz um fork do quiz e usa-o com suas turmas.

### Pré-requisitos
- Professor A autenticado
- Professor B autenticado
- Quiz criado pelo Professor A

### Sequência de Chamadas HTTP

#### 1. Autenticação do Professor A
```
POST /api/auth/login
Role: TEACHER
Body: {
  "email": "teacher_a@example.com",
  "password": "password123"
}
Response: {
  "success": true,
  "data": {
    "user": {...},
    "accessToken": "teacher_a_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```
Dependência: teacherAToken para todas as chamadas seguintes do Professor A

#### 2. Autenticação do Professor B
```
POST /api/auth/login
Role: TEACHER
Body: {
  "email": "teacher_b@example.com",
  "password": "password123"
}
Response: {
  "success": true,
  "data": {
    "user": {...},
    "accessToken": "teacher_b_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```
Dependência: teacherBToken para todas as chamadas seguintes do Professor B

#### 3. Professor A Obtém ID do Professor B
```
// Nota: Este passo assume que o Professor A conhece o ID do Professor B
// Em um cenário real, poderia haver um endpoint para buscar usuários
```
Dependência: teacherBId para passo seguinte

#### 4. Professor A Partilha Quiz com Professor B
```
POST /api/quizzes/{quizId}/share
Role: TEACHER
Headers: Authorization: Bearer {teacherAToken}
Body: {
  "sharedWithTeacherId": "teacher_b_id_here",
  "canEdit": false
}
Response: {
  "success": true,
  "data": {
    "_id": "share_id_here",
    "quizId": "quiz_id_here",
    "ownerId": "teacher_a_id_here",
    "sharedWithTeacherId": "teacher_b_id_here",
    "canEdit": false,
    "createdAt": "..."
  }
}
```
Dependência: shareId para referência futura

#### 5. Professor B Lista Quizzes Partilhados
```
GET /api/quizzes/shared-with-me
Role: TEACHER
Headers: Authorization: Bearer {teacherBToken}
Response: {
  "success": true,
  "data": [
    {
      "shareId": "share_id_here",
      "quizId": "quiz_id_here",
      "title": "Quiz de Matemática",
      "description": "Quiz sobre operações básicas",
      "ownerId": "teacher_a_id_here",
      "canEdit": false
    }
  ]
}
```

#### 6. Professor B Faz Fork do Quiz
```
POST /api/quizzes/{quizId}/fork
Role: TEACHER
Headers: Authorization: Bearer {teacherBToken}
Response: {
  "success": true,
  "data": {
    "_id": "forked_quiz_id_here",
    "title": "Quiz de Matemática",
    "description": "Quiz sobre operações básicas",
    "ownerId": "teacher_b_id_here",
    "isPublished": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```
Dependência: forkedQuizId para passos seguintes

#### 7. Professor B Verifica Perguntas do Fork
```
GET /api/quizzes/{forkedQuizId}/questions
Role: TEACHER
Headers: Authorization: Bearer {teacherBToken}
Response: {
  "success": true,
  "data": [
    {
      "_id": "forked_question_id_here",
      "quizId": "forked_quiz_id_here",
      "type": "MULTIPLE_CHOICE",
      "prompt": "Quanto é 2 + 2?",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": "4",
      "order": 1
    }
  ]
}
```

#### 8. Professor B Cria Turma Própria
```
POST /api/classes
Role: TEACHER
Headers: Authorization: Bearer {teacherBToken}
Body: {
  "name": "Turma de Professor B",
  "description": "Turma para teste de fork"
}
Response: {
  "success": true,
  "data": {
    "_id": "teacher_b_class_id_here",
    "name": "Turma de Professor B",
    "description": "Turma para teste de fork",
    "teacherId": "teacher_b_id_here",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```
Dependência: teacherBClassId para passos seguintes

#### 9. Professor B Inscreve Aluno na Turma
```
POST /api/classes/{teacherBClassId}/enroll
Role: TEACHER
Headers: Authorization: Bearer {teacherBToken}
Body: {
  "studentId": "student_id_here"
}
Response: {
  "success": true,
  "data": {
    "_id": "enrollment_id_here",
    "classId": "teacher_b_class_id_here",
    "studentId": "student_id_here",
    "createdAt": "..."
  }
}
```

#### 10. Professor B Cria Assignment com Fork
```
POST /api/assignments
Role: TEACHER
Headers: Authorization: Bearer {teacherBToken}
Body: {
  "quizId": "forked_quiz_id_here",
  "classId": "teacher_b_class_id_here",
  "availableFrom": "2024-01-01T00:00:00Z",
  "availableTo": "2024-12-31T23:59:59Z"
}
Response: {
  "success": true,
  "data": {
    "_id": "teacher_b_assignment_id_here",
    "quizId": "forked_quiz_id_here",
    "classId": "teacher_b_class_id_here",
    "isActive": true,
    "availableFrom": "2024-01-01T00:00:00Z",
    "availableTo": "2024-12-31T23:59:59Z",
    "createdAt": "..."
  }
}
```

#### 11. Professor A Revoga Partilha (Opcional)
```
DELETE /api/quizzes/{quizId}/share/{teacherBId}
Role: TEACHER
Headers: Authorization: Bearer {teacherAToken}
Response: {
  "success": true,
  "data": null
}
```

## Fluxo 3: Assignments para turma/aluno → Student vê assignment → inicia attempt → submete → Teacher vê attempts

### Descrição
Professor cria assignments para turma e/ou aluno específico. Aluno visualiza assignments disponíveis, inicia attempt, submete respostas. Professor visualiza attempts submetidos.

### Pré-requisitos
- Professor autenticado
- Aluno autenticado
- Quiz publicado
- Turma criada
- Aluno inscrito na turma

### Sequência de Chamadas HTTP

#### 1. Autenticação do Professor
```
POST /api/auth/login
Role: TEACHER
Body: {
  "email": "teacher@example.com",
  "password": "password123"
}
Response: {
  "success": true,
  "data": {
    "user": {...},
    "accessToken": "teacher_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```
Dependência: teacherToken para todas as chamadas seguintes do Professor

#### 2. Professor Cria Assignment para Turma
```
POST /api/assignments
Role: TEACHER
Headers: Authorization: Bearer {teacherToken}
Body: {
  "quizId": "quiz_id_here",
  "classId": "class_id_here",
  "availableFrom": "2024-01-01T00:00:00Z",
  "availableTo": "2024-12-31T23:59:59Z"
}
Response: {
  "success": true,
  "data": {
    "_id": "class_assignment_id_here",
    "quizId": "quiz_id_here",
    "classId": "class_id_here",
    "isActive": true,
    "availableFrom": "2024-01-01T00:00:00Z",
    "availableTo": "2024-12-31T23:59:59Z",
    "createdAt": "..."
  }
}
```
Dependência: classAssignmentId para referência futura

#### 3. Professor Cria Assignment para Aluno Específico
```
POST /api/assignments
Role: TEACHER
Headers: Authorization: Bearer {teacherToken}
Body: {
  "quizId": "quiz_id_here",
  "studentId": "student_id_here",
  "availableFrom": "2024-01-01T00:00:00Z",
  "availableTo": "2024-12-31T23:59:59Z"
}
Response: {
  "success": true,
  "data": {
    "_id": "student_assignment_id_here",
    "quizId": "quiz_id_here",
    "studentId": "student_id_here",
    "isActive": true,
    "availableFrom": "2024-01-01T00:00:00Z",
    "availableTo": "2024-12-31T23:59:59Z",
    "createdAt": "..."
  }
}
```
Dependência: studentAssignmentId para referência futura

#### 4. Professor Lista Todos os Assignments
```
GET /api/assignments
Role: TEACHER
Headers: Authorization: Bearer {teacherToken}
Response: {
  "success": true,
  "data": [
    {
      "_id": "class_assignment_id_here",
      "quizId": "quiz_id_here",
      "classId": "class_id_here",
      "isActive": true,
      "availableFrom": "2024-01-01T00:00:00Z",
      "availableTo": "2024-12-31T23:59:59Z",
      "createdAt": "..."
    },
    {
      "_id": "student_assignment_id_here",
      "quizId": "quiz_id_here",
      "studentId": "student_id_here",
      "isActive": true,
      "availableFrom": "2024-01-01T00:00:00Z",
      "availableTo": "2024-12-31T23:59:59Z",
      "createdAt": "..."
    }
  ]
}
```

#### 5. Autenticação do Aluno
```
POST /api/auth/login
Role: STUDENT
Body: {
  "email": "student@example.com",
  "password": "password123"
}
Response: {
  "success": true,
  "data": {
    "user": {...},
    "accessToken": "student_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```
Dependência: studentToken para todas as chamadas seguintes do Aluno

#### 6. Aluno Lista Assignments Disponíveis
```
GET /api/assignments
Role: STUDENT
Headers: Authorization: Bearer {studentToken}
Response: {
  "success": true,
  "data": [
    {
      "_id": "class_assignment_id_here",
      "quizId": "quiz_id_here",
      "classId": "class_id_here",
      "isActive": true,
      "availableFrom": "2024-01-01T00:00:00Z",
      "availableTo": "2024-12-31T23:59:59Z",
      "createdAt": "..."
    },
    {
      "_id": "student_assignment_id_here",
      "quizId": "quiz_id_here",
      "studentId": "student_id_here",
      "isActive": true,
      "availableFrom": "2024-01-01T00:00:00Z",
      "availableTo": "2024-12-31T23:59:59Z",
      "createdAt": "..."
    }
  ]
}
```

#### 7. Aluno Obtém Detalhes de um Assignment
```
GET /api/assignments/{classAssignmentId}
Role: STUDENT
Headers: Authorization: Bearer {studentToken}
Response: {
  "success": true,
  "data": {
    "_id": "class_assignment_id_here",
    "quizId": "quiz_id_here",
    "classId": "class_id_here",
    "isActive": true,
    "availableFrom": "2024-01-01T00:00:00Z",
    "availableTo": "2024-12-31T23:59:59Z",
    "createdAt": "..."
  }
}
```

#### 8. Aluno Obtém Detalhes do Quiz
```
GET /api/quizzes/{quizId}
Role: STUDENT
Headers: Authorization: Bearer {studentToken}
Response: {
  "success": true,
  "data": {
    "_id": "quiz_id_here",
    "title": "Quiz de Matemática",
    "description": "Quiz sobre operações básicas",
    "ownerId": "teacher_id_here",
    "isPublished": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### 9. Aluno Obtém Perguntas do Quiz
```
GET /api/quizzes/{quizId}/questions
Role: STUDENT
Headers: Authorization: Bearer {studentToken}
Response: {
  "success": true,
  "data": [
    {
      "_id": "question_id_here",
      "quizId": "quiz_id_here",
      "type": "MULTIPLE_CHOICE",
      "prompt": "Quanto é 2 + 2?",
      "options": ["3", "4", "5", "6"],
      "order": 1
    }
  ]
}
```

#### 10. Aluno Inicia Attempt
```
POST /api/quizzes/{quizId}/attempts
Role: STUDENT
Headers: Authorization: Bearer {studentToken}
Body: {
  "assignmentId": "class_assignment_id_here"
}
Response: {
  "success": true,
  "data": {
    "_id": "attempt_id_here",
    "quizId": "quiz_id_here",
    "assignmentId": "class_assignment_id_here",
    "studentId": "student_id_here",
    "answers": {},
    "status": "IN_PROGRESS",
    "startedAt": "..."
  }
}
```
Dependência: attemptId para passos seguintes

#### 11. Aluno Submete Attempt
```
POST /api/attempts/{attemptId}/submit
Role: STUDENT
Headers: Authorization: Bearer {studentToken}
Body: {
  "answers": {
    "question_id_here": "4"
  }
}
Response: {
  "success": true,
  "data": {
    "_id": "attempt_id_here",
    "quizId": "quiz_id_here",
    "assignmentId": "class_assignment_id_here",
    "studentId": "student_id_here",
    "answers": {
      "question_id_here": "4"
    },
    "status": "SUBMITTED",
    "startedAt": "...",
    "submittedAt": "..."
  }
}
```

#### 12. Professor Lista Attempts de um Assignment
```
// Nota: Este endpoint não existe atualmente na API
// Seria necessário implementar um endpoint como:
// GET /api/assignments/{assignmentId}/attempts
// Para listar todos os attempts de um assignment específico
```

#### 13. Professor Obtém Detalhes de um Attempt Específico
```
GET /api/attempts/{attemptId}
Role: TEACHER
Headers: Authorization: Bearer {teacherToken}
Response: {
  "success": true,
  "data": {
    "_id": "attempt_id_here",
    "quizId": "quiz_id_here",
    "assignmentId": "class_assignment_id_here",
    "studentId": "student_id_here",
    "answers": {
      "question_id_here": "4"
    },
    "status": "SUBMITTED",
    "startedAt": "...",
    "submittedAt": "..."
  }
}
```

#### 14. Professor Atualiza Assignment (Desativa)
```
PATCH /api/assignments/{classAssignmentId}
Role: TEACHER
Headers: Authorization: Bearer {teacherToken}
Body: {
  "isActive": false
}
Response: {
  "success": true,
  "data": {
    "_id": "class_assignment_id_here",
    "quizId": "quiz_id_here",
    "classId": "class_id_here",
    "isActive": false,
    "availableFrom": "2024-01-01T00:00:00Z",
    "availableTo": "2024-12-31T23:59:59Z",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

## Considerações Gerais

### Tokens de Autenticação
- Todos os endpoints (exceto login, register, refresh, logout) requerem header `Authorization: Bearer {token}`
- Tokens têm expiração e devem ser renovados usando o endpoint `/api/auth/refresh`
- O endpoint `/api/auth/logout` é stateless e sempre retorna sucesso

### Tratamento de Erros
- 400: Input inválido (campos obrigatórios faltando, tipos incorretos)
- 401: Não autenticado (token inválido, expirado ou ausente)
- 403: Sem permissão (role inadequado, não é owner, etc.)
- 404: Recurso não encontrado (ID inválido ou não existe)
- 409: Conflito (email já existe, etc.)

### IDs e Referências
- Todos os IDs são strings (MongoDB ObjectIds)
- IDs retornados em respostas devem ser usados exatamente como recebidos
- Relacionamentos são mantidos através desses IDs

### Estados e Transições
- Quiz: `isPublished` pode ser alterado de `false` para `true` e vice-versa
- Attempt: `IN_PROGRESS` → `SUBMITTED` (transição única)
- Assignment: `isActive` pode ser alterado de `true` para `false` e vice-versa

### Validações Importantes
- Um aluno só pode ter um attempt `IN_PROGRESS` por (quiz, assignment, student)
- Um attempt `SUBMITTED` não pode ser alterado
- Apenas o owner do quiz (ou ADMIN) pode gerenciar shares
- Apenas TEACHER ou ADMIN podem criar/editar quizzes, classes, assignments
- Apenas STUDENT pode iniciar/submeter attempts