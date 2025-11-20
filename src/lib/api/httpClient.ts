import type { Quiz, Question } from '../../types'
import type { QType } from '../../types/quiz'

/**
 * HTTP client centralizado para falar com a API Angela Quiz.
 * - Usa baseURL configurável (por agora default http://localhost:4000 via VITE_API_BASE_URL).
 * - Gere Authorization: Bearer & refresh token.
 * - Normaliza o envelope { success, data, message } definido em docs/openapi-contract.md.
 * - Mantém tudo isolado para facilitar troca de implementação.
 */

// Resolve base URL priorizando variável de ambiente e evitando cair em localhost em produção.
const API_BASE_URL = (() => {
  const envUrl = import.meta.env.VITE_API_BASE_URL?.trim()
  if (envUrl) return envUrl
  if (import.meta.env.PROD) return 'https://api-angela-ai-rc1m.vercel.app'
  return 'http://localhost:4000'
})()

export interface ApiEnvelope<T> {
  success: boolean
  data: T | null
  message?: string
}

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT'
export type UserStatus = 'ACTIVE' | 'PENDING' | 'REJECTED'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  createdAt?: string
  updatedAt?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

/**
 * Armazenamento de tokens (por agora localStorage, mas encapsulado)
 */
const ACCESS_TOKEN_KEY = 'angela_auth_access_token'
const REFRESH_TOKEN_KEY = 'angela_auth_refresh_token'

function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

function setTokens(tokens: AuthTokens | null): void {
  try {
    if (!tokens) {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      return
    }
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  } catch {
    // Ignore storage errors
  }
}

function buildHeaders(extra?: HeadersInit): HeadersInit {
  const base: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Copiar headers extra (podem ser Headers, string[][] ou Record)
  if (extra) {
    if (extra instanceof Headers) {
      extra.forEach((value, key) => {
        base[key] = value
      })
    } else if (Array.isArray(extra)) {
      for (const [key, value] of extra) {
        base[key] = value
      }
    } else {
      Object.assign(base, extra)
    }
  }

  const token = getAccessToken()
  if (token) {
    base.Authorization = `Bearer ${token}`
  }

  return base
}

async function parseResponse<T>(response: Response): Promise<T> {
  let json: any
  try {
    json = await response.json()
  } catch {
    throw new Error('Resposta inválida do servidor')
  }

  const envelope = json as ApiEnvelope<T>

  if (!response.ok || envelope.success === false) {
    const message =
      envelope?.message ||
      json?.message ||
      `Erro HTTP ${response.status} ${response.statusText}`

    if (response.status === 401) {
      throw Object.assign(new Error(message), { code: 401 })
    }

    if (response.status === 403) {
      throw Object.assign(new Error(message), { code: 403 })
    }

    throw new Error(message)
  }

  return envelope.data as T
}

/**
 * Tenta refrescar tokens usando /api/auth/refresh.
 * Se falhar, limpa tokens e lança erro 401.
 */
async function tryRefreshToken(): Promise<void> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw Object.assign(new Error('Sessão expirada'), { code: 401 })
  }

  const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  let json: any
  try {
    json = await res.json()
  } catch {
    setTokens(null)
    throw Object.assign(new Error('Falha ao renovar sessão'), { code: 401 })
  }

  if (!res.ok || !json?.success || !json?.data?.accessToken) {
    setTokens(null)
    throw Object.assign(new Error(json?.message || 'Sessão expirada'), { code: 401 })
  }

  const tokens: AuthTokens = {
    accessToken: json.data.accessToken,
    refreshToken: json.data.refreshToken ?? refreshToken,
  }
  setTokens(tokens)
}

/**
 * Wrapper com retry 401 -> refresh -> retry.
 */
async function requestWithAuthRetry<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const firstResponse = await fetch(input, {
    ...init,
    headers: buildHeaders(init?.headers),
  })

  if (firstResponse.status !== 401) {
    return parseResponse<T>(firstResponse)
  }

  // Tentar refresh
  try {
    await tryRefreshToken()
  } catch (e: any) {
    throw e
  }

  // Retry com novo token
  const retryResponse = await fetch(input, {
    ...init,
    headers: buildHeaders(init?.headers),
  })

  return parseResponse<T>(retryResponse)
}

/**
 * ENDPOINTS DE AUTENTICAÇÃO
 */

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await parseResponse<AuthResponse>(res)
  setTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  })
  return data
}

export async function registerUser(input: {
  name: string
  email: string
  password: string
  role?: UserRole
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role,
    }),
  })

  return parseResponse<AuthResponse>(res)
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: buildHeaders(),
    })
  } finally {
    setTokens(null)
  }
}

type AdminUserFilter = {
  status?: UserStatus
  role?: UserRole
}

async function adminListUsers(filter?: AdminUserFilter): Promise<AuthUser[]> {
  const params = new URLSearchParams()
  if (filter?.status) params.set('status', filter.status)
  if (filter?.role) params.set('role', filter.role)

  const query = params.toString()
  return requestWithAuthRetry<AuthUser[]>(
    `${API_BASE_URL}/api/admin/users${query ? `?${query}` : ''}`,
    { method: 'GET' }
  )
}

async function adminApproveUser(userId: string): Promise<AuthUser> {
  return requestWithAuthRetry<AuthUser>(
    `${API_BASE_URL}/api/admin/users/${userId}/approve`,
    {
      method: 'POST',
      headers: buildHeaders(),
    }
  )
}

async function adminRejectUser(userId: string): Promise<AuthUser> {
  return requestWithAuthRetry<AuthUser>(
    `${API_BASE_URL}/api/admin/users/${userId}/reject`,
    {
      method: 'POST',
      headers: buildHeaders(),
    }
  )
}

async function adminUpdateUserStatus(
  userId: string,
  status: UserStatus
): Promise<AuthUser> {
  return requestWithAuthRetry<AuthUser>(
    `${API_BASE_URL}/api/admin/users/${userId}/status`,
    {
      method: 'PATCH',
      headers: buildHeaders(),
      body: JSON.stringify({ status }),
    }
  )
}

async function adminDeleteUser(userId: string): Promise<void> {
  await requestWithAuthRetry<null>(
    `${API_BASE_URL}/api/admin/users/${userId}`,
    {
      method: 'DELETE',
      headers: buildHeaders(),
    }
  )
}

async function adminCreateUser(input: {
  name: string
  email: string
  password: string
  role: UserRole
  status?: UserStatus
}): Promise<AuthUser> {
  return requestWithAuthRetry<AuthUser>(`${API_BASE_URL}/api/admin/users`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role,
      status: input.status,
    }),
  })
}

/**
 * TIPOS ALINHADOS COM API (simplificados para o frontend)
 */

export interface ApiQuizSummary {
  id: string
  title: string
  description?: string | null
  metadata?: Record<string, unknown> | null
  ownerId: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
  questionCount?: number
}

export interface ApiQuizQuestion {
  id: string
  quizId: string
  type: string // API usa enum textual; mapeamos para QType onde fizer sentido
  prompt: string
  options?: any
  correctAnswer?: any
  order: number
}

export interface ApiAssignment {
  id: string
  quizId: string
  classId?: string | null
  studentId?: string | null
  isActive: boolean
  availableFrom?: string | null
  availableTo?: string | null
  createdAt: string
  updatedAt: string
}

export interface ApiClass {
  id: string
  name: string
  description?: string | null
  teacherId: string
  createdAt: string
  updatedAt: string
}

export interface ApiShare {
  id: string
  quizId: string
  ownerId: string
  sharedWithTeacherId: string
  canEdit: boolean
  createdAt: string
}

export interface ApiAttempt {
  id: string
  quizId: string
  assignmentId: string
  studentId: string
  answers: Record<string, any>
  status: 'IN_PROGRESS' | 'SUBMITTED'
  startedAt: string
  submittedAt?: string | null
  score?: number | null
  maxScore?: number | null
}

// Interfaces para relatórios e estatísticas
export interface QuizStatistics {
  quizId: string
  title: string
  totalAttempts: number
  averageScore: number
  maxScore?: number
  minScore?: number
  passRate: number
  averageTimeMinutes: number
  questionStatistics: QuestionStatistics[]
  attemptsByDate?: AttemptsByDate[]
}

export interface QuestionStatistics {
  questionId: string
  prompt: string
  type: string
  correctAnswers: number
  incorrectAnswers: number
  correctRate: number
  mostCommonWrongAnswer?: string
}

export interface AttemptsByDate {
  date: string
  count: number
  averageScore: number
}

export interface ClassStatistics {
  classId: string
  name: string
  totalStudents: number
  activeStudents: number
  totalAttempts: number
  averageScore: number
  quizStatistics?: QuizStatistics[]
  topPerformers?: StudentPerformance[]
  strugglingStudents?: StudentPerformance[]
}

export interface StudentPerformance {
  studentId: string
  name: string
  email?: string
  totalAttempts: number
  averageScore: number
  lastActivity: string
  completedQuizzes: string[]
}

export interface StudentAttempt {
  id: string
  quizId: string
  quizTitle: string
  assignmentId: string
  studentId?: string
  studentName?: string
  score: number
  maxScore: number
  percentage: number
  status: 'IN_PROGRESS' | 'SUBMITTED'
  startedAt: string
  submittedAt?: string | null
  timeSpentMinutes: number
  answers: Record<string, any>
}

export interface AssignmentStatistics {
  assignmentId: string
  quizId: string
  quizTitle: string
  classId?: string
  className?: string
  totalAssigned: number
  totalAttempts: number
  completionRate: number
  averageScore: number
  averageTimeMinutes?: number
  dueDate?: string
  status: 'ACTIVE' | 'EXPIRED' | 'DRAFT'
}

/**
 * HELPERS DE MAPEAMENTO API -> TIPOS LOCAIS
 * Mantém compatibilidade incremental com os componentes existentes.
 */

function mapApiQuestionToLocal(q: ApiQuizQuestion): Question {
  const base: Question = {
    id: q.id,
    type: mapApiTypeToLocal(q.type),
    prompt: q.prompt,
  }

  // Para MULTIPLE_CHOICE da API, esperamos options como array ou objeto; aqui suportamos array simples.
  if (q.type === 'MULTIPLE_CHOICE' && Array.isArray(q.options)) {
    base.choices = q.options.map((opt: any, index: number) => {
      const optionText = typeof opt === 'string' ? opt : opt.text ?? String(opt)
      return {
        id: opt.id ?? String(index + 1),
        text: optionText,
        correct: q.correctAnswer === optionText,
      }
    })
  }

  // TRUE_FALSE simplificado
  if (q.type === 'TRUE_FALSE') {
    base.type = 'truefalse'
    // Create choices array for consistency with frontend expectations
    if (Array.isArray(q.options) && q.options.length > 0) {
      // If options are provided, use them
      base.choices = q.options.map((opt: any, index: number) => {
        const optionText = typeof opt === 'string' ? opt : opt.text ?? String(opt)
        return {
          id: opt.id ?? String(index + 1),
          text: optionText,
          correct: q.correctAnswer === optionText,
        }
      })
    } else {
      // If no options, create default Verdadeiro/Falso choices
      const correctAnswer = typeof q.correctAnswer === 'string' ? q.correctAnswer : (q.correctAnswer ? 'Verdadeiro' : 'Falso')
      base.choices = [
        { id: '1', text: 'Verdadeiro', correct: correctAnswer === 'Verdadeiro' },
        { id: '2', text: 'Falso', correct: correctAnswer === 'Falso' }
      ]
    }
  }

  // SHORT_ANSWER/FILL_IN_THE_BLANK/OPEN_ENDED normalizados para answer string
  if (
    q.type === 'SHORT_ANSWER' ||
    q.type === 'FILL_IN_THE_BLANK' ||
    q.type === 'OPEN_ENDED'
  ) {
    base.type =
      q.type === 'SHORT_ANSWER'
        ? 'short'
        : q.type === 'FILL_IN_THE_BLANK'
        ? 'gapfill'
        : 'essay'
    if (q.correctAnswer != null) {
      base.answer = String(q.correctAnswer)
    }
  }

  // Outros tipos (MATCHING, ORDERING) podem ser mapeados depois conforme necessidade

  return base
}

function mapApiTypeToLocal(apiType: string): QType {
  switch (apiType) {
    case 'MULTIPLE_CHOICE':
      return 'mcq'
    case 'TRUE_FALSE':
      return 'truefalse'
    case 'SHORT_ANSWER':
      return 'short'
    case 'FILL_IN_THE_BLANK':
      return 'gapfill'
    case 'OPEN_ENDED':
      return 'essay'
    case 'MATCHING':
      return 'matching'
    case 'ORDERING':
      return 'ordering'
    default:
      return 'mcq'
  }
}

/**
 * LISTAR QUIZZES VISÍVEIS PARA O UTILIZADOR AUTENTICADO
 * - TEACHER/ADMIN: usa GET /api/quizzes conforme contrato.
 * - STUDENT: normalmente acede via assignments; aqui devolvemos vazio.
 */
export async function fetchMyQuizzes(): Promise<Quiz[]> {
  const data = await requestWithAuthRetry<ApiQuizSummary[]>(
    `${API_BASE_URL}/api/quizzes`,
    { method: 'GET' }
  )

  if (!data || data.length === 0) {
    return []
  }

  return data.map((q) => ({
    id: q.id,
    title: q.title,
    subject: q.description ?? '',
    grade:
      typeof q.metadata === 'object' && q.metadata !== null && 'grade' in q.metadata
        ? String((q.metadata as Record<string, unknown>).grade ?? '')
        : '',
    questions: [], // carregadas on-demand via fetchQuizQuestions
    questionCount: typeof q.questionCount === 'number' ? q.questionCount : undefined,
    createdAt: new Date(q.createdAt).getTime(),
    updatedAt: new Date(q.updatedAt).getTime(),
    isPublished: q.isPublished,
  }))
}

export async function fetchQuizById(id: string): Promise<Quiz | null> {
  try {
    const data = await requestWithAuthRetry<ApiQuizSummary>(
      `${API_BASE_URL}/api/quizzes/${id}`,
      { method: 'GET' },
    )

    return {
      id: data.id,
      title: data.title,
      subject: data.description ?? '',
      grade:
        typeof data.metadata === 'object' &&
        data.metadata !== null &&
        'grade' in data.metadata
          ? String((data.metadata as Record<string, unknown>).grade ?? '')
          : '',
      questions: [],
    createdAt: new Date(data.createdAt).getTime(),
    updatedAt: new Date(data.updatedAt).getTime(),
    isPublished: data.isPublished,
    questionCount: typeof data.questionCount === 'number' ? data.questionCount : undefined,
  }
  } catch (error) {
    console.error('[API] fetchQuizById falhou:', error)
    return null
  }
}

/**
 * OBTÉM PERGUNTAS DE UM QUIZ E DEVOLVE NO FORMATO LOCAL
 */
export async function fetchQuizQuestions(quizId: string): Promise<Question[]> {
  const data = await requestWithAuthRetry<ApiQuizQuestion[]>(
    `${API_BASE_URL}/api/quizzes/${quizId}/questions`,
    {
      method: 'GET',
    }
  )

  return (data ?? []).map(mapApiQuestionToLocal)
}

/**
 * Criação de quiz para TEACHER.
 * Usa POST /api/quizzes e retorna id para integrar com UI existente.
 */
export async function createQuizApi(input: {
  title: string
  description?: string
  metadata?: Record<string, unknown> | null
}): Promise<{ id: string }> {
  const data = await requestWithAuthRetry<ApiQuizSummary>(
    `${API_BASE_URL}/api/quizzes`,
    {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({
        title: input.title,
        description: input.description ?? '',
        metadata: input.metadata ?? null,
      }),
    }
  )

  return { id: data.id }
}

export async function updateQuizApi(
  id: string,
  input: Partial<{
    title: string
    description?: string | null
    metadata?: Record<string, unknown> | null
    isPublished?: boolean
  }>,
): Promise<ApiQuizSummary> {
  return requestWithAuthRetry<ApiQuizSummary>(`${API_BASE_URL}/api/quizzes/${id}`, {
    method: 'PATCH',
    headers: buildHeaders(),
    body: JSON.stringify(input),
  })
}

export async function deleteQuizApi(id: string): Promise<void> {
  await requestWithAuthRetry<null>(`${API_BASE_URL}/api/quizzes/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  })
}

/**
 * Cria pergunta para um quiz (TEACHER).
 * A UI atual usa o modelo local; aqui convertemos para o payload esperado pela API.
 */
export async function createQuestionApi(
  quizId: string,
  question: Omit<Question, 'id'>
): Promise<{ id: string }> {
  const body = mapQuestionToApiPayload(question)
  const data = await requestWithAuthRetry<ApiQuizQuestion>(
    `${API_BASE_URL}/api/quizzes/${quizId}/questions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )

  return { id: data.id }
}

export async function updateQuestionApi(
  quizId: string,
  questionId: string,
  question: Omit<Question, 'id'>,
): Promise<ApiQuizQuestion> {
  const body = mapQuestionToApiPayload(question)
  return requestWithAuthRetry<ApiQuizQuestion>(
    `${API_BASE_URL}/api/quizzes/${quizId}/questions/${questionId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
}

export async function deleteQuestionApi(quizId: string, questionId: string): Promise<void> {
  await requestWithAuthRetry<null>(
    `${API_BASE_URL}/api/quizzes/${quizId}/questions/${questionId}`,
    {
      method: 'DELETE',
      headers: buildHeaders(),
    },
  )
}

/**
 * CLASSES (Teacher/Admin/Student)
 */

export async function listClassesForCurrentUser(): Promise<ApiClass[]> {
  return requestWithAuthRetry<ApiClass[]>(
    `${API_BASE_URL}/api/classes`,
    { method: 'GET' }
  )
}

export async function getClassById(id: string): Promise<ApiClass> {
  return requestWithAuthRetry<ApiClass>(
    `${API_BASE_URL}/api/classes/${id}`,
    { method: 'GET' }
  )
}

export async function createClassApi(input: {
  name: string
  description?: string
  teacherId?: string
}): Promise<ApiClass> {
  return requestWithAuthRetry<ApiClass>(
    `${API_BASE_URL}/api/classes`,
    {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(input),
    }
  )
}

export async function updateClassApi(
  id: string,
  input: Partial<Pick<ApiClass, 'name' | 'description'>>
): Promise<ApiClass> {
  return requestWithAuthRetry<ApiClass>(
    `${API_BASE_URL}/api/classes/${id}`,
    {
      method: 'PATCH',
      headers: buildHeaders(),
      body: JSON.stringify(input),
    }
  )
}

export async function deleteClassApi(id: string): Promise<void> {
  await requestWithAuthRetry<null>(
    `${API_BASE_URL}/api/classes/${id}`,
    { method: 'DELETE', headers: buildHeaders() }
  )
}

export async function enrollStudentInClassApi(input: {
  classId: string
  studentId: string
}) {
  return requestWithAuthRetry(
    `${API_BASE_URL}/api/classes/${input.classId}/enroll`,
    {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ studentId: input.studentId }),
    }
  )
}

export async function enrollStudentInClassByEmailApi(input: {
  classId: string
  email: string
}) {
  return requestWithAuthRetry(
    `${API_BASE_URL}/api/classes/${input.classId}/enroll-by-email`,
    {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ email: input.email }),
    }
  )
}

export async function getStudentsFromClassApi(classId: string): Promise<{
  id: string
  name: string
  email: string
  enrolledAt: string
}[]> {
  return requestWithAuthRetry(
    `${API_BASE_URL}/api/classes/${classId}/students`,
    { method: 'GET' }
  )
}

/**
 * ASSIGNMENTS & ATTEMPTS (alinhado com docs/openapi-contract.md)
 * Estas funções serão usadas nos fluxos Teacher/Student no frontend.
 */

export async function listAssignmentsForCurrentUser() {
  return requestWithAuthRetry<ApiAssignment[]>(
    `${API_BASE_URL}/api/assignments`,
    { method: 'GET' }
  )
}

export async function getAssignmentById(id: string) {
  return requestWithAuthRetry<ApiAssignment>(
    `${API_BASE_URL}/api/assignments/${id}`,
    { method: 'GET' }
  )
}

export async function createAssignmentApi(input: {
  quizId: string
  classId?: string
  studentId?: string
  availableFrom?: string
  availableTo?: string
}): Promise<ApiAssignment> {
  return requestWithAuthRetry<ApiAssignment>(
    `${API_BASE_URL}/api/assignments`,
    {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(input),
    }
  )
}

export async function updateAssignmentApi(
  id: string,
  input: Partial<Pick<ApiAssignment, 'availableFrom' | 'availableTo' | 'isActive'>>
): Promise<ApiAssignment> {
  return requestWithAuthRetry<ApiAssignment>(
    `${API_BASE_URL}/api/assignments/${id}`,
    {
      method: 'PATCH',
      headers: buildHeaders(),
      body: JSON.stringify(input),
    }
  )
}

export async function deleteAssignmentApi(id: string): Promise<void> {
  await requestWithAuthRetry<null>(
    `${API_BASE_URL}/api/assignments/${id}`,
    { method: 'DELETE', headers: buildHeaders() }
  )
}

/**
 * QUIZ SHARES & FORK (Teacher)
 */

export async function shareQuizApi(input: {
  quizId: string
  sharedWithTeacherId: string
  canEdit?: boolean
}): Promise<ApiShare> {
  return requestWithAuthRetry<ApiShare>(
    `${API_BASE_URL}/api/quizzes/${input.quizId}/share`,
    {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({
        sharedWithTeacherId: input.sharedWithTeacherId,
        canEdit: input.canEdit ?? false,
      }),
    }
  )
}

export async function shareQuizByEmailApi(input: {
  quizId: string
  sharedWithTeacherEmail: string
  canEdit?: boolean
}): Promise<ApiShare> {
  return requestWithAuthRetry<ApiShare>(
    `${API_BASE_URL}/api/quizzes/${input.quizId}/share-by-email`,
    {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({
        sharedWithTeacherEmail: input.sharedWithTeacherEmail,
        canEdit: input.canEdit ?? false,
      }),
    }
  )
}

export async function listSharesForQuizApi(quizId: string): Promise<ApiShare[]> {
  return requestWithAuthRetry<ApiShare[]>(
    `${API_BASE_URL}/api/quizzes/${quizId}/shared-with`,
    { method: 'GET' }
  )
}

export async function revokeShareApi(input: {
  quizId: string
  sharedWithTeacherId: string
}): Promise<void> {
  await requestWithAuthRetry<null>(
    `${API_BASE_URL}/api/quizzes/${input.quizId}/share/${input.sharedWithTeacherId}`,
    {
      method: 'DELETE',
      headers: buildHeaders(),
    }
  )
}

export async function listQuizzesSharedWithMeApi(): Promise<{
  shareId: string
  quizId: string
  title: string
  description?: string | null
  ownerId: string
  canEdit: boolean
}[]> {
  return requestWithAuthRetry(
    `${API_BASE_URL}/api/quizzes/shared-with-me`,
    { method: 'GET' }
  )
}

export async function forkQuizApi(quizId: string): Promise<ApiQuizSummary> {
  return requestWithAuthRetry<ApiQuizSummary>(
    `${API_BASE_URL}/api/quizzes/${quizId}/fork`,
    {
      method: 'POST',
      headers: buildHeaders(),
    }
  )
}

export async function startAttemptApi(input: {
  quizId: string
  assignmentId: string
}): Promise<ApiAttempt> {
  return requestWithAuthRetry<ApiAttempt>(
    `${API_BASE_URL}/api/quizzes/${input.quizId}/attempts`,
    {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ assignmentId: input.assignmentId }),
    }
  )
}

export async function submitAttemptApi(input: {
  attemptId: string
  answers: Record<string, any>
}): Promise<ApiAttempt> {
  return requestWithAuthRetry<ApiAttempt>(
    `${API_BASE_URL}/api/attempts/${input.attemptId}/submit`,
    {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ answers: input.answers }),
    }
  )
}

export async function getAttemptByIdApi(id: string): Promise<ApiAttempt> {
  return requestWithAuthRetry<ApiAttempt>(
    `${API_BASE_URL}/api/attempts/${id}`,
    { method: 'GET' }
  )
}

/**
 * RELATÓRIOS E ESTATÍSTICAS
 * Endpoints para obter dados estatísticos para relatórios
 *
 * NOTA: Estes endpoints precisam ser implementados no backend.
 * Atualmente, eles retornarão erro 404 pois não existem no servidor.
 *
 * Endpoints necessários:
 * 1. GET /api/quizzes/{quizId}/statistics
 * 2. GET /api/classes/{classId}/statistics
 * 3. GET /api/students/{studentId}/attempts
 * 4. GET /api/quizzes/{quizId}/attempts
 * 5. GET /api/assignments/{assignmentId}/statistics
 */

export async function getQuizStatistics(quizId: string): Promise<QuizStatistics> {
  return requestWithAuthRetry<QuizStatistics>(
    `${API_BASE_URL}/api/statistics/quiz/${quizId}`,
    { method: 'GET' }
  )
}

export async function getClassStatistics(classId: string): Promise<ClassStatistics> {
  return requestWithAuthRetry<ClassStatistics>(
    `${API_BASE_URL}/api/statistics/class/${classId}`,
    { method: 'GET' }
  )
}

export async function getStudentAttempts(
  studentId: string,
  quizId?: string
): Promise<StudentAttempt[]> {
  const url = quizId
    ? `${API_BASE_URL}/api/statistics/student/${studentId}/attempts?quizId=${quizId}`
    : `${API_BASE_URL}/api/statistics/student/${studentId}/attempts`
    
  return requestWithAuthRetry<StudentAttempt[]>(url, { method: 'GET' })
}

export async function getQuizAttempts(quizId: string): Promise<StudentAttempt[]> {
  return requestWithAuthRetry<StudentAttempt[]>(
    `${API_BASE_URL}/api/statistics/quiz/${quizId}/attempts`,
    { method: 'GET' }
  )
}

export async function getAssignmentStatistics(assignmentId: string): Promise<AssignmentStatistics> {
  return requestWithAuthRetry<AssignmentStatistics>(
    `${API_BASE_URL}/api/statistics/assignment/${assignmentId}`,
    { method: 'GET' }
  )
}

/**
 * USER SEARCH
 * Funções para buscar usuários na base de dados
 */

export async function searchUsersByEmail(email: string): Promise<{
  id: string
  name: string
  email: string
  role: UserRole
}[]> {
  return requestWithAuthRetry(
    `${API_BASE_URL}/api/users/search?email=${encodeURIComponent(email)}`,
    { method: 'GET' }
  )
}

export async function searchTeachersByEmail(email: string): Promise<{
  id: string
  name: string
  email: string
  role: 'TEACHER' | 'ADMIN'
}[]> {
  return requestWithAuthRetry(
    `${API_BASE_URL}/api/users/teachers/search?email=${encodeURIComponent(email)}`,
    { method: 'GET' }
  )
}

export async function searchStudentsByEmail(email: string): Promise<{
  id: string
  name: string
  email: string
  role: 'STUDENT'
}[]> {
  return requestWithAuthRetry(
    `${API_BASE_URL}/api/users/students/search?email=${encodeURIComponent(email)}`,
    { method: 'GET' }
  )
}

/**
 * CLIENTE HTTP PÚBLICO PARA O FRONTEND
 * Usado como entrypoint em src/lib/api/index.ts e outros serviços.
 */
export const httpClient = {
  API_BASE_URL,
  // Auth
  login,
  logout,
  registerUser,
  getAccessToken,
  adminListUsers,
  adminApproveUser,
  adminRejectUser,
  adminUpdateUserStatus,
  adminDeleteUser,
  adminCreateUser,
  // Quizzes
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
  // Shares / Forks
  shareQuizApi,
  shareQuizByEmailApi,
  listSharesForQuizApi,
  revokeShareApi,
  listQuizzesSharedWithMeApi,
  forkQuizApi,
  // Attempts
  startAttemptApi,
  submitAttemptApi,
  getAttemptByIdApi,
  // Statistics & Reports
  getQuizStatistics,
  getClassStatistics,
  getStudentAttempts,
  getQuizAttempts,
  getAssignmentStatistics,
}

function mapQuestionToApiPayload(question: Omit<Question, 'id'>): Record<string, unknown> {
  const typeMap: Record<QType, string> = {
    mcq: 'MULTIPLE_CHOICE',
    truefalse: 'TRUE_FALSE',
    short: 'SHORT_ANSWER',
    matching: 'MATCHING',
    ordering: 'ORDERING',
    gapfill: 'FILL_IN_THE_BLANK',
    essay: 'OPEN_ENDED',
  }

  const payload: Record<string, unknown> = {
    type: typeMap[question.type],
    prompt: question.prompt,
    order: 0,
  }

  if (question.type === 'mcq' || question.type === 'truefalse') {
    payload.options = (question.choices ?? []).map((choice) => choice.text)
    const correct = (question.choices ?? []).find((choice) => choice.correct)
    payload.correctAnswer = correct ? correct.text : undefined
  } else if (
    question.type === 'short' ||
    question.type === 'gapfill' ||
    question.type === 'essay'
  ) {
    payload.correctAnswer = question.answer ?? ''
  } else if (question.type === 'matching') {
    payload.options = question.matchingPairs ?? []
  } else if (question.type === 'ordering') {
    payload.options = question.orderingItems ?? []
    payload.correctAnswer = (question.orderingItems ?? []).join(' -> ')
  }

  return payload
}
