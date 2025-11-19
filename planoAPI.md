# Plano Técnico da API Node/Express - Sistema de Quizzes (Professores, Alunos e Partilha entre Professores)

Este documento define o plano completo para implementar uma API backend em Node.js/Express integrada com o frontend atual (React/Vite), suportando:

- Gestão de utilizadores com roles (ADMIN, TEACHER, STUDENT).
- Multi-tenant por professor: cada professor só vê e gere os seus próprios recursos.
- Partilha controlada de quizzes entre professores (exclusiva entre docentes autenticados).
- Quizzes com várias questões, alinhados com o modelo existente no frontend.
- Turmas/Cursos, matrículas (enrollments) e assignments de quizzes.
- Submissões (attempts) dos alunos e consulta de resultados.
- Segurança com JWT, validação, boas práticas de arquitetura.
- Preparação para integração com MCP (Model Context Protocol).

---

## 1. Objetivos e Requisitos Funcionais

### 1.1. Perfis de Utilizador

- ADMIN (opcional, recomendado)
  - Gerir utilizadores (criar professores, bloquear contas, etc.).
  - Ver e auditar dados globais.

- TEACHER
  - Criar e gerir quizzes.
  - Criar e gerir turmas/cursos.
  - Associar alunos às turmas.
  - Atribuir quizzes a turmas ou alunos específicos.
  - Consultar submissões e resultados de quizzes que lhe pertencem.
  - Partilhar quizzes com outros professores e usar quizzes partilhados.

- STUDENT
  - Aceder apenas aos quizzes atribuídos (via turma ou assignment direto).
  - Submeter respostas aos quizzes atribuídos.
  - Consultar feedback e/ou resultados próprios (dependendo das regras).

### 1.2. Regras Gerais

- Cada quiz tem um `ownerId` (TEACHER). Apenas esse professor (ou ADMIN) pode editar/apagar.
- Uma turma (`Class/Course`) tem um `teacherId`. Apenas esse professor (ou ADMIN) pode gerir essa turma.
- Associar quizzes a turmas/alunos via `QuizAssignment`.
- Acesso dos alunos a quizzes é mediado por assignments + enrollments.
- A partilha de quizzes é exclusiva entre professores autenticados:
  - O professor A pode conceder acesso de leitura/uso do seu quiz ao professor B.
  - Professores com acesso partilhado podem:
    - Usar esse quiz (ou uma cópia) nas suas próprias turmas.
    - Não podem editar o quiz original de outro professor (a não ser se for definido como permissões adicionais explícitas).
- Todas as operações sensíveis requerem autenticação JWT e checks de role/ownership/partilha.

### 1.3. Requisitos de Segurança

- Passwords armazenadas com hash (bcrypt).
- JWT:
  - Access token de curta duração.
  - Refresh token de maior duração.
- CORS configurado para o(s) domínio(s) do frontend.
- Validação de input em todos os endpoints (zod/express-validator).
- Tratamento consistente de erros (middleware global).
- Logs mínimos de auditoria (criação/alteração/apagamento de recursos críticos, partilhas).

---

## 2. Modelo de Dados (Relacional)

Recomendado usar PostgreSQL em produção (SQLite em desenvolvimento) com ORM (ex: Prisma).

### 2.1. Tabelas/Entidades Base

1. `User`
   - `id` (UUID)
   - `name` (string)
   - `email` (string, unique)
   - `passwordHash` (string)
   - `role` (enum: `ADMIN`, `TEACHER`, `STUDENT`)
   - `createdAt`, `updatedAt`

2. `Class` (ou `Course`)
   - `id` (UUID)
   - `name` (string)
   - `description` (string, opcional)
   - `teacherId` (FK - User.id, role = TEACHER)
   - `createdAt`, `updatedAt`

3. `Enrollment`
   - `id` (UUID)
   - `classId` (FK - Class.id)
   - `studentId` (FK - User.id, role = STUDENT)
   - `unique(classId, studentId)`

4. `Quiz`
   - `id` (UUID)
   - `title` (string)
   - `description` (string, opcional)
   - `ownerId` (FK - User.id, role = TEACHER)
   - `metadata` (JSON, p.ex. configs compatíveis com o frontend)
   - `isPublished` (boolean)
   - `createdAt`, `updatedAt`

5. `QuizQuestion`
   - `id` (UUID)
   - `quizId` (FK - Quiz.id)
   - `type` (enum: `MULTIPLE_CHOICE`, `TRUE_FALSE`, `ORDERING`, `MATCHING`, etc.)
   - `prompt` (string / texto da questão)
   - `options` (JSON)
   - `correctAnswer` (JSON)
   - `order` (int)

6. `QuizAssignment`
   - `id` (UUID)
   - `quizId` (FK - Quiz.id)
   - `classId` (FK - Class.id, opcional)
   - `studentId` (FK - User.id, opcional)
   - `availableFrom` (datetime, opcional)
   - `availableTo` (datetime, opcional)
   - `isActive` (boolean)
   - Regra: pelo menos um de `classId` ou `studentId` deve estar preenchido.

7. `QuizAttempt`
   - `id` (UUID)
   - `quizId` (FK - Quiz.id)
   - `studentId` (FK - User.id, STUDENT)
   - `assignmentId` (FK - QuizAssignment.id)
   - `answers` (JSON)
   - `score` (float ou int, opcional)
   - `status` (enum: `IN_PROGRESS`, `SUBMITTED`)
   - `startedAt`, `submittedAt`

### 2.2. Partilha de Quizzes entre Professores

Nova tabela para partilha explícita:

8. `QuizShare`
   - `id` (UUID)
   - `quizId` (FK - Quiz.id)
   - `ownerId` (FK - User.id, TEACHER que possui o quiz)
   - `sharedWithTeacherId` (FK - User.id, TEACHER que recebe acesso)
   - `canEdit` (boolean, default: `false`)
   - `createdAt`
   - `unique(quizId, sharedWithTeacherId)` para evitar duplicados.

Regras:
- Apenas o `ownerId` de um quiz pode criar/remover entradas `QuizShare`.
- Professores destinatários:
  - Têm acesso de leitura ao quiz partilhado.
  - Podem:
    - Usar diretamente o quiz partilhado nos seus assignments se permitido pelo modelo (ver abaixo), ou
    - Criar uma cópia (`Fork`) do quiz para o seu próprio ownership (recomendado para isolamento).
- Alunos nunca vêem este mecanismo; só vêem quizzes atribuídos pelas suas turmas.

Opcional para maior isolamento:
- Flow recomendado:
  - Professor B vê quizzes partilhados com ele.
  - Ao selecionar um quiz partilhado, pode:
    - Criar uma cópia (`Quiz` novo com `ownerId = B`, baseado no quiz original).
    - Atribuir este novo quiz às suas turmas.
  - Isto evita acoplamento de reporting entre professores diferentes.

### 2.3. Regras de Ownership e Multi-Tenant

- `Quiz.ownerId` define o professor responsável (tenant lógico) do quiz base.
- `Class.teacherId` define o professor responsável pela turma.
- Professores só podem:
  - Ver/editar `Quiz` onde `ownerId = req.user.id`.
  - Ver/editar `Class` onde `teacherId = req.user.id`.
  - Ver dados ligados (Assignments, Attempts) apenas dos seus recursos.
- Partilha:
  - Professores podem ver quizzes:
    - Que possuem (`ownerId = req.user.id`).
    - Que lhes foram partilhados (`QuizShare.sharedWithTeacherId = req.user.id`).
  - Ações permitidas sobre quizzes partilhados dependem de:
    - `canEdit = false` → só leitura + opção de copiar.
    - `canEdit = true` → permitido editar quiz partilhado (caso de colaboração mais profunda).
- Alunos:
  - Apenas quizzes atribuídos via `QuizAssignment` + `Enrollment`.

---

## 3. Arquitetura da API Node/Express

### 3.1. Stack Técnica

- Node.js
- Express
- ORM: Prisma (com PostgreSQL/SQLite)
- Autenticação: JWT (`jsonwebtoken`)
- Hash de password: `bcryptjs`
- Validação: `zod` ou `express-validator`
- CORS, dotenv, logger simples
- Opcional: Helmet e rate limiting

### 3.2. Estrutura de Pastas (Backend)

No diretório `api/` (a criar):

- `api/src/server.ts`
- `api/src/config/env.ts`
- `api/src/config/db.ts`
- `api/src/middleware/auth.ts`
- `api/src/middleware/rbac.ts`
- `api/src/middleware/errorHandler.ts`
- `api/src/modules/auth/auth.controller.ts`
- `api/src/modules/auth/auth.routes.ts`
- `api/src/modules/users/user.controller.ts`
- `api/src/modules/users/user.routes.ts`
- `api/src/modules/classes/class.controller.ts`
- `api/src/modules/classes/class.routes.ts`
- `api/src/modules/quizzes/quiz.controller.ts`
- `api/src/modules/quizzes/quiz.routes.ts`
- `api/src/modules/assignments/assignment.controller.ts`
- `api/src/modules/assignments/assignment.routes.ts`
- `api/src/modules/attempts/attempt.controller.ts`
- `api/src/modules/attempts/attempt.routes.ts`
- `api/src/modules/shares/share.controller.ts`
- `api/src/modules/shares/share.routes.ts`
- `api/prisma/schema.prisma`

Padrão:
- Routers → endpoints + validação.
- Controllers → input/output HTTP.
- Services → lógica de negócio (incluindo ownership e partilha).
- Middleware → auth JWT, RBAC, checks de partilha, logging, erros.

---

## 4. Fluxo de Autenticação e Autorização

### 4.1. Autenticação (JWT)

Endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

Middleware `auth`:
- Lê `Authorization: Bearer <token>`.
- Valida token.
- Define `req.user = { id, role }`.

### 4.2. RBAC (Role-Based Access Control)

Middleware `rbac`:
- `requireRole("TEACHER")`
- `requireRole("STUDENT")`
- `requireAnyRole(["TEACHER", "ADMIN"])`

Aplicação:
- Criar quiz: TEACHER/ADMIN.
- Criar turma: TEACHER/ADMIN.
- Partilhar quiz: apenas TEACHER owner desse quiz.
- Ver submissões dos quizzes: TEACHER owner ou ADMIN.

### 4.3. Ownership + Partilha

Implementado em services (exemplo para quiz):

- Ao obter quizzes do professor:
  - `ownerId = req.user.id` OR
  - existe `QuizShare` com `sharedWithTeacherId = req.user.id` (para listagem de “quizzes partilhados comigo”).
- Ao editar quiz:
  - Se TEACHER:
    - Só permite se `ownerId = req.user.id`, ou
    - Se existir `QuizShare.canEdit = true` para esse professor (se suportado).
- Ao criar assignments:
  - Recomenda-se criar assignments apenas a partir de quizzes próprios (ou cópias de partilhados).

---

## 5. Endpoints Planeados

Prefixo geral: `/api`.

### 5.1. Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### 5.2. Users

- `GET /api/users/me`
- `GET /api/users/:id` (ADMIN ou contexto restrito)
- `POST /api/users` (ADMIN)
- `PATCH /api/users/:id` (self ou ADMIN)

### 5.3. Classes (Turmas/Cursos)

- `POST /api/classes` (TEACHER)
- `GET /api/classes`
- `GET /api/classes/:id`
- `POST /api/classes/:id/enroll` (TEACHER/ADMIN)
- `GET /api/classes/:id/students`

### 5.4. Quizzes

- `POST /api/quizzes` (TEACHER)
- `GET /api/quizzes`
  - TEACHER:
    - Quizzes próprios.
    - Opcional: endpoint separado para quizzes partilhados.
  - ADMIN:
    - Todos.
  - STUDENT:
    - Apenas quizzes atribuídos (via assignments).
- `GET /api/quizzes/:id`
  - Respeita ownership/partilha/assignments.
- `PATCH /api/quizzes/:id` (TEACHER owner ou TEACHER com `canEdit` ou ADMIN)
- `DELETE /api/quizzes/:id` (TEACHER owner ou ADMIN)
- Gestão de questões:
  - `GET /api/quizzes/:id/questions`
  - `POST /api/quizzes/:id/questions`
  - `PATCH /api/quizzes/:id/questions/:questionId`
  - `DELETE /api/quizzes/:id/questions/:questionId`

### 5.5. Assignments (Disponibilização de Quizzes aos Alunos)

- `POST /api/assignments` (TEACHER)
- `GET /api/assignments`
- `GET /api/assignments/:id`

### 5.6. Attempts (Submissões)

- `POST /api/quizzes/:quizId/attempts` (STUDENT)
- `PATCH /api/attempts/:id` ou `POST /api/attempts/:id/submit`
- `GET /api/attempts/:id`
- `GET /api/quizzes/:quizId/attempts` (TEACHER owner)

### 5.7. Partilha de Quizzes entre Professores

Novos endpoints sob `/api/shares` ou integrados em `/api/quizzes`:

- `POST /api/quizzes/:id/share` (TEACHER owner)
  - body:
    - `sharedWithTeacherId`
    - `canEdit` (boolean, opcional, default: false)
  - Cria entrada em `QuizShare`.

- `GET /api/quizzes/shared-with-me` (TEACHER)
  - Lista quizzes para os quais existe `QuizShare.sharedWithTeacherId = req.user.id`.

- `GET /api/quizzes/:id/shared-with` (TEACHER owner)
  - Lista de professores com quem este quiz está partilhado.

- `DELETE /api/quizzes/:id/share/:sharedWithTeacherId` (TEACHER owner)
  - Revoga partilha.

Opcional (recomendado para isolamento):

- `POST /api/quizzes/:id/fork` (TEACHER com acesso — owner ou partilhado)
  - Cria um novo `Quiz` com `ownerId = req.user.id` e cópia das perguntas.
  - Este novo quiz passa a ser totalmente gerido pelo novo owner.

Regras de segurança:
- Apenas professores podem ser `sharedWithTeacherId`.
- Alunos não têm qualquer acesso adicional via partilha.

---

## 6. Integração com o Frontend Atual

### 6.1. Base URL e Cliente HTTP

- Definir `API_BASE_URL` em `src/lib/api/apiConfig.ts`.
- Cliente HTTP com:
  - Interceptor de `Authorization`.
  - Gestão de tokens.

### 6.2. Módulos de API no Frontend

- `src/lib/api/auth.ts`
- `src/lib/api/quizzes.ts`
  - Métodos para:
    - quizzes próprios do professor
    - quizzes partilhados comigo
    - partilhar/revogar partilha
    - opcional: fork de quiz
- `src/lib/api/classes.ts`
- `src/lib/api/assignments.ts`
- `src/lib/api/attempts.ts`

### 6.3. UI/UX Partilha entre Professores

- Na área de professor:
  - Ecrã/listagem de quizzes com ações:
    - "Partilhar" → selecionar professores alvo.
    - "Ver partilhas" → quem tem acesso.
    - "Revogar partilha".
  - Secção "Quizzes partilhados comigo":
    - Mostrar quizzes de outros professores.
    - Botão "Usar este quiz" → faz fork ou permite uso consoante regra escolhida no backend.

---

## 7. Persistência, Migrações e Configuração

### 7.1. Prisma (Exemplo)

- Incluir modelos para `QuizShare`.
- Criar migrações:
  - `npx prisma migrate dev --name init`
  - Atualizações subsequentes para partilha se necessário.

### 7.2. Configuração

- `.env` em `api/`:
  - `DATABASE_URL=...`
  - `JWT_ACCESS_SECRET=...`
  - `JWT_REFRESH_SECRET=...`
  - `PORT=4000` (por exemplo)

---

## 8. Implementação da Estrutura Base (Passo a Passo)

1. Definir schema Prisma (incluindo `QuizShare`).
2. Implementar infraestrutura (server, db, middlewares).
3. Implementar autenticação + JWT + RBAC.
4. Implementar CRUD de quizzes com ownership.
5. Implementar módulo de partilha de quizzes:
   - Endpoints para criar/listar/remover partilhas e fork.
6. Implementar turmas + enrollments.
7. Implementar assignments.
8. Implementar attempts + scoring.
9. Integrar frontend com a nova API, incluindo UI para partilha.
10. Adicionar testes, logging, documentação.

---

## 9. Validação, Testes e Documentação

### 9.1. Validação

- Validar todos inputs (incluindo IDs de professores alvo na partilha).
- Garantir que apenas TEACHER pode partilhar e apenas TEACHER pode ser destinatário.

### 9.2. Testes

- Testes unitários:
  - Regras de ownership.
  - Regras de partilha (apenas owner pode partilhar/revogar; destinatário vê mas não altera se `canEdit=false`).
- Testes de integração:
  - Fluxo:
    - Professor A cria quiz.
    - Professor A partilha com Professor B.
    - Professor B vê quiz partilhado e cria fork.
    - Professor B atribui fork às suas turmas.
    - Aluno responde e Professor B vê resultados.

### 9.3. Documentação (OpenAPI/Swagger)

- Documentar endpoints de partilha:
  - Contratos claros para criação, listagem e remoção de partilhas.
  - Cláusulas de segurança: apenas TEACHER/ADMIN.

---

## 10. Integração com MCP (Model Context Protocol)

### 10.1. Objetivo

Permitir que agentes externos (via MCP) usem:
- Quizzes do professor.
- Quizzes partilhados entre professores.
- Funções de sugestão, geração e análise de quizzes.

### 10.2. Ferramentas MCP Relevantes

- `list_my_quizzes(teacherId)`
- `list_shared_quizzes_with_me(teacherId)`
- `share_quiz(quizId, sharedWithTeacherId)`
- `revoke_quiz_share(quizId, sharedWithTeacherId)`
- `fork_shared_quiz(quizId, newOwnerTeacherId)`
- Outras ligadas a assignments e attempts.

### 10.3. Estratégia

- MCP server dedicado (`quiz-mcp`) que:
  - Chama esta API com tokens de serviço.
  - Respeita roles e partilhas exatamente como o frontend.

---

## 11. Roadmap de Implementação

1. Schema de dados + migrações (incluindo `QuizShare`).
2. Infraestrutura Express/Prisma/middlewares.
3. Autenticação + JWT + RBAC.
4. CRUD de quizzes com ownership.
5. Módulo de partilha de quizzes (endpoints + lógica).
6. Turmas, enrollments, assignments.
7. Attempts + scoring.
8. Integração frontend (incluindo UI de partilha).
9. Testes e documentação.
10. Integração MCP futura.

Este plano atualizado garante não só isolamento por professor e gestão de quizzes/turmas/alunos, mas também um mecanismo robusto de partilha exclusiva de quizzes entre professores, mantendo segurança e controlo total sobre quem pode ver, usar ou copiar cada quiz.