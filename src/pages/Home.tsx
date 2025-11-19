import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuiz } from '../hooks/useQuiz'
import { useAuth } from '../lib/auth/AuthContext'
import EmptyState from '../components/EmptyState'
import QuizCard from '../components/QuizCard'
import { importMultipleQuizzesFromFile } from '../lib/utils/importExport'
import { getQuizzes, getQuizById, assignmentsApi, createQuiz as createQuizApi, createQuestion as createQuestionApi } from '../lib/api'
import type { Question } from '../types'

// SVG Icon Components
const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const DownloadIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
)


const FilterIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
)

function Home() {
  const { quizzes, loadQuizzes } = useQuiz()
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [filter, setFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('recent')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isImporting, setIsImporting] = useState<boolean>(false)
  const [assignments, setAssignments] = useState<Array<{
    id: string;
    quizId: string;
    availableFrom?: string | null;
    availableTo?: string | null;
  }>>([])
  const [assignmentQuizzes, setAssignmentQuizzes] = useState<Map<string, { title: string; description?: string }>>(new Map())

  // Load data based on user role
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {

      try {
        setIsLoading(true)

        if (user?.role === 'STUDENT') {
          // Students see assignments
          const assignmentsData = await assignmentsApi.listForCurrentUser()
          if (isMounted) {
            setAssignments(assignmentsData || [])

            // Load quiz details for each assignment
            const quizMap = new Map<string, { title: string; description?: string }>()
            for (const assignment of assignmentsData || []) {
              if (assignment.quizId && !quizMap.has(assignment.quizId)) {
                try {
                  const quiz = await getQuizById(assignment.quizId)
                  if (quiz) {
                    quizMap.set(assignment.quizId, { title: quiz.title, description: quiz.subject })
                  }
                } catch (err) {
                  console.error('Error loading quiz details for', assignment.quizId, ':', err)
                }
              }
            }
            setAssignmentQuizzes(quizMap)
            setIsLoading(false)
          }
        } else {
          // Teachers/Admins see quizzes
          const quizzesData = await getQuizzes()
          if (isMounted) {
            loadQuizzes(quizzesData)
            setIsLoading(false)
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading data:', err)
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [user?.role])

  // Separate effect for periodic refresh to avoid dependency issues
  useEffect(() => {

    const loadData = async () => {
      try {
        if (user?.role === 'STUDENT') {
          const assignmentsData = await assignmentsApi.listForCurrentUser()
          setAssignments(assignmentsData || [])
        } else {
          const quizzesData = await getQuizzes()
          loadQuizzes(quizzesData)
        }
      } catch (err) {
        console.error('Error refreshing data:', err)
      }
    }

    // Set up periodic refresh with longer interval
    const intervalId = setInterval(loadData, 300000) // Refresh every 5 minutes instead of 60 seconds
    
    return () => {
      clearInterval(intervalId)
    }
  }, [user?.role, quizzes.length, loadQuizzes]) // Ensure refresh reacts to role changes

  const handleCreateQuiz = () => {
    navigate('/create')
  }

  const handleEditQuiz = (quizId: string) => {
    // Validate quiz ID before navigation
    if (!quizId || quizId === 'undefined' || quizId === 'null' || quizId.trim() === '') {
      console.error('[Home] Invalid quiz ID for edit:', quizId)
      showNotification('Não é possível editar o quiz: ID inválido.', 'error')
      return
    }
    
    console.log('[Home] Editing quiz with ID:', quizId)
    navigate(`/quiz/edit/${quizId}`)
  }


  const handleStartAssignment = (assignmentId: string, quizId: string) => {
    // Validate quiz ID before starting assignment
    if (!quizId || quizId === 'undefined' || quizId === 'null' || quizId.trim() === '') {
      console.error('[Home] Invalid quiz ID for assignment:', quizId)
      showNotification('Não é possível iniciar o quiz: ID inválido.', 'error')
      return
    }
    
    console.log('[Home] Starting assignment for quiz with ID:', quizId)
    navigate(`/quiz/${quizId}`, { state: { assignmentId } })
  }

  const handleImportQuiz = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsImporting(true)
      const importedQuizzes = await importMultipleQuizzesFromFile(file)

      if (importedQuizzes.length === 0) {
        showNotification('Nenhum quiz válido encontrado no ficheiro.', 'error')
        return
      }

      const existingKeys = new Set(
        quizzes.map((q) => `${(q.title ?? '').trim().toLowerCase()}|${(q.subject ?? '').trim().toLowerCase()}`),
      )

      const novosQuizzes = importedQuizzes.filter((quiz) => {
        const key = `${(quiz.title ?? '').trim().toLowerCase()}|${(quiz.subject ?? '').trim().toLowerCase()}`
        return !existingKeys.has(key)
      })

      if (novosQuizzes.length === 0) {
        showNotification('Todos os quizzes deste ficheiro já existem na lista.', 'warning')
        return
      }

      for (const quiz of novosQuizzes) {
        const { id: _oldId, questions = [] } = quiz
        const { id: createdId } = await createQuizApi({
          title: quiz.title,
          description: quiz.subject,
          grade: quiz.grade,
        })

        for (const question of questions) {
          const { id: _questionId, ...questionData } = question as Question & { id?: string }
          const normalizedQuestion: Omit<Question, 'id'> = {
            ...questionData,
            choices: questionData.choices?.map((choice, index) => ({
              id: choice.id ?? `${Date.now()}-${index}`,
              text: choice.text,
              correct: choice.correct,
            })),
          }
          await createQuestionApi(createdId, normalizedQuestion)
        }
      }

      const refreshed = await getQuizzes()
      loadQuizzes(refreshed)
      showNotification(
        `${novosQuizzes.length} ${novosQuizzes.length === 1 ? 'quiz' : 'quizzes'} importado(s) com sucesso!`,
      )
    } catch (error) {
      console.error('Erro ao importar quiz:', error)
      const message = error instanceof Error ? error.message : 'Erro ao importar o ficheiro. Verifique se o formato está correto.'
      showNotification(message, 'error')
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const notification = document.createElement('div')
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-xl shadow-lg z-50 transform transition-all duration-300 translate-x-full`
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

  // Calculate statistics
  const totalQuestions = quizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0)
  const completedQuizzes = quizzes.filter(quiz => quiz.questions.length > 0).length // Simple completion check

  // Filter and sort quizzes
  const filteredQuizzes = quizzes.filter(quiz => {
    if (filter === 'all') return true
    if (filter === 'recent') {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      return quiz.createdAt > oneWeekAgo
    }
    return true
  }).sort((a, b) => {
    if (sortBy === 'recent') return b.createdAt - a.createdAt
    if (sortBy === 'title') return a.title.localeCompare(b.title)
    if (sortBy === 'questions') return b.questions.length - a.questions.length
    return 0
  })

  return (
    <div className="relative z-10 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 mobile-safe-top mobile-safe-bottom">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 dark:from-gray-800 dark:to-gray-900 transition-colors duration-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 dark:text-white transition-colors duration-200">
              {user?.role === 'STUDENT' ? 'Meus Quizzes' : 'Crie Quizzes Incríveis com IA'}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 dark:text-gray-300 transition-colors duration-200">
              {user?.role === 'STUDENT' 
                ? 'Complete os quizzes atribuídos a você.'
                : 'Transforme o seu conteúdo em quizzes envolventes com o poder da inteligência artificial.'
              }
            </p>
            {user?.role !== 'STUDENT' && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleCreateQuiz}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:-translate-y-1"
                >
                  <PlusIcon className="w-5 h-5" />
                  Criar Novo Quiz
                </button>
                <button
                  onClick={handleImportQuiz}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:-translate-y-1"
                >
                  <DownloadIcon className="w-5 h-5" />
                  Importar Quiz
                </button>
              </div>
            )}
          </div>
          
          {/* Quick Stats */}
          {user?.role !== 'STUDENT' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center transition-colors duration-200">
                <div className="text-3xl font-bold text-blue-600 mb-2 dark:text-blue-400">{quizzes.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Quizzes Criados</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center transition-colors duration-200">
                <div className="text-3xl font-bold text-green-600 mb-2 dark:text-green-400">{totalQuestions}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total de Perguntas</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center transition-colors duration-200">
                <div className="text-3xl font-bold text-purple-600 mb-2 dark:text-purple-400">{completedQuizzes}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Quizzes Concluídos</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Content Section */}
      <section className="py-6 sm:py-8 px-4 pb-6 sm:pb-10">
        <div className="max-w-7xl mx-auto">
          {/* Loading State */}
          {(isLoading || isImporting) && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                A carregar dados...
              </div>
            </div>
          )}

          {/* Content based on user role */}
          {!(isLoading || isImporting) && (
            <>
              {user?.role === 'STUDENT' ? (
                /* Student view - Assignments */
                assignments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assignments.map((assignment) => {
                      const quizInfo = assignmentQuizzes.get(assignment.quizId)
                      return (
                        <div key={assignment.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {quizInfo?.title || 'Quiz Assignment'}
                          </h3>
                          {quizInfo?.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                              {quizInfo.description}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Available: {assignment.availableFrom ? new Date(assignment.availableFrom).toLocaleDateString() : 'Now'}
                            {assignment.availableTo && ` - ${new Date(assignment.availableTo).toLocaleDateString()}`}
                          </p>
                          <button
                            onClick={() => handleStartAssignment(assignment.id, assignment.quizId)}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Start Quiz
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <EmptyState
                    onCreateNew={() => window.location.reload()}
                    onImport={() => {}}
                  />
                )
              ) : (
                /* Teacher/Admin view - Quizzes */
                <>
                  {/* Header with filter and sort */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Meus Quizzes
                    </h2>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <FilterIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <select
                          className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm dark:bg-gray-700 dark:text-white"
                          value={filter}
                          onChange={(e) => setFilter(e.target.value)}
                        >
                          <option value="all">Todos</option>
                          <option value="recent">Recentes</option>
                        </select>
                      </div>
                      <select
                        className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm dark:bg-gray-700 dark:text-white"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="recent">Mais Recentes</option>
                        <option value="title">Ordem Alfabética</option>
                        <option value="questions">Mais Perguntas</option>
                      </select>
                    </div>
                  </div>

                  {/* Quiz Grid */}
                  {filteredQuizzes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {filteredQuizzes.map((quiz) => (
                        <QuizCard
                          key={quiz.id}
                          quiz={quiz}
                          onEdit={() => handleEditQuiz(quiz.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      onCreateNew={handleCreateQuiz}
                      onImport={handleImportQuiz}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".quiz.json"
        onChange={handleFileChange}
        className="hidden"
      />

    </div>
  )
}

export default Home
