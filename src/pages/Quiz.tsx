import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useQuiz } from '../hooks/useQuiz'
import type { Quiz } from '../types/quiz'
import MatchingQuestion from '../components/MatchingQuestion'
import OrderingQuestion from '../components/OrderingQuestion'
import SupportText from '../components/SupportText'
import AudioNarrator from '../components/AudioNarrator'
import { getQuizQuestions, attemptsApi } from '../lib/api'

const getYouTubeEmbedUrl = (rawUrl: string): string | null => {
  const trimmed = (rawUrl || '').trim()
  if (!trimmed) return null

  const ensureEmbedUrl = (videoId: string | null): string | null =>
    videoId ? `https://www.youtube.com/embed/${videoId}` : null

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.toLowerCase()

    const isYouTubeHost =
      host.includes('youtube.com') ||
      host.includes('youtu.be')

    if (isYouTubeHost) {
      if (parsed.pathname.startsWith('/results') && parsed.searchParams.has('search_query')) {
        const query = parsed.searchParams.get('search_query')
        if (query) {
          return `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}`
        }
      }

      if (parsed.pathname.startsWith('/embed/')) {
        return `https://www.youtube.com${parsed.pathname}${parsed.search}`
      }

      if (host === 'youtu.be') {
        const id = parsed.pathname.replace('/', '')
        return ensureEmbedUrl(id)
      }

      if (parsed.pathname.startsWith('/shorts/')) {
        const id = parsed.pathname.split('/shorts/')[1]
        return ensureEmbedUrl(id)
      }

      const videoId = parsed.searchParams.get('v')
      if (videoId) {
        return ensureEmbedUrl(videoId)
      }
    }
  } catch {
    // Ignore parsing errors and rely on fallback regex below
  }

  const fallback = trimmed.match(/(?:v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/)
  if (fallback && fallback[1]) {
    return `https://www.youtube.com/embed/${fallback[1]}`
  }

  return null
}

// Icon components
const ChevronLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

const ExclamationIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const TrophyIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { quizzes } = useQuiz()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string | number }>({})
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showResults, setShowResults] = useState(false)
  const [showSupport, setShowSupport] = useState(true)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [elapsedTime, setElapsedTime] = useState(0)
  const [attemptId, setAttemptId] = useState<string | null>((location.state as any)?.attemptId || null)
  const [assignmentId] = useState<string | null>((location.state as any)?.assignmentId || null)


  useEffect(() => {
    // Reset state when quizId changes
    setQuiz(null)
    setCurrentQuestion(0)
    setSelectedAnswers({})
    setShowResults(false)
    setShowSupport(true)
    setIsLoading(true)
    setStartTime(Date.now())
    setElapsedTime(0)
    
    // Validate quiz ID before proceeding
    if (!quizId || quizId === 'undefined' || quizId === 'null' || quizId.trim() === '') {
      console.error('[Quiz] Invalid quiz ID:', quizId)
      navigate('/')
      return
    }
    
    console.log('[Quiz] Loading quiz with ID:', quizId)
    
    if (quizId) {
      // Try to load quiz from API first
      const loadQuizFromApi = async () => {
        try {
          const questions = await getQuizQuestions(quizId)
          
          // Find quiz in local state or create minimal quiz object
          const foundQuiz = quizzes.find(q => q.id === quizId)
          if (foundQuiz) {
            setQuiz({ ...foundQuiz, questions })
          } else {
            // Create minimal quiz object with questions
            setQuiz({
              id: quizId,
              title: `Quiz ${quizId}`,
              questions,
              createdAt: Date.now(),
              updatedAt: Date.now()
            } as Quiz)
          }
        } catch (error) {
          console.error('Error loading quiz from API:', error)
          // Fallback to local state
          const foundQuiz = quizzes.find(q => q.id === quizId)
          if (foundQuiz) {
            setQuiz(foundQuiz)
          }
        } finally {
          setIsLoading(false)
        }
      }

      if (quizzes.length > 0) {
        const foundQuiz = quizzes.find(q => q.id === quizId)
        if (foundQuiz) {
          setQuiz(foundQuiz)
          // Still load questions from API to get the latest
          loadQuizFromApi()
        } else {
          loadQuizFromApi()
        }
      } else {
        loadQuizFromApi()
      }
    } else {
      // If there's no quizId, navigate to the main page
      navigate('/')
    }
  }, [quizId, quizzes, navigate])

  // Se abriu o quiz a partir de um assignment sem attemptId, cria um attempt automaticamente
  useEffect(() => {
    const startAttemptIfNeeded = async () => {
      if (!quizId) return
      if (attemptId) return
      if (!assignmentId) return
      try {
        const attempt = await attemptsApi.start(quizId, assignmentId)
        setAttemptId(attempt.id)
      } catch (err) {
        console.error('[Quiz] falha ao iniciar attempt automaticamente', err)
      }
    }
    void startAttemptIfNeeded()
  }, [quizId, assignmentId, attemptId])

  // Update elapsed time
  useEffect(() => {
    if (!showResults && quiz) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [startTime, showResults, quiz])

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerSelect = (questionId: string, answer: string | number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleNext = () => {
    if (quiz && currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Finish quiz
      setShowResults(true)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleFinish = async () => {
    // Submit attempt if we have an attemptId
    if (attemptId) {
      try {
        console.log('=== SUBMITTING QUIZ ===')
        console.log('Attempt ID:', attemptId)
        console.log('Selected Answers:', JSON.stringify(selectedAnswers, null, 2))

        const result = await attemptsApi.submit(attemptId, selectedAnswers)

        console.log('Quiz submitted successfully')
        console.log('Submit result:', JSON.stringify(result, null, 2))

        alert('✅ Quiz submetido com sucesso! Score: ' + (result.score || 0))
      } catch (error) {
        console.error('Error submitting attempt:', error)
        alert('❌ ERRO ao submeter quiz: ' + (error as any).message)
      }
    } else {
      console.error('NO ATTEMPT ID - Quiz will not be submitted!')
      alert('❌ ERRO: Nenhum attemptId encontrado. O quiz NÃO será submetido!')
    }
    setShowResults(true)
  }

  const handleBackToHome = () => {
    navigate('/')
  }

  const handleQuestionJump = (index: number) => {
    setCurrentQuestion(index)
  }

  const calculateQuizScore = () => {
    if (!quiz) return { correct: 0, total: 0, percentage: 0 }
    
    let correct = 0
    quiz.questions.forEach(question => {
      const userAnswer = selectedAnswers[question.id]
      
      if (question.type === 'mcq' || question.type === 'truefalse') {
        const correctChoice = question.choices?.find(choice => choice.correct)
        if (correctChoice && userAnswer === correctChoice.text) {
          correct++
        }
      } else if ((question.type === 'short' || question.type === 'gapfill' || question.type === 'essay') && userAnswer) {
        // For short answers, we could do a simple comparison
        // or always consider it correct to simplify
        if (userAnswer.toString().trim().length > 0) {
          correct++
        }
      } else if (question.type === 'matching' && userAnswer) {
        // For matching questions, check if matches are correct
        try {
          const userMatches = typeof userAnswer === 'string' ? JSON.parse(userAnswer) : userAnswer;
          if (Array.isArray(userMatches) && userMatches.length > 0) {
            // Simplification: consider it correct if there's some match
            correct++;
          }
        } catch (error) {
          // If we can't parse, consider it incorrect
        }
      } else if (question.type === 'ordering' && userAnswer) {
        try {
          const userOrder = typeof userAnswer === 'string' ? JSON.parse(userAnswer) : userAnswer
          if (Array.isArray(userOrder)) {
            const expected = (question.orderingItems || []).map(item => item.trim().toLowerCase())
            const received = userOrder.map((item: string) => (item || '').trim().toLowerCase())
            if (
              expected.length > 0 &&
              expected.length === received.length &&
              expected.every((item, idx) => item === received[idx])
            ) {
              correct++
            }
          }
        } catch (error) {
          // ignore parse errors for ordering answers
        }
      }
    })
    
    return {
      correct,
      total: quiz.questions.length,
      percentage: Math.round((correct / quiz.questions.length) * 100)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">A carregar quiz...</p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center transition-colors duration-200">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-4 transition-colors duration-200">
              <ExclamationIcon />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Quiz não encontrado</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              O quiz que você está a tentar acessar não existe ou foi removido.
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ChevronLeftIcon />
              <span className="ml-2">Voltar para a página principal</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (showResults) {
    const score = calculateQuizScore()
    const timeTaken = formatTime(elapsedTime)
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resultados do Quiz</h1>
              <button
                onClick={handleBackToHome}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Results Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
            {/* Score Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-8 text-center transition-colors duration-200">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mx-auto mb-4 transition-colors duration-200">
                <TrophyIcon />
              </div>
              <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">{score.percentage}%</div>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-1">
                Você acertou {score.correct} de {score.total} perguntas
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tempo total: {timeTaken}
              </p>
            </div>

            {/* Performance Message */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <div className="text-center">
                {score.percentage >= 80 ? (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 transition-colors duration-200">
                    <CheckCircleIcon />
                    <span className="ml-2">Excelente!</span>
                  </div>
                ) : score.percentage >= 60 ? (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 transition-colors duration-200">
                    <span>Bom trabalho!</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 transition-colors duration-200">
                    <span>Continue a praticar!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Question Review */}
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Revisão das Perguntas</h3>
              <div className="space-y-4">
                {quiz.questions.map((question, index) => {
                  const userAnswer = selectedAnswers[question.id]
                  let isCorrect = false

                  if (question.type === 'mcq' || question.type === 'truefalse') {
                    const correctChoice = question.choices?.find(choice => choice.correct)
                    isCorrect = correctChoice ? userAnswer === correctChoice.text : false
                  } else if (question.type === 'short' || question.type === 'gapfill' || question.type === 'essay') {
                    isCorrect = Boolean(userAnswer && userAnswer.toString().trim().length > 0)
                  } else if (question.type === 'matching') {
                    try {
                      const userMatches = typeof userAnswer === 'string' ? JSON.parse(userAnswer) : userAnswer;
                      isCorrect = Array.isArray(userMatches) && userMatches.length > 0;
                    } catch (error) {
                      isCorrect = false;
                    }
                  } else if (question.type === 'ordering') {
                    try {
                      const userOrder = typeof userAnswer === 'string' ? JSON.parse(userAnswer) : userAnswer;
                      if (Array.isArray(userOrder)) {
                        const expected = (question.orderingItems || []).map(item => item.trim().toLowerCase());
                        const received = userOrder.map((item: string) => (item || '').trim().toLowerCase());
                        isCorrect =
                          expected.length > 0 &&
                          expected.length === received.length &&
                          expected.every((item, idx) => item === received[idx]);
                      } else {
                        isCorrect = false;
                      }
                    } catch {
                      isCorrect = false;
                    }
                  }
                   
                  return (
                    <div key={question.id} className={`border rounded-lg transition-colors duration-200 ${isCorrect ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                      <div className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className={`flex items-center justify-center w-6 h-6 rounded-full text-white text-sm font-bold flex-shrink-0 ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                            {isCorrect ? '✓' : '✕'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900 dark:text-white">Pergunta {index + 1}</span>
                              <span className={`text-xs font-medium px-2 py-1 rounded-full transition-colors duration-200 ${isCorrect ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'}`}>
                                {isCorrect ? 'Correto' : 'Incorreto'}
                              </span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 mb-3">{question.prompt}</p>
                            
                            {question.type === 'mcq' || question.type === 'truefalse' ? (
                              <div className="text-sm space-y-1">
                                <div className="flex items-center">
                                  <span className="font-medium text-gray-500 dark:text-gray-400 mr-2">A sua resposta:</span>
                                  <span className={isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                    {userAnswer || 'Não respondida'}
                                  </span>
                                </div>
                                {!isCorrect && (
                                  <div className="flex items-center">
                                    <span className="font-medium text-gray-500 dark:text-gray-400 mr-2">Resposta correta:</span>
                                    <span className="text-green-600 dark:text-green-400">
                                      {question.choices?.find(c => c.correct)?.text}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : question.type === 'matching' ? (
                              <div className="text-sm space-y-1">
                                <div className="flex items-center">
                                  <span className="font-medium text-gray-500 dark:text-gray-400 mr-2">A sua resposta:</span>
                                  <span className={isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                    {userAnswer ? 'Associado' : 'Não respondida'}
                                  </span>
                                </div>
                                {!isCorrect && (
                                  <div className="flex items-center">
                                    <span className="font-medium text-gray-500 dark:text-gray-400 mr-2">Respostas corretas:</span>
                                    <span className="text-green-600 dark:text-green-400">
                                      {question.matchingPairs?.map(pair => `${pair.leftItem} ↔ ${pair.rightItem}`).join(', ')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : question.type === 'ordering' ? (
                              <div className="text-sm space-y-1">
                                <div className="flex items-center">
                                  <span className="font-medium text-gray-500 dark:text-gray-400 mr-2">A sua resposta:</span>
                                  <span className={isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                    {(() => {
                                      if (!userAnswer) return 'Não respondida';
                                      try {
                                        const parsed = typeof userAnswer === 'string' ? JSON.parse(userAnswer) : userAnswer;
                                        return Array.isArray(parsed) ? parsed.join(' → ') : 'Não respondida';
                                      } catch {
                                        return 'Não respondida';
                                      }
                                    })()}
                                  </span>
                                </div>
                                {!isCorrect && (
                                  <div className="flex items-center">
                                    <span className="font-medium text-gray-500 dark:text-gray-400 mr-2">Ordem correta:</span>
                                    <span className="text-green-600 dark:text-green-400">
                                      {(question.orderingItems || []).join(' → ')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm">
                                <div className="flex items-center">
                                  <span className="font-medium text-gray-500 dark:text-gray-400 mr-2">A sua resposta:</span>
                                  <span className={isCorrect ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                                    {userAnswer?.toString() || 'Não respondida'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    // Save results to localStorage before navigating
                    const resultData = {
                      score: score.correct,
                      totalQuestions: score.total,
                      percentage: score.percentage,
                      quizTitle: quiz.title,
                      timeTaken: timeTaken,
                      attemptId: attemptId
                    }
                    localStorage.setItem('quizResults', JSON.stringify(resultData))
                    navigate('/results', { state: resultData })
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Ver Resultados Detalhados
                </button>
                <button
                  onClick={handleBackToHome}
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Voltar para Início
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const question = quiz.questions[currentQuestion]
  const hasAnswer = question ? selectedAnswers[question.id] !== undefined : false
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100

  const handleStartQuiz = () => {
    setShowSupport(false)
    setStartTime(Date.now())
  }

  // Show support text if available and not dismissed
  if (showSupport) {
    if (quiz.supportText && quiz.supportText.trim()) {
      return <SupportText supportText={quiz.supportText} onStartQuiz={handleStartQuiz} />
    } else {
      // If there's no support text, start quiz immediately
      handleStartQuiz()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 mobile-safe-top mobile-safe-bottom">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200 mobile-element-spacing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mobile-stack">
            <div className="flex items-center space-x-4 mobile-element-spacing">
              <button
                onClick={handleBackToHome}
                className="mobile-optimized-button mobile-pressable p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mobile-focus-visible"
                title="Sair do quiz"
              >
                <XIcon />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mobile-heading">{quiz.title}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mobile-caption">
                  {quiz.subject && `${quiz.subject} • `}
                  {quiz.grade && quiz.grade}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4 mobile-element-spacing">
              {/* Timer */}
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mobile-caption">
                <ClockIcon />
                <span className="ml-1">{formatTime(elapsedTime)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200 mobile-element-spacing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2 mobile-stack">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mobile-caption">
              Questão {currentQuestion + 1} de {quiz.questions.length}
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mobile-caption">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* YouTube Videos - Only embeds, free, no API key */}
      {quiz.youtubeVideos && quiz.youtubeVideos.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                Vídeos de apoio ao conteúdo
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Estes vídeos são incorporados diretamente do YouTube através de iframes públicos (uso gratuito).
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              {quiz.youtubeVideos.map((url, index) => {
                const embedUrl = getYouTubeEmbedUrl(url)
                if (!embedUrl) return null

                return (
                  <div key={`${embedUrl}-${index}`} className="w-full aspect-video bg-black/5 dark:bg-white/5 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
                    <iframe
                      src={embedUrl}
                      title={`YouTube video ${index + 1}`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Question Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200 mobile-element-spacing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center space-x-2 overflow-x-auto mobile-scrollable">
            {quiz.questions.map((q, index) => {
              const isAnswered = selectedAnswers[q.id] !== undefined
              const isCurrent = index === currentQuestion
              
              return (
                <button
                  key={q.id}
                  onClick={() => handleQuestionJump(index)}
                  className={`mobile-optimized-button mobile-pressable flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : isAnswered
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-300 dark:border-green-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600'
                  } mobile-focus-visible`}
                  title={`Pergunta ${index + 1}${isAnswered ? ' (respondida)' : ''}`}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
          <div className="p-6 sm:p-8 mobile-element-spacing">
            <div className="mb-6 mobile-element-spacing">
              <div className="flex items-start space-x-3 mobile-stack">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-bold text-sm flex-shrink-0 transition-colors duration-200">
                  {currentQuestion + 1}
                </div>
                <div className="flex-1">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 mobile-stack">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white leading-relaxed mobile-subheading">
                      {question?.prompt || 'Carregando pergunta...'}
                    </h2>
                    {question?.prompt && (
                      <AudioNarrator
                        text={question.prompt}
                        label="Ouvir pergunta"
                        className="self-start whitespace-nowrap"
                      />
                    )}
                  </div>
                   
                  {/* Display question image if available */}
                  {question?.imageUrl && (
                    <div className="mb-4 flex justify-center mobile-element-spacing">
                      <img
                        src={question.imageUrl}
                        alt="Imagem da pergunta"
                        className="max-w-md max-h-64 object-contain rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm transition-colors duration-200"
                        onLoad={() => {
                          console.log('Quiz image loaded successfully:', question.imageUrl);
                        }}
                        onError={(e) => {
                          console.error('Error loading quiz image:', question.imageUrl);
                          const imgElement = e.target as HTMLImageElement;
                          imgElement.style.display = 'none';
                           
                          // Show error message
                          const errorDiv = document.createElement('div');
                          errorDiv.className = 'text-red-500 text-sm p-2 border border-red-200 rounded bg-red-50 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 text-center';
                          errorDiv.textContent = 'Não foi possível carregar a imagem desta pergunta';
                          imgElement.parentNode?.insertBefore(errorDiv, imgElement.nextSibling);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
           
            {question && (question.type === 'mcq' || question.type === 'truefalse') ? (
              <div className="space-y-3 mobile-element-spacing">
                {question.choices?.map((choice, index) => {
                  const isSelected = selectedAnswers[question.id] === choice.text
                  const letter = String.fromCharCode(65 + index)

                  return (
                    <div
                      key={choice.id}
                      className={`mobile-optimized-button mobile-pressable p-4 border rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                      } mobile-focus-visible`}
                      onClick={() => handleAnswerSelect(question.id, choice.text)}
                    >
                      <div className="flex items-center">
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 mr-3 text-sm font-medium ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-400 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                        }`}>
                          {isSelected ? '✓' : letter}
                        </div>
                        <span className="text-gray-900 dark:text-white mobile-body-text">{choice.text}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : question ? (
              <div>
               {question.type === 'matching' ? (
                 <MatchingQuestion
                   question={question}
                   selectedAnswer={selectedAnswers[question.id]}
                   onAnswerSelect={(answer: string) => handleAnswerSelect(question.id, answer)}
                 />
               ) : question.type === 'ordering' ? (
                 <OrderingQuestion
                   question={question}
                   selectedAnswer={selectedAnswers[question.id]}
                   onAnswerSelect={(answer: string) => handleAnswerSelect(question.id, answer)}
                 />
               ) : (
                 <div>
                   <textarea
                     className="mobile-optimized-textarea w-full p-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors duration-200 mobile-focus-visible"
                     rows={4}
                     placeholder="Digite a sua resposta aqui..."
                     value={selectedAnswers[question.id]?.toString() || ''}
                     onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
                   />
                   <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mobile-caption">
                     Pressione Ctrl+Enter para enviar (opcional)
                   </p>
                 </div>
               )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">A carregar pergunta...</p>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 transition-colors duration-200 mobile-element-spacing">
            <div className="flex justify-between mobile-stack">
              <button
                className={`mobile-optimized-button mobile-pressable flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentQuestion === 0
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 mobile-focus-visible'
                }`}
                disabled={currentQuestion === 0}
                onClick={handlePrevious}
              >
                <ChevronLeftIcon />
                <span className="ml-2">Anterior</span>
              </button>
              
              {currentQuestion === quiz.questions.length - 1 ? (
                <button
                  className={`mobile-optimized-button mobile-pressable flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                    hasAnswer
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  } mobile-focus-visible`}
                  disabled={!hasAnswer}
                  onClick={handleFinish}
                >
                  <span className="mr-2">Concluir</span>
                  <CheckCircleIcon />
                </button>
              ) : (
                <button
                  className={`mobile-optimized-button mobile-pressable flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                    hasAnswer
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  } mobile-focus-visible`}
                  disabled={!hasAnswer}
                  onClick={handleNext}
                >
                  <span className="mr-2">Próxima</span>
                  <ChevronRightIcon />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuizPage
