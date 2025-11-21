import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { attemptsApi } from '../lib/api'

interface ResultData {
  score: number
  totalQuestions: number
  percentage: number
  quizTitle?: string
  timeTaken?: string
}

// Icon components
const ChevronLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const TrophyIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChartBarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ShareIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

function Results() {
  const location = useLocation()
  const [resultData, setResultData] = useState<ResultData>({
    score: 0,
    totalQuestions: 0,
    percentage: 0,
    quizTitle: '',
    timeTaken: '00:00'
  })
  const [showConfetti, setShowConfetti] = useState(false)


  useEffect(() => {
    const loadResults = async () => {
      // Try to get data from navigation state
      if (location.state) {
        const state = location.state as ResultData & { attemptId?: string }
        setResultData(state)
        
        // If we have an attemptId, fetch detailed results from API
        if (state.attemptId) {
          try {
            const attempt = await attemptsApi.getById(state.attemptId)
            if (attempt) {
              // Use actual score and maxScore from the attempt
              const actualScore = attempt.score ?? 0
              const actualMaxScore = attempt.maxScore ?? state.totalQuestions ?? 0
              const actualPercentage = actualMaxScore > 0
                ? Math.round((actualScore / actualMaxScore) * 100)
                : 0

              setResultData(prev => ({
                ...prev,
                score: actualScore,
                totalQuestions: actualMaxScore,
                percentage: actualPercentage
              }))
            }
          } catch (error) {
            console.error('Error fetching attempt details:', error)
          }
        }
        
        // Show confetti for high scores
        const percentage = state.percentage
        if (percentage >= 80) {
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 5000)
        }
      } else {
        // Try to get data from localStorage
        const savedResults = localStorage.getItem('quizResults')
        if (savedResults) {
          try {
            const parsed = JSON.parse(savedResults)
            setResultData(parsed)
            
            // If we have an attemptId, fetch detailed results from API
            if (parsed.attemptId) {
              try {
                const attempt = await attemptsApi.getById(parsed.attemptId)
                if (attempt) {
                  // Use actual score and maxScore from the attempt
                  const actualScore = attempt.score ?? 0
                  const actualMaxScore = attempt.maxScore ?? parsed.totalQuestions ?? 0
                  const actualPercentage = actualMaxScore > 0
                    ? Math.round((actualScore / actualMaxScore) * 100)
                    : 0

                  setResultData(prev => ({
                    ...prev,
                    score: actualScore,
                    totalQuestions: actualMaxScore,
                    percentage: actualPercentage
                  }))
                }
              } catch (error) {
                console.error('Error fetching attempt details:', error)
              }
            }
            
            // Show confetti for high scores
            if (parsed.percentage >= 80) {
              setShowConfetti(true)
              setTimeout(() => setShowConfetti(false), 5000)
            }
            
            // Clear after use
            localStorage.removeItem('quizResults')
          } catch (error) {
            console.error('Error loading results:', error)
          }
        }
      }
    }
    
    loadResults()
  }, [location.state])

  const { score, totalQuestions, percentage, quizTitle, timeTaken } = resultData

  // If there's no data, show default page
  if (score === 0 && totalQuestions === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resultados</h1>
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeftIcon />
                <span className="ml-2">Voltar</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-4 transition-colors duration-200">
              <ChartBarIcon />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Nenhum Resultado</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Não há resultados para mostrar. Faça um quiz para ver seu desempenho.
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>Ir para a página principal</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const getPerformanceLevel = () => {
    if (percentage >= 90) return { level: 'Excelente', color: 'green', message: 'Parabéns! Você demonstrou um conhecimento excepcional!' }
    if (percentage >= 80) return { level: 'Ótimo', color: 'blue', message: 'Excelente! Você demonstrou um ótimo conhecimento no assunto.' }
    if (percentage >= 70) return { level: 'Bom', color: 'blue', message: 'Bom trabalho! Você acertou a maioria das questões.' }
    if (percentage >= 60) return { level: 'Regular', color: 'yellow', message: 'Você está no caminho certo! Continue estudando.' }
    if (percentage >= 40) return { level: 'Precisa Melhorar', color: 'orange', message: 'Você pode melhorar. Continue estudando!' }
    return { level: 'Precisa Estudar Mais', color: 'red', message: 'Precisa de mais prática. Não desista!' }
  }

  const performance = getPerformanceLevel()
  const incorrectAnswers = totalQuestions - score

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-10px`,
                  animation: `fall ${2 + Math.random() * 3}s linear`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'][Math.floor(Math.random() * 6)]
                  }}
                ></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resultados do Quiz</h1>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeftIcon />
              <span className="ml-2">Voltar</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Results Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Score Card */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
              {/* Score Header */}
              <div className={`bg-gradient-to-r from-${performance.color}-50 to-${performance.color}-100 dark:from-${performance.color}-900/20 dark:to-${performance.color}-900/30 px-6 py-8 text-center transition-colors duration-200`}>
                <div className="flex items-center justify-center w-20 h-20 bg-white dark:bg-gray-800 rounded-full mx-auto mb-4 shadow-sm transition-colors duration-200">
                  {percentage >= 80 ? (
                    <TrophyIcon />
                  ) : (
                    <div className="text-3xl font-bold text-gray-700 dark:text-gray-300">{percentage}%</div>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {percentage >= 80 ? 'Parabéns!' : 'Quiz Concluído!'}
                </h2>
                {quizTitle && (
                  <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">{quizTitle}</p>
                )}
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center">
                    <CheckCircleIcon />
                    <span className="ml-1">{score} acertos</span>
                  </div>
                  <div className="flex items-center">
                    <XCircleIcon />
                    <span className="ml-1">{incorrectAnswers} erros</span>
                  </div>
                  {timeTaken && (
                    <div className="flex items-center">
                      <ClockIcon />
                      <span className="ml-1">{timeTaken}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Details */}
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Desempenho</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full bg-${performance.color}-100 dark:bg-${performance.color}-900/30 text-${performance.color}-800 dark:text-${performance.color}-400 transition-colors duration-200`}>
                      {performance.level}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 transition-colors duration-200">
                    <div
                      className={`bg-gradient-to-r from-${performance.color}-400 to-${performance.color}-600 h-3 rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Análise de Desempenho</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{performance.message}</p>
                   
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 transition-colors duration-200">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{percentage}%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Taxa de Acerto</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 transition-colors duration-200">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{score}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Respostas Corretas</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 transition-colors duration-200">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalQuestions}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total de Perguntas</div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Recomendações</h3>
                  <div className="space-y-2">
                    {percentage >= 80 ? (
                      <>
                        <div className="flex items-start space-x-2">
                          <StarIcon />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Você dominou este tópico! Considere desafios mais avançados.</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <StarIcon />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Compartilhe seu sucesso com amigos e colegas.</span>
                        </div>
                      </>
                    ) : percentage >= 60 ? (
                      <>
                        <div className="flex items-start space-x-2">
                          <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold mt-0.5 transition-colors duration-200">•</div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Revise as perguntas que você errou para reforçar o aprendizado.</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold mt-0.5 transition-colors duration-200">•</div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Tente fazer quizzes similares para consolidar seu conhecimento.</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start space-x-2">
                          <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-bold mt-0.5 transition-colors duration-200">•</div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Dedique mais tempo ao estudo deste tópico.</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-bold mt-0.5 transition-colors duration-200">•</div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Procure materiais de estudo complementares.</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-bold mt-0.5 transition-colors duration-200">•</div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Não desista! A prática leva à perfeição.</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/"
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <span>Fazer Outro Quiz</span>
                  </Link>
                  <button
                    onClick={() => window.history.back()}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    <span>Revisar Respostas</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Estatísticas Rápidas</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Taxa de Acerto</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{percentage}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Respostas Corretas</span>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">{score}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Respostas Incorretas</span>
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">{incorrectAnswers}</span>
                </div>
                {timeTaken && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Tempo Total</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{timeTaken}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Share Results */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Compartilhar Resultados</h3>
              <div className="space-y-3">
                <button className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  <ShareIcon />
                  <span className="ml-2">Compartilhar</span>
                </button>
                <button className="w-full inline-flex items-center justify-center px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
                  <DownloadIcon />
                  <span className="ml-2">Baixar PDF</span>
                </button>
              </div>
            </div>

            {/* Progress Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Progresso</h3>
              <div className="flex items-center justify-center h-32">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-8 border-gray-200 dark:border-gray-700 transition-colors duration-200"></div>
                  <div
                    className={`absolute top-0 left-0 w-24 h-24 rounded-full border-8 border-${performance.color}-500 dark:border-${performance.color}-400 border-t-transparent border-r-transparent transform rotate-45 transition-colors duration-200`}
                    style={{
                      borderStyle: 'solid',
                      borderColor: `transparent transparent #3b82f6 #3b82f6`,
                      transform: `rotate(${45 + (percentage * 3.6)}deg)`
                    }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">{percentage}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Results