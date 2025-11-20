/**
 * Facade da camada de API do frontend.
 *
 * Este ficheiro expõe funções de alto nível utilizadas pelo UI,
 * delegando a lógica real para o httpClient centralizado.
 *
 * IMPORTANTE:
 * - Toda a comunicação com o backend Angela Quiz deve passar por aqui
 *   ou por httpClient, nunca diretamente a partir de componentes.
 */

import type { Quiz, Question } from '../../types'
import {
  httpClient,
  fetchMyQuizzes,
  fetchQuizById,
  fetchQuizQuestions,
  createQuizApi,
  createQuestionApi,
  updateQuizApi,
  deleteQuizApi,
  updateQuestionApi,
  deleteQuestionApi,
  // Classes
  listClassesForCurrentUser,
  getClassById,
  createClassApi,
  updateClassApi,
  deleteClassApi,
  enrollStudentInClassApi,
  enrollStudentInClassByEmailApi,
  getStudentsFromClassApi,
  // Assignments
  listAssignmentsForCurrentUser,
  getAssignmentById,
  createAssignmentApi,
  updateAssignmentApi,
  deleteAssignmentApi,
  // Attempts
  startAttemptApi,
  submitAttemptApi,
  getAttemptByIdApi,
  // Shares & Forks
  shareQuizApi,
  shareQuizByEmailApi,
  listSharesForQuizApi,
  revokeShareApi,
  listQuizzesSharedWithMeApi,
  forkQuizApi,
  // Statistics & Reports
  getQuizStatistics,
  getClassStatistics,
  getStudentAttempts,
  getQuizAttempts,
  getAssignmentStatistics,
  // User Search
  searchUsersByEmail,
  searchTeachersByEmail,
  searchStudentsByEmail,
} from './httpClient'

/**
 * Obtém quizzes visíveis para o utilizador autenticado.
 * Alinha com GET /api/quizzes.
 */
export async function getQuizzes(): Promise<Quiz[]> {
  return fetchMyQuizzes()
}

export async function getQuizById(id: string): Promise<Quiz | null> {
  return fetchQuizById(id)
}

/**
 * Obtém perguntas de um quiz específico.
 * Alinha com GET /api/quizzes/{id}/questions.
 */
export async function getQuizQuestions(quizId: string): Promise<Question[]> {
  return fetchQuizQuestions(quizId)
}

export async function createQuiz(input: {
  title: string
  description?: string
  grade?: string
  supportText?: string
  youtubeVideos?: string[]
}): Promise<{ id: string }> {
  const metadata =
    input.grade && input.grade.trim().length > 0 ? { grade: input.grade.trim() } : undefined
  return createQuizApi({
    title: input.title,
    description: input.description,
    metadata,
    supportText: input.supportText,
    youtubeVideos: input.youtubeVideos,
  })
}

export async function updateQuiz(input: {
  id: string
  title?: string
  description?: string
  grade?: string
  isPublished?: boolean
  supportText?: string
  youtubeVideos?: string[]
}): Promise<void> {
  const metadata =
    input.grade !== undefined
      ? {
          grade: input.grade,
        }
      : undefined
  await updateQuizApi(input.id, {
    title: input.title,
    description: input.description,
    metadata,
    isPublished: input.isPublished,
    supportText: input.supportText,
    youtubeVideos: input.youtubeVideos,
  })
}

export async function deleteQuiz(id: string): Promise<void> {
  await deleteQuizApi(id)
}

/**
 * Cria uma pergunta para um quiz (Teacher/Admin).
 * Wrapper para POST /api/quizzes/{id}/questions.
 */
export async function createQuestion(
  quizId: string,
  question: Omit<Question, 'id'>
): Promise<{ id: string }> {
  return createQuestionApi(quizId, question)
}

export async function updateQuestion(
  quizId: string,
  questionId: string,
  question: Omit<Question, 'id'>,
): Promise<void> {
  await updateQuestionApi(quizId, questionId, question)
}

export async function deleteQuestion(quizId: string, questionId: string): Promise<void> {
  await deleteQuestionApi(quizId, questionId)
}

/**
 * CLASSES (Teacher/Admin/Student)
 * Alinhado com /api/classes*.
 */
export const classesApi = {
  listForCurrentUser: () => listClassesForCurrentUser(),
  getById: (id: string) => getClassById(id),
  create: (input: { name: string; description?: string; teacherId?: string }) =>
    createClassApi(input),
  update: (
    id: string,
    input: Partial<{ name: string; description: string }>
  ) => updateClassApi(id, input),
  remove: (id: string) => deleteClassApi(id),
  enrollStudent: (classId: string, studentId: string) =>
    enrollStudentInClassApi({ classId, studentId }),
  enrollStudentByEmail: (classId: string, email: string) =>
    enrollStudentInClassByEmailApi({ classId, email }),
  getStudents: (classId: string) => getStudentsFromClassApi(classId),
}

/**
 * ASSIGNMENTS (Teacher/Admin/Student)
 */
export const assignmentsApi = {
  /**
   * Lista assignments visíveis para o utilizador autenticado.
   * Alinha com GET /api/assignments.
   */
  listForCurrentUser: () => listAssignmentsForCurrentUser(),

  /**
   * Obtém um assignment específico.
   * Alinha com GET /api/assignments/{id}.
   */
  getById: (id: string) => getAssignmentById(id),

  /**
   * Cria assignment (Teacher/Admin).
   * Alinha com POST /api/assignments.
   */
  create: (input: {
    quizId: string
    classId?: string
    studentId?: string
    availableFrom?: string
    availableTo?: string
  }) => createAssignmentApi(input),

  /**
   * Atualiza assignment (Teacher/Admin).
   * Alinha com PATCH /api/assignments/{id}.
   */
  update: (
    id: string,
    input: Partial<{ availableFrom: string | null; availableTo: string | null; isActive: boolean }>
  ) => updateAssignmentApi(id, input),

  /**
   * Remove assignment (Teacher/Admin).
   * Alinha com DELETE /api/assignments/{id}.
   */
  remove: (id: string) => deleteAssignmentApi(id),
}

/**
 * ATTEMPTS (Student)
 */
export const attemptsApi = {
  /**
   * Inicia um attempt para um quiz (Student).
   * Alinha com POST /api/quizzes/{quizId}/attempts.
   */
  start: (quizId: string, assignmentId: string) =>
    startAttemptApi({ quizId, assignmentId }),

  /**
   * Submete um attempt (Student).
   * Alinha com POST /api/attempts/{id}/submit.
   */
  submit: (attemptId: string, answers: Record<string, any>) =>
    submitAttemptApi({ attemptId, answers }),

  /**
   * Obtém detalhes de um attempt.
   * Alinha com GET /api/attempts/{id}.
   */
  getById: (id: string) => getAttemptByIdApi(id),
}

/**
 * SHARES & FORKS (Teacher)
 * Alto nível para partilha e fork de quizzes.
 */
export const sharesApi = {
  shareQuiz: (quizId: string, sharedWithTeacherId: string, canEdit?: boolean) =>
    shareQuizApi({ quizId, sharedWithTeacherId, canEdit }),
  shareQuizByEmail: (quizId: string, sharedWithTeacherEmail: string, canEdit?: boolean) =>
    shareQuizByEmailApi({ quizId, sharedWithTeacherEmail, canEdit }),
  listSharesForQuiz: (quizId: string) => listSharesForQuizApi(quizId),
  revokeShare: (quizId: string, sharedWithTeacherId: string) =>
    revokeShareApi({ quizId, sharedWithTeacherId }),
  listSharedWithMe: () => listQuizzesSharedWithMeApi(),
  forkSharedQuiz: (quizId: string) => forkQuizApi(quizId),
}

export async function forkQuiz(quizId: string) {
  return forkQuizApi(quizId)
}

/**
 * STATISTICS & REPORTS (Teacher/Admin/Student)
 * Endpoints para obter dados estatísticos para relatórios
 */
export const statisticsApi = {
  /**
   * Obtém estatísticas de um quiz específico.
   * Alinha com GET /api/statistics/quiz/{id}.
   */
  getQuizStatistics: (quizId: string) => getQuizStatistics(quizId),

  /**
   * Obtém estatísticas de uma turma.
   * Alinha com GET /api/statistics/class/{id}.
   */
  getClassStatistics: (classId: string) => getClassStatistics(classId),

  /**
   * Obtém tentativas de um aluno.
   * Alinha com GET /api/statistics/student/{studentId}/attempts.
   */
  getStudentAttempts: (studentId: string, quizId?: string) =>
    getStudentAttempts(studentId, quizId),

  /**
   * Obtém todas as tentativas de um quiz.
   * Alinha com GET /api/statistics/quiz/{quizId}/attempts.
   */
  getQuizAttempts: (quizId: string) => getQuizAttempts(quizId),

  /**
   * Obtém estatísticas de um assignment.
   * Alinha com GET /api/statistics/assignment/{id}.
   */
  getAssignmentStatistics: (assignmentId: string) => getAssignmentStatistics(assignmentId),
}

/**
 * Salvar resultado de quiz:
 * Para manter compat com código existente, delega para attemptsApi quando tivermos attemptId.
 * Caso seja chamado sem attemptId (legado), não quebra e faz apenas log.
 */
export async function saveQuizResult(result: { attemptId?: string; answers?: Record<string, any> } & any): Promise<void> {
  if (result?.attemptId && result?.answers) {
    await attemptsApi.submit(result.attemptId, result.answers)
    return
  }
  console.warn('[API] saveQuizResult chamado sem attemptId/answers; nenhuma chamada à API foi efetuada.')
}

/**
 * USER SEARCH
 * Funções para buscar usuários na base de dados
 */
export const usersApi = {
  /**
   * Busca usuários por email
   * Alinha com GET /api/users/search?email={email}
   */
  searchByEmail: (email: string) => searchUsersByEmail(email),

  /**
   * Busca professores por email
   * Alinha com GET /api/users/teachers/search?email={email}
   */
  searchTeachersByEmail: (email: string) => searchTeachersByEmail(email),

  /**
   * Busca alunos por email
   * Alinha com GET /api/users/students/search?email={email}
   */
  searchStudentsByEmail: (email: string) => searchStudentsByEmail(email),
}

/**
 * Reexportar utilitários úteis (tokens, baseURL) quando necessário.
 */
export const apiConfig = {
  baseUrl: httpClient.API_BASE_URL,
}
