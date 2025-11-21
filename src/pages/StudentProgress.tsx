import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth/AuthContext'
import { getStudentAttempts } from '../lib/api/httpClient'
import EmptyState from '../components/EmptyState'

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

// Using the StudentAttempt interface from httpClient.ts

interface QuizStats {
  totalQuizzes: number
  completedQuizzes: number
  averageScore: number
  totalTimeSpent: number
}

const StudentProgress: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [attempts, setAttempts] = useState<any[]>([])
  const [stats, setStats] = useState<QuizStats>({
    totalQuizzes: 0,
    completedQuizzes: 0,
    averageScore: 0,
    totalTimeSpent: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user) return

      try {
        setIsLoading(true)

        console.log('=== FETCHING STUDENT PROGRESS ===')
        console.log('User ID:', user.id)

        // Fetch student attempts
        const attemptsData = await getStudentAttempts(user.id)
        console.log('Attempts Data:', JSON.stringify(attemptsData, null, 2))
        console.log('Number of attempts:', attemptsData.length)

        setAttempts(attemptsData)

        // Calculate stats
        const completedQuizzes = attemptsData.length
        const averageScore = completedQuizzes > 0
          ? attemptsData.reduce((sum: number, attempt: any) => {
              console.log('Attempt percentage:', attempt.percentage)
              return sum + attempt.percentage
            }, 0) / completedQuizzes
          : 0
        const totalTimeSpent = attemptsData.reduce((sum: number, attempt: any) => sum + (attempt.timeSpentMinutes || 0), 0)

        const calculatedStats = {
          totalQuizzes: attemptsData.length,
          completedQuizzes,
          averageScore: Math.round(averageScore),
          totalTimeSpent
        }

        console.log('Calculated Stats:', calculatedStats)
        setStats(calculatedStats)
      } catch (error) {
        console.error('Error fetching student progress:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStudentData()
  }, [user])

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleStartQuiz = async (quizId: string, assignmentId: string) => {
    try {
      // Import attemptsApi
      const { attemptsApi } = await import('../lib/api')

      console.log('[StudentProgress] Starting quiz:', quizId, 'assignment:', assignmentId)
      const attempt = await attemptsApi.start(quizId, assignmentId)
      console.log('[StudentProgress] Attempt created:', attempt.id)
      navigate(`/quiz/${quizId}`, { state: { assignmentId, attemptId: attempt.id } })
    } catch (error: any) {
      console.error('[StudentProgress] Error starting quiz:', error)
      alert('Erro ao iniciar o quiz: ' + (error.message || 'Tente novamente.'))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          A carregar dados...
        </div>
      </div>
    )
  }

  return (
    <div className="relative z-10 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 mobile-safe-top mobile-safe-bottom">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 dark:from-gray-800 dark:to-gray-900 transition-colors duration-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 dark:text-white transition-colors duration-200">
              Meu Progresso
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 dark:text-gray-300 transition-colors duration-200">
              Acompanhe seu desempenho e veja seus quizzes concluídos.
            </p>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center transition-colors duration-200">
              <div className="text-3xl font-bold text-blue-600 mb-2 dark:text-blue-400">{stats.completedQuizzes}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Quizzes Concluídos</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center transition-colors duration-200">
              <div className="text-3xl font-bold text-green-600 mb-2 dark:text-green-400">{stats.averageScore}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Pontuação Média</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center transition-colors duration-200">
              <div className="text-3xl font-bold text-purple-600 mb-2 dark:text-purple-400">{formatTime(stats.totalTimeSpent)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Tempo Total</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center transition-colors duration-200">
              <div className="text-3xl font-bold text-orange-600 mb-2 dark:text-orange-400">
                {stats.completedQuizzes > 0 ? Math.round(stats.averageScore / 20) : 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Troféus Ganhos</div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-6 sm:py-8 px-4 pb-6 sm:pb-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Histórico de Quizzes
          </h2>

          {/* Attempts List */}
          {attempts.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Quiz
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Pontuação
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tempo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {attempts.map((attempt) => (
                      <tr key={attempt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {attempt.quizTitle}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {attempt.score}/{attempt.maxScore}
                            </div>
                            <div className="ml-2">
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                ({attempt.percentage}%)
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            {formatTime((attempt.timeSpentMinutes || 0) * 60)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(attempt.submittedAt || attempt.startedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleStartQuiz(attempt.quizId, attempt.assignmentId)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Refazer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState
              message="Nenhum quiz concluído"
              description="Complete quizzes atribuídos pelo seu professor para ver o seu progresso aqui."
            />
          )}
        </div>
      </section>
    </div>
  )
}

export default StudentProgress