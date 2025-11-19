// Exportar todos os tipos de quiz
export * from './quiz';

// Exportar tipos de definições
export * from './settings';

// Exportar tipos de estatísticas e relatórios da API
export type {
  QuizStatistics,
  QuestionStatistics,
  AttemptsByDate,
  ClassStatistics,
  StudentPerformance,
  StudentAttempt,
  AssignmentStatistics,
} from '../lib/api/httpClient';

// Manter os tipos existentes que possam ser usados noutras partes da aplicação
export interface QuizResult {
  quizId: string
  score: number
  totalQuestions: number
  percentage: number
  completedAt: Date
  answers: number[]
}