# Especificação OpenAPI - API Angela Quiz

Este documento define o contrato HTTP da API Angela Quiz em formato estruturado, pronto para ser convertido em YAML/JSON OpenAPI 3. O objetivo é permitir que um agente de AI consiga implementar o client frontend utilizando apenas este documento.

## Informações Gerais

### Base URL
```
Produção: https://api.angela-quiz.com
Desenvolvimento: http://localhost:3000
```

### Autenticação
- Tipo: Bearer Token (JWT)
- Header: `Authorization: Bearer {token}`
- Tokens obtidos via endpoint `/api/auth/login`
- Tokens expiram e devem ser renovados via `/api/auth/refresh`

### Formato de Resposta
Todas as respostas seguem o padrão:
```json
{
  "success": true|false,
  "data": {...}|null,
  "message": "string" // apenas em erros
}
```

### Roles de Usuário
- `ADMIN`: Acesso total ao sistema
- `TEACHER`: Pode criar e gerenciar quizzes, classes, assignments
- `STUDENT`: Pode visualizar assignments e realizar attempts

## Endpoints

### Auth

#### POST /api/auth/register
Registra um novo usuário com role TEACHER.
- **Role necessário**: Nenhum (público)
- **Request Body**:
  ```json
  {
    "name": "string (obrigatório)",
    "email": "string (obrigatório)",
    "password": "string (mínimo 6 caracteres, obrigatório)"
  }
  ```
- **Response de Sucesso** (201):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "string",
        "name": "string",
        "email": "string",
        "role": "TEACHER"
      },
      "accessToken": "string",
      "refreshToken": "string"
    }
  }
  ```
- **Erros**:
  - 400: Input inválido
  - 409: Email já existe

#### POST /api/auth/login
Autentica usuário e retorna tokens.
- **Role necessário**: Nenhum (público)
- **Request Body**:
  ```json
  {
    "email": "string (obrigatório)",
    "password": "string (obrigatório)"
  }
  ```
- **Response de Sucesso** (200):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "string",
        "name": "string",
        "email": "string",
        "role": "ADMIN|TEACHER|STUDENT"
      },
      "accessToken": "string",
      "refreshToken": "string"
    }
  }
  ```
- **Erros**:
  - 400: Input inválido
  - 401: Credenciais inválidas

#### POST /api/auth/refresh
Renova tokens de acesso usando refresh token.
- **Role necessário**: Nenhum (público)
- **Request Body**:
  ```json
  {
    "refreshToken": "string (obrigatório)"
  }
  ```
- **Response de Sucesso** (200):
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "string",
      "refreshToken": "string"
    }
  }
  ```
- **Erros**:
  - 400: Refresh token inválido
  - 401: Refresh token expirado ou inválido

#### POST /api/auth/logout
Logout stateless (sempre retorna sucesso).
- **Role necessário**: Nenhum (público)
- **Request Body**: Vazio
- **Response de Sucesso** (200):
  ```json
  {
    "success": true,
    "data": {
      "message": "Logged out"
    }
  }
  ```

### Users

*Nota: Endpoints de gerenciamento de usuários não estão implementados atualmente.*

### Classes

#### POST /api/classes
Cria uma nova turma.
- **Role necessário**: TEACHER ou ADMIN
- **Request Body**:
  ```json
  {
    "name": "string (obrigatório)",
    "description": "string (opcional)",
    "teacherId": "string (obrigatório apenas para ADMIN)"
  }
  ```
- **Response de Sucesso** (201):
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "name": "string",
      "description": "string|null",
      "teacherId": "string",
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)"
    }
  }
  ```
- **Erros**:
  - 400: Input inválido
  - 403: Sem permissão
  - 404: Teacher não encontrado (para ADMIN)

#### GET /api/classes
Lista turmas visíveis para o usuário autenticado.
- **Role necessário**: Qualquer (autenticado)
- **Response de Sucesso** (200):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "string",
        "name": "string",
        "description": "string|null",
        "teacherId": "string",
        "createdAt": "string (ISO 8601)",
        "updatedAt": "string (ISO 8601)"
      }
    ]
  }
  ```
- **Comportamento por role**:
  - ADMIN: Lista todas as turmas
  - TEACHER: Lista apenas turmas próprias
  - STUDENT: Lista turmas onde está inscrito

#### GET /api/classes/{id}
Obtém detalhes de uma turma específica.
- **Role necessário**: Qualquer (autenticado)
- **Path Parameters**:
  - `id`: string (obrigatório)
- **Response de Sucesso** (200):
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "name": "string",
      "description": "string|null",
      "teacherId": "string",
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)"
    }
  }
  ```
- **Erros**:
  - 400: ID inválido
  - 403: Sem permissão
  - 404: Turma não encontrada

#### PATCH /api/classes/{id}
Atualiza dados de uma turma.
- **Role necessário**: TEACHER ou ADMIN
- **Path Parameters**:
  - `id`: string (obrigatório)
- **Request Body**:
  ```json
  {
    "name": "string (opcional)",
    "description": "string (opcional)"
  }
  ```
- **Response de Sucesso** (200):
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "name": "string",
      "description": "string|null",
      "teacherId": "string",
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)"
    }
  }
  ```
- **Erros**:
  - 400: Input inválido
  - 403: Sem permissão
  - 404: Turma não encontrada

#### DELETE /api/classes/{id}
Remove uma turma e suas inscrições.
- **Role necessário**: TEACHER ou ADMIN
- **Path Parameters**:
  - `id`: string (obrigatório)
- **Response de Sucesso** (204):
  ```json
  {
    "success": true,
    "data": null
  }
  ```
- **Erros**:
  - 400: ID inválido
  - 403: Sem permissão
  - 404: Turma não encontrada

#### POST /api/classes/{id}/enroll
Inscreve um aluno em uma turma.
- **Role necessário**: TEACHER ou ADMIN
- **Path Parameters**:
  - `id`: string (obrigatório)
- **Request Body**:
  ```json
  {
    "studentId": "string (obrigatório)"
  }
  ```
- **Response de Sucesso** (201):
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "classId": "string",
      "studentId": "string",
      "createdAt": "string (ISO 8601)"
    }
  }
  ```
- **Erros**:
  - 400: Input inválido ou studentId não é STUDENT
  - 403: Sem permissão
  - 404: Turma ou aluno não encontrado

#### GET /api/classes/{id}/students
Lista alunos inscritos em uma turma.
- **Role necessário**: TEACHER ou ADMIN
- **Path Parameters**:
  - `id`: string (obrigatório)
- **Response de Sucesso** (200):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "string",
        "name": "string",
        "email": "string",
        "role": "STUDENT"
      }
    ]
  }
  ```
- **Erros**:
  - 400: ID inválido
  - 403: Sem permissão
  - 404: Turma não encontrada

### Quizzes

#### POST /api/quizzes
Cria um novo quiz.
- **Role necessário**: TEACHER ou ADMIN
- **Request Body**:
  ```json
  {
    "title": "string (obrigatório)",
    "description": "string (opcional)",
    "metadata": "object (opcional)"
  }
  ```
- **Response de Sucesso** (201):
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "title": "string",
      "description": "string|null",
      "metadata": "object|null",
      "ownerId": "string",
      "isPublished": false,
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)"
    }
  }
  ```
- **Erros**:
  - 400: Input inválido
  - 403: Sem permissão

#### GET /api/quizzes
Lista quizzes visíveis para o usuário autenticado.
- **Role necessário**: Qualquer (autenticado)
- **Response de Sucesso** (200):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "string",
        "title": "string",
        "description": "string|null",
        "ownerId": "string",
        "isPublished": boolean,
        "createdAt": "string (ISO 8601)",
        "updatedAt": "string (ISO 8601)"
      }
    ]
  }
  ```
- **Comportamento por role**:
  - ADMIN: Lista todos os quizzes
  - TEACHER: Lista quizzes próprios
  - STUDENT: Lista vazia (acesso via assignments)

#### GET /api/quizzes/{id}
Obtém detalhes de um quiz específico.
- **Role necessário**: Qualquer (autenticado)
- **Path Parameters**:
  - `id`: string (obrigatório)
- **Response de Sucesso** (200):
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "title": "string",
      "description": "string|null",
      "metadata": "object|null",
      "ownerId": "string",
      "isPublished": boolean,
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)"
    }
  }
  ```
- **Erros**:
  - 400: ID inválido
  - 403: Sem permissão
  - 404: Quiz não encontrado

#### PATCH /api/quizzes/{id}
Atualiza dados de um quiz.
- **Role necessário**: TEACHER ou ADMIN
- **Path Parameters**:
  - `id`: string (obrigatório)
- **Request Body**:
  ```json
  {
    "title": "string (opcional)",
    "description": "string (opcional)",
    "metadata": "object (opcional)",
    "isPublished": "boolean (opcional)"
  }
  ```
- **Response de Sucesso** (200):
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "title": "string",
      "description": "string|null",
      "metadata": "object|null",
      "ownerId": "string",
      "isPublished": boolean,
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)"
    }
  }
  ```
- **Erros**:
  - 400: Input inválido
  - 403: Sem permissão
  - 404: Quiz não encontrado

#### DELETE /api/quizzes/{id}
Remove um quiz e suas perguntas.
- **Role necessário**: TEACHER ou ADMIN
- **Path Parameters**:
  - `id`: string (obrigatório)
- **Response de Sucesso** (200):
  ```json
  {
    "success": true,
    "data": null
  }
  ```
- **Erros**:
  - 400: ID inválido
  - 403: Sem permissão
  - 404: Quiz não encontrado

#### GET /api/quizzes/{id}/questions
Lista perguntas de um quiz.
- **Role necessário**: Qualquer (autenticado)
- **Path Parameters**:
  - `id`: string (obrigatório)
- **Response de Sucesso** (200):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "string",
        "quizId": "string",
        "type": "MULTIPLE_CHOICE|TRUE_FALSE|SHORT_ANSWER|FILL_IN_THE_BLANK|OPEN_ENDED|MATCHING|ORDERING",
        "prompt": "string",
        "options": "object|null",
        "correctAnswer": "object|null",
        "order": "number"
      }
    ]
  }
  ```
- **Erros**:
  - 400: ID inválido
  - 403: Sem permissão
  - 404: Quiz não encontrado

#### POST /api/quizzes/{id}/questions
Adiciona uma pergunta a um quiz.
- **Role necessário**: TEACHER ou ADMIN
- **Path Parameters**:
  - `id`: string (obrigatório)
- **Request Body**:
  ```json
  {
    "type": "MULTIPLE_CHOICE|TRUE_FALSE|SHORT_ANSWER|FILL_IN_THE_BLANK|OPEN_ENDED|MATCHING|ORDERING (obrigatório)",
    "prompt": "string (obrigatório)",
    "options": "object (opcional, shape depende de type)",
    "correctAnswer": "object (opcional, shape depende de type)",
    "order": "number (opcional)"
  }
  ```
- **Response de Sucesso** (201):
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "quizId": "string",
      "type": "MULTIPLE_CHOICE|TRUE_FALSE|SHORT_ANSWER|FILL_IN_THE_BLANK|OPEN_ENDED|MATCHING|ORDERING",
      "prompt": "string",
      "options": "object|null",
      "correctAnswer": "object|null",
      "order": "number"
    }
  }
  ```
- **Erros**:
  - 400: Input inválido
  - 403: Sem permissão
  - 404: Quiz não encontrado

#### PATCH /api/quizzes/{id}/questions/{questionId}
Atualiza uma pergunta de um quiz.
- **Role necessário**: TEACHER ou ADMIN
- **Path Parameters**:
  - `id`: string (obrigatório)
  - `questionId`: string (obrigatório)
- **Request Body**:
  ```json
  {
    "type": "MULTIPLE_CHOICE|TRUE_FALSE|SHORT_ANSWER|FILL_IN_THE_BLANK|OPEN_ENDED|MATCHING|ORDERING (opcional)",
    "prompt": "string (opcional)",
    "options": "object (opcional, shape depende de type)",
    "correctAnswer": "object (opcional, shape depende de type)",
    "order": "number (opcional)"
  }
  ```
- **Response de Sucesso** (200):
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "quizId": "string",
      "type": "MULTIPLE_CHOICE|TRUE_FALSE|SHORT_ANSWER|FILL_IN_THE_BLANK|OPEN_ENDED|MATCHING|ORDERING",
      "prompt": "string",
      "options": "object|null",
      "correctAnswer": "object|null",
      "order": "number"
    }
  }
  ```
- **Erros**:
  - 400: Input inválido
  - 403: Sem permissão
  - 404: Quiz ou pergunta não encontrada

#### DELETE /api/quizzes/{id}/questions/{questionId}
Remove uma pergunta de um quiz.
- **Role necessário**: TEACHER ou ADMIN
- **Path Parameters**:
  - `id`: string (obrigatório)
  - `questionId`: string (obrigatório)
- **Response de Sucesso** (200):
  ```json
  {
    "success": true,
    "data": null
  }
  ```
- **Erros**:
  - 400: ID inválido
  - 403: Sem permissão
  - 404: Quiz ou pergunta não encontrada

### Modelo de Pergunta (para OpenAPI 3)

Campo `type` (enum, obrigatório):

- `MULTIPLE_CHOICE`
- `TRUE_FALSE`
- `SHORT_ANSWER`
- `FILL_IN_THE_BLANK`
- `OPEN_ENDED`
- `MATCHING`
- `ORDERING`

Campos `options` e `correctAnswer` (ambos `object`/`any`, opcionais) têm shapes diferentes conforme `type`:

- `MULTIPLE_CHOICE`:
  - `options`: array de opções ou objeto com metadados (ex: `{ choices: string[] }`)
  - `correctAnswer`: valor ou valores corretos (ex: `"A"` ou `["A", "C"]`)
- `TRUE_FALSE`:
  - `options`: opcional (pode omitir ou explicitar `[true, false]`)
  - `correctAnswer`: `true` ou `false`
- `SHORT_ANSWER`:
  - `options`: opcional (ex: dicas, regex, etc.)
  - `correctAnswer`: string ou estrutura com respostas aceitáveis
- `FILL_IN_THE_BLANK`:
  - `options`: configuração das lacunas (ex: texto com placeholders, lista de blanks)
  - `correctAnswer`: objeto/array com respostas esperadas por lacuna
- `OPEN_ENDED`:
  - `options`: opcional (rubricas, instruções)
  - `correctAnswer`: opcional, livre (usado para sugestão/correção assistida)
- `MATCHING`:
  - `options`: definição das duas colunas (ex: `{ left: [...], right: [...] }`)
  - `correctAnswer`: mapeamento entre itens (ex: `{ "leftId1": "rightId3", ... }`)
- `ORDERING`:
  - `options`: itens a serem ordenados (ex: array de objetos/strings)
  - `correctAnswer`: ordem correta (ex: array de IDs/índices)

Em OpenAPI 3, o schema base pode ser representado como:

```yaml
QuizQuestion:
  type: object
  properties:
    id:
      type: string
    quizId:
      type: string
    type:
      type: string
      enum:
        - MULTIPLE_CHOICE
        - TRUE_FALSE
        - SHORT_ANSWER
        - FILL_IN_THE_BLANK
        - OPEN_ENDED
        - MATCHING
        - ORDERING
    prompt:
      type: string
    options:
      description: Shape varia conforme o type; ver documentação textual.
    correctAnswer:
      description: Shape varia conforme o type; ver documentação textual.
    order:
      type: integer
  required:
    - quizId
    - type
    - prompt
    - order
```

### Shares

#### POST /api/quizzes/{id}/share
Compartilha um quiz com outro professor.
- **Role necessário**: TEACHER ou ADMIN
- **Path Parameters**:
  - `id`: string (obrigatório)
- **Request Body**:
  ```json
  {
    "sharedWithTeacherId": "string (obrigatório)",
    "canEdit": "boolean (opcional, default: false)"
  }
  ```
- **Response de Sucesso** (200):
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "quizId": "string",
      "ownerId": "string",
      "sharedWithTeacherId": "string",
      "canEdit": boolean,
      "createdAt": "string (ISO 8601)"
    }
  }
  ```
- **Erros**:
  - 400: Input inválido ou teacherId não é TEACHER
  - 403: Sem permissão
  - 404: Quiz não encontrado

#### GET /api/quizzes/{id}/shared-with
Lista compartilhamentos de um quiz.
- **Role necessário**: TEACHER ou ADMIN
- **Path Parameters**:
  - `id`: string (obrigatório)
- **Response de Sucesso** (200):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "string",
        "quizId": "string",
        "ownerId": "string",
        "sharedWithTeacherId": "string",
        "canEdit": boolean,
        "createdAt": "string (ISO 8601)"
      }
    ]
  }
  ```
- **Erros**:
  - 400: ID inválido
  - 403: Sem permissão
  - 404: Quiz não encontrado

#### DELETE /api/quizzes/{id}/share/{sharedWithTeacherId}
Revoga compartilhamento de um quiz.
- **Role necessário**: TEACHER ou ADMIN
- **Path Parameters**:
  - `id`: string (obrigatório)
  - `sharedWithTeacherId`: string (obrigatório)
- **Response de Sucesso** (200):
  ```json
  {
    "success": true,
    "data": null
  }
  ```
- **Erros**:
  - 400: ID inválido
  - 403: Sem permissão
  - 404: Quiz ou compartilhamento não encontrado

#### POST /api/quizzes/{id}/fork
Cria uma cópia (fork) de um quiz.
- **Role necessário**: TEACHER ou ADMIN
- **Path Parameters**:
  - `id`: string (obrigatório)
- **Request Body**: Vazio
- **Response de Sucesso** (200):
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "title": "string",
      "description": "string|null",
      "metadata": "object|null",
      "ownerId": "string",
      "isPublished": false,
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)"
    }
  }
  ```
- **Erros**:
  - 400: ID inválido
  - 403: Sem permissão ou acesso ao quiz
  - 404: Quiz não encontrado

#### GET /api/quizzes/shared-with-me
Lista quizzes compartilhados com o usuário atual.
- **Role necessário**: TEACHER
- **Response de Sucesso** (200):
  ```json
  {
    "success": true,
    "data": [
      {
        "shareId": "string",
        "quizId": "string",
        "title": "string",
        "description": "string|null",
        "ownerId": "string",
        "canEdit": boolean
      }
    ]
  }
  ```

### Assignments

#### POST /api/assignments
Cria um novo assignment.
- **Role necessário**: TEACHER ou ADMIN
- **Request Body**:
  ```json
  {
    "quizId": "string (obrigatório)",
    "classId": "string (opcional, mas um dos dois obrigatório)",
    "studentId": "string (opcional, mas um dos dois obrigatório)",
    "availableFrom": "string (ISO 8601, opcional)",
    "availableTo": "string (ISO 8601, opcional)"
  }
  ```
- **Response de Sucesso** (201):
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "quizId": "string",
      "classId": "string|null",
      "studentId": "string|null",
      "isActive": true,
      "availableFrom": "string|null (ISO 8601)",
      "availableTo": "string|null (ISO 8601)",
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)"
    }
  }
  ```
- **Erros**:
  - 400: Input inválido ou sem classId/studentId
  - 403: Sem permissão
  - 404: Quiz, turma ou aluno não encontrado

#### GET /api/assignments
Lista assignments visíveis para o usuário autenticado.
- **Role necessário**: Qualquer (autenticado)
- **Response de Sucesso** (200):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "string",
        "quizId": "string",
        "classId": "string|null",
        "studentId": "string|null",
        "isActive": boolean,
        "availableFrom": "string|null (ISO 8601)",
        "availableTo": "string|null (ISO 8601)",
        "createdAt": "string (ISO 8601)",
        "updatedAt": "string (ISO 8601)"
      }
    ]
  }
  ```
- **Comportamento por role**:
  - ADMIN: Lista todos os assignments
  - TEACHER: Lista assignments de próprios quizzes
  - STUDENT: Lista assignments de próprias turmas ou diretos

#### GET /api/assignments/{id}
Obtém detalhes de um assignment específico.
- **Role necessário**: Qualquer (autenticado)
- **Path Parameters**:
  - `id`: string (obrigatório)
- **Response de Sucesso** (200):
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "quizId": "string",
      "classId": "string|null",
      "studentId": "string|null",
      "isActive": boolean,
      "availableFrom": "string|null (ISO 8601)",
      "availableTo": "string|null (ISO 8601)",
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)"
    }
  }
  ```
- **Erros**:
  - 400: ID inválido
  - 403: Sem permissão
  - 404: Assignment não encontrado

#### PATCH /api/assignments/{id}
Atualiza um assignment.
- **Role necessário**: TEACHER ou ADMIN
- **Path Parameters**:
  - `id`: string (obrigatório)
- **Request Body**:
  ```json
  {
    "availableFrom": "string|null (ISO 8601, opcional)",
    "availableTo": "string|null (ISO 8601, opcional)",
    "isActive": "boolean (opcional)"
  }
  ```
- **Response de Sucesso** (200):
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "quizId": "string",
      "classId": "string|null",
      "studentId": "string|null",
      "isActive": boolean,
      "availableFrom": "string|null (ISO 8601)",
      "availableTo": "string|null (ISO 8601)",
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)"
    }
  }
  ```
- **Erros**:
  - 400: Input inválido
  - 403: Sem permissão
  - 404: Assignment não encontrado

#### DELETE /api/assignments/{id}
Remove um assignment.
- **Role necessário**: TEACHER ou ADMIN
- **Path Parameters**:
  - `id`: string (obrigatório)
- **Response de Sucesso** (200):
  ```json
  {
    "success": true,
    "data": null
  }
  ```
- **Erros**:
  - 400: ID inválido
  - 403: Sem permissão
  - 404: Assignment não encontrado

### Attempts

#### POST /api/quizzes/{quizId}/attempts
Inicia um attempt para um quiz.
- **Role necessário**: STUDENT
- **Path Parameters**:
  - `quizId`: string (obrigatório)
- **Request Body**:
  ```json
  {
    "assignmentId": "string (obrigatório)"
  }
  ```
- **Response de Sucesso** (201):
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "quizId": "string",
      "assignmentId": "string",
      "studentId": "string",
      "answers": "object",
      "status": "IN_PROGRESS",
      "startedAt": "string (ISO 8601)"
    }
  }
  ```
- **Erros**:
  - 400: Input inválido, assignment não encontrado ou não disponível
  - 403: Sem permissão ou acesso ao assignment
  - 404: Quiz não encontrado

#### POST /api/attempts/{id}/submit
Submete um attempt.
- **Role necessário**: STUDENT
- **Path Parameters**:
  - `id`: string (obrigatório)
- **Request Body**:
  ```json
  {
    "answers": "object (obrigatório)"
  }
  ```
- **Response de Sucesso** (200):
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "quizId": "string",
      "assignmentId": "string",
      "studentId": "string",
      "answers": "object",
      "status": "SUBMITTED",
      "startedAt": "string (ISO 8601)",
      "submittedAt": "string (ISO 8601)"
    }
  }
  ```
- **Erros**:
  - 400: Input inválido ou attempt não está IN_PROGRESS
  - 403: Sem permissão
  - 404: Attempt não encontrado

#### GET /api/attempts/{id}
Obtém detalhes de um attempt.
- **Role necessário**: Qualquer (autenticado)
- **Path Parameters**:
  - `id`: string (obrigatório)
- **Response de Sucesso** (200):
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "quizId": "string",
      "assignmentId": "string",
      "studentId": "string",
      "answers": "object",
      "status": "IN_PROGRESS|SUBMITTED",
      "startedAt": "string (ISO 8601)",
      "submittedAt": "string|null (ISO 8601)"
    }
  }
  ```
- **Erros**:
  - 400: ID inválido
  - 403: Sem permissão
  - 404: Attempt não encontrado

## Códigos de Erro Padrão

- **400 Bad Request**: Input inválido, campos obrigatórios faltando, tipos incorretos
- **401 Unauthorized**: Token ausente, inválido ou expirado
- **403 Forbidden**: Role inadequada, sem permissão para recurso específico
- **404 Not Found**: Recurso não encontrado com o ID fornecido
- **409 Conflict**: Recurso já existe (ex: email duplicado)
- **429 Too Many Requests**: Rate limit excedido
- **500 Internal Server Error**: Erro inesperado no servidor

## Exemplos de Fluxo para Frontend

### 1. Autenticação e Setup Inicial
```javascript
// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'teacher@example.com',
    password: 'password123'
  })
});
const { data: { user, accessToken } } = await loginResponse.json();

// Salvar token para requisições futuras
localStorage.setItem('token', accessToken);
```

### 2. Criação de Quiz
```javascript
// Criar quiz
const quizResponse = await fetch('/api/quizzes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Meu Quiz',
    description: 'Descrição do quiz'
  })
});
const { data: quiz } = await quizResponse.json();

// Adicionar pergunta
const questionResponse = await fetch(`/api/quizzes/${quiz.id}/questions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    type: 'MULTIPLE_CHOICE',
    prompt: 'Qual a capital do Brasil?',
    options: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador'],
    correctAnswer: 'Brasília'
  })
});
```

### 3. Compartilhamento e Fork
```javascript
// Compartilhar quiz
await fetch(`/api/quizzes/${quiz.id}/share`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    sharedWithTeacherId: 'teacher-id-here',
    canEdit: false
  })
});

// Listar quizzes compartilhados (como outro professor)
const sharedResponse = await fetch('/api/quizzes/shared-with-me', {
  headers: {
    'Authorization': `Bearer ${otherTeacherToken}`
  }
});
const { data: sharedQuizzes } = await sharedResponse.json();

// Fazer fork
const forkResponse = await fetch(`/api/quizzes/${sharedQuizzes[0].quizId}/fork`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${otherTeacherToken}`
  }
});
```

### 4. Ciclo de Assignment e Attempt
```javascript
// Criar assignment
const assignmentResponse = await fetch('/api/assignments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${teacherToken}`
  },
  body: JSON.stringify({
    quizId: quiz.id,
    classId: class.id,
    availableFrom: new Date().toISOString(),
    availableTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
  })
});
const { data: assignment } = await assignmentResponse.json();

// Aluno lista assignments
const studentAssignmentsResponse = await fetch('/api/assignments', {
  headers: {
    'Authorization': `Bearer ${studentToken}`
  }
});
const { data: assignments } = await studentAssignmentsResponse.json();

// Aluno inicia attempt
const attemptResponse = await fetch(`/api/quizzes/${quiz.id}/attempts`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${studentToken}`
  },
  body: JSON.stringify({
    assignmentId: assignment.id
  })
});
const { data: attempt } = await attemptResponse.json();

// Aluno submete attempt
await fetch(`/api/attempts/${attempt.id}/submit`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${studentToken}`
  },
  body: JSON.stringify({
    answers: {
      'question-id-here': 'Brasília'
    }
  })
});
```

## Conversão para OpenAPI 3

Este documento está estruturado para facilitar conversão para YAML/JSON OpenAPI 3. A estrutura básica seria:

```yaml
openapi: 3.0.0
info:
  title: Angela Quiz API
  version: 1.0.0
  description: API para sistema de quizzes educacionais
servers:
  - url: https://api.angela-quiz.com
    description: Produção
  - url: http://localhost:3000
    description: Desenvolvimento
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    # Definir schemas baseado nos exemplos acima
paths:
  # Mapear endpoints conforme documentado
```

Um agente de AI pode usar este documento para implementar um client frontend completo, seguindo os fluxos e exemplos fornecidos.