import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Quiz } from '../types'
import { useQuiz } from '../hooks/useQuiz'
import { useAuth } from '../lib/auth/AuthContext'
import { deleteQuiz as deleteQuizApi, forkQuiz as forkQuizApi, getQuizzes } from '../lib/api'
import { exportQuizToJsonAndDownload } from '../lib/utils/importExport'
import ExportPdfButton from './ExportPdfButton'

interface QuizCardProps {
  quiz: Quiz
  onEdit?: (id: string) => void
  allQuizzes?: Quiz[]
}

// SVG Icon Components
const EditIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const DuplicateIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)

const DownloadIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
)

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const PlayIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const SpinnerIcon = ({ className }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
)

const SupportIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M4 7h16" strokeLinecap="round" />
    <path d="M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 3h8a2 2 0 012 2v2H6V5a2 2 0 012-2z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const VideoIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="5" width="15" height="14" rx="2" />
    <path d="M21 7l-4 3v4l4 3V7z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

type ActionVariant = 'neutral' | 'success' | 'secondary' | 'danger'

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  variant?: ActionVariant
}

const actionVariants: Record<ActionVariant, string> = {
  neutral: 'border-primary-50/60 text-gray-600 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50/50 dark:text-gray-300 dark:border-white/10 dark:hover:border-primary-400/30 dark:hover:text-primary-200',
  success: 'border-success-100/70 text-success-600 hover:bg-success-50 hover:text-success-700 dark:text-success-300 dark:border-success-500/20 dark:hover:border-success-400/40',
  secondary: 'border-secondary-100/70 text-secondary-600 hover:bg-secondary-50 hover:text-secondary-700 dark:text-secondary-200 dark:border-secondary-500/30 dark:hover:border-secondary-400/50',
  danger: 'border-error-100/80 text-error-600 hover:bg-error-50 hover:text-error-700 dark:text-error-300 dark:border-error-500/40 dark:hover:border-error-400/60',
}

const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  label,
  variant = 'neutral',
  className = '',
  ...props
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-white/80 text-sm font-medium transition-all duration-300 shadow-sm hover:-translate-y-0.5 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 dark:bg-slate-900/60 ${actionVariants[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
)

export const QuizCard: React.FC<QuizCardProps> = ({ quiz, onEdit, allQuizzes = [] }) => {
  const { removeQuiz, loadQuizzes } = useQuiz()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const hasSupportText = Boolean(quiz.supportText && quiz.supportText.trim().length > 0)
  const videoCount = quiz.youtubeVideos?.length ?? 0
  const hasVideos = videoCount > 0
  
  // Check if user is a student
  const isStudent = user?.role === 'STUDENT'
  const questionCount =
    typeof quiz.questionCount === 'number' ? quiz.questionCount : quiz.questions.length

  const handleTakeQuiz = () => {
    // Validate quiz ID before navigation
    if (!quiz.id || quiz.id === 'undefined' || quiz.id === 'null' || quiz.id.trim() === '') {
      console.error('[QuizCard] Invalid quiz ID for navigation:', quiz.id)
      showNotification('Não é possível iniciar o quiz: ID inválido.', 'error')
      return
    }
    
    console.log('[QuizCard] Navigating to quiz with ID:', quiz.id)
    navigate(`/quiz/${quiz.id}`)
  }

  const handleEdit = () => {
    // Validate quiz ID before navigation
    if (!quiz.id || quiz.id === 'undefined' || quiz.id === 'null' || quiz.id.trim() === '') {
      console.error('[QuizCard] Invalid quiz ID for edit:', quiz.id)
      showNotification('Não é possível editar o quiz: ID inválido.', 'error')
      return
    }
    
    console.log('[QuizCard] Editing quiz with ID:', quiz.id)
    
    if (onEdit) {
      onEdit(quiz.id)
      return
    }
    navigate(`/quiz/edit/${quiz.id}`)
  }

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const notification = document.createElement('div')
    const bgColor = type === 'success' ? 'bg-success-500' : 'bg-error-500'
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-xl shadow-lg z-50 transform transition-all duration-300 translate-x-full notification-enter`
    notification.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
        ${message}
      </div>
    `
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.classList.remove('translate-x-full')
      notification.classList.add('translate-x-0')
    }, 100)
    
    setTimeout(() => {
      notification.classList.remove('translate-x-0')
      notification.classList.add('translate-x-full')
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 300)
    }, 3000)
  }

  const handleDelete = async () => {
    // Validate quiz ID before deletion
    if (!quiz.id || quiz.id === 'undefined' || quiz.id === 'null' || quiz.id.trim() === '') {
      console.error('[QuizCard] Invalid quiz ID for deletion:', quiz.id)
      showNotification('Não é possível eliminar o quiz: ID inválido.', 'error')
      return
    }
    
    if (!window.confirm(`Tem certeza que deseja eliminar o quiz "${quiz.title}"?`)) {
      return
    }

    console.log('[QuizCard] Deleting quiz with ID:', quiz.id)
    setIsDeleting(true)
    try {
      await deleteQuizApi(quiz.id)
      // Only remove from local state if API deletion was successful
      removeQuiz(quiz.id)
      showNotification(`Quiz "${quiz.title}" eliminado com sucesso!`)
    } catch (error) {
      console.error('[API] Erro ao eliminar quiz:', error)
      // Verifica se é um erro de permissão
      if (error instanceof Error && error.message.includes('403')) {
        showNotification('Você não tem permissão para eliminar este quiz.', 'error')
      } else if (error instanceof Error && error.message.includes('404')) {
        showNotification('O quiz já foi eliminado ou não foi encontrado.', 'error')
      } else {
        showNotification('Não foi possível eliminar o quiz. Tente novamente.', 'error')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDuplicate = () => {
    // Validate quiz ID before duplication
    if (!quiz.id || quiz.id === 'undefined' || quiz.id === 'null' || quiz.id.trim() === '') {
      console.error('[QuizCard] Invalid quiz ID for duplication:', quiz.id)
      showNotification('Não é possível duplicar o quiz: ID inválido.', 'error')
      return
    }
    
    console.log('[QuizCard] Duplicating quiz with ID:', quiz.id)
    setIsDuplicating(true)
    void (async () => {
      try {
        await forkQuizApi(quiz.id)
        const refreshed = await getQuizzes()
        loadQuizzes(refreshed)
        showNotification(`Quiz "${quiz.title}" duplicado com sucesso!`)
      } catch (error) {
        console.error('[API] Erro ao duplicar quiz:', error)
        // Verifica se é um erro de permissão
        if (error instanceof Error && error.message.includes('403')) {
          showNotification('Você não tem permissão para duplicar este quiz.', 'error')
        } else {
          showNotification('Não foi possível duplicar o quiz. Tente novamente.', 'error')
        }
      } finally {
        setIsDuplicating(false)
      }
    })()
  }

  const handleExportJson = () => {
    // Validate quiz ID before export
    if (!quiz.id || quiz.id === 'undefined' || quiz.id === 'null' || quiz.id.trim() === '') {
      console.error('[QuizCard] Invalid quiz ID for JSON export:', quiz.id)
      showNotification('Não é possível exportar o quiz: ID inválido.', 'error')
      return
    }
    
    console.log('[QuizCard] Exporting quiz with ID to JSON:', quiz.id)
    try {
      exportQuizToJsonAndDownload(quiz)
      showNotification('Quiz exportado com sucesso!')
    } catch (error) {
      console.error('Erro ao exportar quiz:', error)
      showNotification('Erro ao exportar quiz. Por favor, tente novamente.', 'error')
    }
  }

  return (
    <article className="card-interactive card-hover-lift card-hover-glow mobile-optimized-card relative overflow-hidden border border-white/70 bg-gradient-to-br from-white via-white to-gray-50 p-5 shadow-soft dark:border-white/10 dark:from-slate-900 dark:via-slate-900/70 dark:to-slate-900/30 sm:p-6 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:-translate-y-1 slide-in-bottom-fade mobile-gpu-accelerated mobile-will-change-transform">
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gradient-to-br from-primary-200/60 via-secondary-200/40 to-transparent blur-2xl dark:from-primary-500/10 dark:via-secondary-500/10" />
      
      <div className="relative flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          {/* Left: title and meta */}
          <div className="flex-1 pr-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Quiz</p>
            <h3 className="mt-1 text-xl font-semibold leading-tight text-gray-900 line-clamp-2 dark:text-white">
              {quiz.title}
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap gap-2">
                {quiz.subject && (
                  <span className="badge badge-blue rounded-full px-3 py-1 text-xs font-semibold">
                    {quiz.subject}
                  </span>
                )}
                {quiz.grade && (
                  <span className="badge badge-purple rounded-full px-3 py-1 text-xs font-semibold">
                    {quiz.grade}
                  </span>
                )}
                <span className="badge badge-green rounded-full px-3 py-1 text-xs font-semibold">
                  {questionCount}{' '}
                  {questionCount === 1 ? 'pergunta' : 'perguntas'}
                </span>
              </div>
              {typeof quiz.isPublished === 'boolean' && (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    quiz.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {quiz.isPublished ? 'Publicado' : 'Rascunho'}
                </span>
              )}
            </div>
          </div>

          {/* Right: actions + stacked badges */}
          <div className="flex flex-col items-end gap-3 text-right">
            {/* Actions - forced single-line, non-wrapping on small screens */}
            {!isStudent && (
              <div className="inline-flex flex-row items-center justify-end gap-1.5 sm:gap-2 rounded-2xl border border-white/80 bg-white/95 p-1.5 sm:p-2 shadow-lg shadow-primary-500/10 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80">
                <ActionButton
                  label="Editar"
                  onClick={handleEdit}
                  className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
                >
                  <EditIcon className="h-4 w-4" />
                </ActionButton>
                <ActionButton
                  label="Duplicar"
                  onClick={handleDuplicate}
                  disabled={isDuplicating}
                  variant="success"
                  className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
                >
                  {isDuplicating ? (
                    <SpinnerIcon className="h-4 w-4" />
                  ) : (
                    <DuplicateIcon className="h-4 w-4" />
                  )}
                </ActionButton>
                <ActionButton
                  label="Exportar JSON"
                  onClick={handleExportJson}
                  variant="secondary"
                  className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
                >
                  <DownloadIcon className="h-4 w-4" />
                </ActionButton>
                <ActionButton
                  label="Eliminar"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  variant="danger"
                  className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
                >
                  {isDeleting ? (
                    <SpinnerIcon className="h-4 w-4" />
                  ) : (
                    <TrashIcon className="h-4 w-4" />
                  )}
                </ActionButton>
              </div>
            )}

            {/* Stacked badges - part of normal flow, no overlap */}
            <div className="flex flex-col items-end gap-2">
              {hasSupportText && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/70 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700 shadow-md shadow-indigo-100/60 backdrop-blur-sm dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-100">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white shadow-sm">
                    <SupportIcon className="h-3.5 w-3.5" />
                  </span>
                  Texto de apoio
                </span>
              )}
              {hasVideos && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/70 bg-gradient-to-r from-rose-50 via-amber-50 to-yellow-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-700 shadow-md shadow-rose-100/80 backdrop-blur dark:border-rose-500/40 dark:from-rose-500/10 dark:via-orange-500/10 dark:to-yellow-500/10 dark:text-rose-100">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 via-orange-500 to-amber-500 text-white shadow-sm">
                    <VideoIcon className="h-3.5 w-3.5" />
                  </span>
                  {videoCount} {videoCount === 1 ? 'vídeo' : 'vídeos'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Primary action */}
        <button
          onClick={handleTakeQuiz}
          className="btn-hover-bounce btn-hover-ripple mobile-optimized-button mobile-pressable inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 dark:from-blue-500 dark:via-indigo-500 dark:to-purple-500 mobile-focus-visible"
        >
          <PlayIcon className="h-4 w-4" />
          Fazer Quiz
        </button>

        {/* Export PDF - only for teachers and admins */}
        {!isStudent && (
          <div className="rounded-2xl border border-gray-100/80 bg-white/80 p-4 shadow-inner dark:border-white/5 dark:bg-slate-900/50 mobile-element-spacing">
            <ExportPdfButton quiz={quiz} allQuizzes={allQuizzes} className="w-full" />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400">
          <svg className="mr-2 h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Criado em {formatDate(quiz.createdAt)}
        </div>
      </div>
    </article>
  )
}

export default QuizCard
