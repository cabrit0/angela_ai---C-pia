import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useQuiz } from '../hooks/useQuiz'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useAuth } from '../lib/auth/AuthContext'
import QuizForm from '../components/QuizForm'
import QuestionEditor from '../components/QuestionEditor'
import SupportTextForm from '../components/SupportTextForm'
import QuizVideoSuggestions from '../components/QuizVideoSuggestions'
import AiTextPanel from '../components/AiTextPanel'
import AiProviderSelector from '../components/AiProviderSelector'
import type { Quiz, Question, AppSettings, AiProvider } from '../types'
import { loadSettings } from '../lib/utils/storage'
import {
  createQuestion as createQuestionApi,
  updateQuestion as updateQuestionApi,
  deleteQuestion as deleteQuestionApi,
  updateQuiz as updateQuizApi,
  getQuizQuestions,
  getQuizById,
} from '../lib/api'

const isValidObjectId = (value?: string | null): boolean => {
  if (!value) return false
  
  // More flexible validation - accepts different ID formats
  // MongoDB ObjectId format (24 hex characters)
  if (value.length === 24 && /^[0-9a-fA-F]{24}$/.test(value)) {
    return true
  }
  
  // UUID format
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i.test(value)) {
    return true
  }
  
  // Shorter alphanumeric IDs (at least 3 characters)
  if (value.length >= 3 && /^[a-zA-Z0-9_-]+$/.test(value)) {
    return true
  }
  
  return false
}

// Icon components
const ChevronLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const SaveIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const DocumentTextIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const QuestionMarkCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExclamationIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

function EditQuiz() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const { editQuiz, quizzes } = useQuiz()
  const { user } = useAuth()
  
  // Check if user is a student and redirect them
  useEffect(() => {
    if (user && user.role === 'STUDENT') {
      navigate('/')
      return
    }
  }, [user, navigate])
  
  // Get user settings
  const [appSettings, setAppSettings] = useLocalStorage<AppSettings>('quiz-app-settings', {
    textProvider: 'pollinations',
    imageProvider: 'pollinations',
    updatedAt: Date.now()
  })
  
  // Sync settings with storage - run only once
  useEffect(() => {
    const currentSettings = loadSettings()
    setAppSettings(currentSettings)
  }, [])
  
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>(appSettings.textProvider)
  const [activeTab, setActiveTab] = useState<'details' | 'questions'>('details')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  // Validate quizId before any API calls
  useEffect(() => {
    console.log('[EditQuiz] Validating quizId:', quizId)
    
    // Check if quizId is undefined, null, 'undefined', or empty string
    if (!quizId || quizId === 'undefined' || quizId === 'null' || quizId.trim() === '') {
      console.error('[EditQuiz] Invalid quizId detected:', quizId)
      console.log('[EditQuiz] Redirecting to dashboard due to invalid quizId')
      navigate('/')
      return
    }
    
    // Additional validation using the existing isValidObjectId function
    if (!isValidObjectId(quizId)) {
      console.error('[EditQuiz] quizId failed validation:', quizId)
      console.log('[EditQuiz] Redirecting to dashboard due to invalid quizId format')
      navigate('/')
      return
    }
    
    console.log('[EditQuiz] quizId validation passed:', quizId)
  }, [quizId, navigate])

  useEffect(() => {
    let cancelled = false

    async function load() {
      // Enhanced validation for quizId
      if (!quizId || quizId === 'undefined' || quizId === 'null' || quizId.trim() === '') {
        console.error('[EditQuiz] Invalid quizId in load function:', quizId)
        navigate('/')
        return
      }

      // Additional validation using the existing isValidObjectId function
      if (!isValidObjectId(quizId)) {
        console.error('[EditQuiz] quizId failed validation in load function:', quizId)
        navigate('/')
        return
      }

      console.log('[EditQuiz] Loading quiz with validated quizId:', quizId)
      setIsLoading(true)

      try {
        // Fonte primária: estado global já carregado da API (quando autenticado)
        let baseQuiz = quizzes.find((q) => q.id === quizId) || null

        // Se não encontrou no estado global, tenta buscar da API
        if (!baseQuiz) {
          try {
            console.log('[EditQuiz] Fetching quiz from API with quizId:', quizId)
            baseQuiz = await getQuizById(quizId)
            // Não atualiza o estado global aqui para evitar loops
          } catch (apiError) {
            console.warn('[EditQuiz] Erro ao buscar quiz da API:', apiError)
            // Continua com baseQuiz como null
          }
        }

        if (!baseQuiz && !cancelled) {
          setIsLoading(false)
          return
        }

        // Busca as perguntas do quiz
        let remoteQuestions: Question[] = []
        if (baseQuiz) {
          try {
            remoteQuestions = await getQuizQuestions(quizId)
          } catch (questionsError) {
            console.warn('[EditQuiz] Erro ao buscar perguntas:', questionsError)
            // Continua com array vazio de perguntas
          }
        }

        if (cancelled) return

        const effectiveQuiz: Quiz = {
          ...baseQuiz!,
          questions: remoteQuestions,
        }

        setQuiz(effectiveQuiz)
        setQuestions(remoteQuestions)

        if (typeof window !== 'undefined' && effectiveQuiz.subject && effectiveQuiz.subject.trim()) {
          // Validate quiz ID before using it for localStorage
          if (effectiveQuiz.id && effectiveQuiz.id !== 'undefined' && effectiveQuiz.id !== 'null' && effectiveQuiz.id.trim() !== '') {
            console.log('[EditQuiz] Using quiz ID for localStorage:', effectiveQuiz.id);
            try {
              window.localStorage.setItem(
                `ai_quiz_subject_${effectiveQuiz.id}`,
                effectiveQuiz.subject.trim()
              )
            } catch (error) {
              console.warn('Não foi possível guardar a disciplina do quiz no localStorage para AI:', error)
            }
          } else {
            console.error('[EditQuiz] Invalid quiz ID for localStorage:', effectiveQuiz.id);
          }
        }

        setIsLoading(false)
      } catch (error) {
        console.error('[API] Falha ao carregar quiz para edição:', error)
        if (!cancelled) {
          setIsLoading(false)
          setTimeout(() => navigate('/'), 1500)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId, navigate])

  // Removed the second useEffect that was causing unnecessary re-renders
  // The quiz state is already managed by the main load useEffect above
  
  // Update selectedProvider when appSettings changes
  useEffect(() => {
    setSelectedProvider(appSettings.textProvider)
  }, [appSettings.textProvider])

  // Simple notification function
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    // Create a simple notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
    
    // Set color based on type
    const colors = {
      success: 'bg-green-500 text-white',
      error: 'bg-red-500 text-white',
      warning: 'bg-yellow-500 text-white',
      info: 'bg-blue-500 text-white'
    };
    
    notification.className += ` ${colors[type]}`;
    notification.innerHTML = `
      <div class="flex items-center">
        <div class="flex-1">${message}</div>
        <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
      notification.classList.add('translate-x-0');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => {
        if (notification.parentElement) {
          notification.parentElement.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };

  const handleTogglePublish = async () => {
    // Defensive programming: validate quizId before API call
    if (!quizId || quizId === 'undefined' || quizId === 'null' || quizId.trim() === '') {
      console.error('[EditQuiz] Invalid quizId in handleTogglePublish:', quizId);
      showNotification('Erro: ID do quiz inválido. Recarregue a página.', 'error');
      return;
    }
    
    if (!quiz) return;
    const nextState = !quiz.isPublished;
    setIsPublishing(true);
    try {
      console.log('[EditQuiz] Toggling publish state for quizId:', quizId);
      await updateQuizApi({ id: quizId, isPublished: nextState });
      // Atualiza o estado local apenas após a confirmação da API
      setQuiz(prev => (prev ? { ...prev, isPublished: nextState } as Quiz : prev));
      editQuiz(quizId, { ...quiz, isPublished: nextState });
      showNotification(
        nextState ? 'Quiz publicado com sucesso!' : 'Quiz marcado como rascunho.',
        'success',
      );
    } catch (error) {
      console.error('[API] Erro ao atualizar estado de publicação do quiz:', error);
      showNotification('Não foi possível atualizar o estado de publicação.', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveQuizDetails = async (
    quizData: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt' | 'questions'> & { youtubeVideos?: string[] }
  ) => {
    // Defensive programming: validate quizId before API call
    if (!quizId || quizId === 'undefined' || quizId === 'null' || quizId.trim() === '') {
      console.error('[EditQuiz] Invalid quizId in handleSaveQuizDetails:', quizId);
      showNotification('Erro: ID do quiz inválido. Recarregue a página.', 'error');
      return;
    }
    
    if (!quiz) return

    const normalizedVideos = (quizData.youtubeVideos || [])
      .map((u) => u.trim())
      .filter((u) => u.length > 0)

    try {
      console.log('[EditQuiz] Saving quiz details for quizId:', quizId);
      await updateQuizApi({
        id: quizId,
        title: quizData.title,
        description: quizData.subject,
        grade: quizData.grade,
        supportText: quiz.supportText,
        youtubeVideos: normalizedVideos,
      })
      editQuiz(quizId, {
        ...quiz,
        title: quizData.title,
        subject: quizData.subject,
        grade: quizData.grade,
        isPublished: quiz.isPublished,
        youtubeVideos: normalizedVideos,
        questions,
      })

      const updatedLocalQuiz: Quiz = {
        ...quiz,
        title: quizData.title,
        subject: quizData.subject,
        grade: quizData.grade,
        isPublished: quiz.isPublished,
        youtubeVideos: normalizedVideos,
        questions,
      }
      setQuiz(updatedLocalQuiz)

      if (typeof window !== 'undefined' && updatedLocalQuiz.subject && updatedLocalQuiz.subject.trim()) {
        // Validate quiz ID before using it for localStorage
        if (updatedLocalQuiz.id && updatedLocalQuiz.id !== 'undefined' && updatedLocalQuiz.id !== 'null' && updatedLocalQuiz.id.trim() !== '') {
          console.log('[EditQuiz] Using quiz ID for localStorage in saveQuizDetails:', updatedLocalQuiz.id);
          try {
            window.localStorage.setItem(
              `ai_quiz_subject_${updatedLocalQuiz.id}`,
              updatedLocalQuiz.subject.trim()
            )
          } catch (error) {
            console.warn('Não foi possível atualizar a disciplina do quiz no localStorage para AI:', error)
          }
        } else {
          console.error('[EditQuiz] Invalid quiz ID for localStorage in saveQuizDetails:', updatedLocalQuiz.id);
        }
      }

      showNotification(`Quiz "${quizData.title}" atualizado com sucesso!`, 'success')
      // Não marca como alterações não salvas, pois os detalhes foram sincronizados com a API
    } catch (error) {
      console.error('[API] Erro ao atualizar detalhes do quiz:', error)
      showNotification('Não foi possível atualizar o quiz na API.', 'error')
    }
  }

  const handleAddQuestion = async (questionData: Omit<Question, 'id'>) => {
    // Defensive programming: validate quizId before API call
    if (!quizId || quizId === 'undefined' || quizId === 'null' || quizId.trim() === '') {
      console.error('[EditQuiz] Invalid quizId in handleAddQuestion:', quizId);
      showNotification('Erro: ID do quiz inválido. Recarregue a página.', 'error')
      return
    }

    try {
      console.log('[EditQuiz] Adding question to quizId:', quizId);
      await createQuestionApi(quizId, questionData)
      const refreshed = await getQuizQuestions(quizId)

      setQuestions(refreshed)
      setQuiz(prev => (prev ? { ...prev, questions: refreshed } as Quiz : prev))
      // Não marca como alterações não salvas, pois a adição foi sincronizada com a API
      showNotification('Pergunta adicionada com sucesso!', 'success')
    } catch (error) {
      console.error('[API] Erro ao adicionar pergunta:', error)
      showNotification('Não foi possível adicionar a pergunta na API.', 'error')
    }
  }

  const handleEditQuestion = async (questionId: string, questionData: Omit<Question, 'id'>) => {
    // Defensive programming: validate quizId before API call
    if (!quizId || quizId === 'undefined' || quizId === 'null' || quizId.trim() === '') {
      console.error('[EditQuiz] Invalid quizId in handleEditQuestion:', quizId);
      showNotification('Erro: ID do quiz inválido. Recarregue a página.', 'error')
      return
    }

    try {
      console.log('[EditQuiz] Editing question in quizId:', quizId, 'questionId:', questionId);
      await updateQuestionApi(quizId, questionId, questionData)
      const refreshed = await getQuizQuestions(quizId)
      setQuestions(refreshed)
      setQuiz(prev => (prev ? { ...prev, questions: refreshed } as Quiz : prev))
      // Não marca como alterações não salvas, pois a edição foi sincronizada com a API
      showNotification('Pergunta atualizada.', 'success')
    } catch (error) {
      console.error('[API] Erro ao atualizar pergunta:', error)
      showNotification('Não foi possível atualizar a pergunta na API.', 'error')
    }
  }

  const handleRemoveQuestion = async (questionId: string) => {
    // Defensive programming: validate quizId before API call
    if (!quizId || quizId === 'undefined' || quizId === 'null' || quizId.trim() === '') {
      console.error('[EditQuiz] Invalid quizId in handleRemoveQuestion:', quizId);
      showNotification('Erro: ID do quiz inválido. Recarregue a página.', 'error')
      return
    }

    try {
      console.log('[EditQuiz] Removing question from quizId:', quizId, 'questionId:', questionId);
      await deleteQuestionApi(quizId, questionId)
      setQuestions(prev => prev.filter(q => q.id !== questionId))
      setQuiz(prev => (prev ? { ...prev, questions: prev.questions.filter(q => q.id !== questionId) } as Quiz : prev))
      // Não marca como alterações não salvas, pois a exclusão foi sincronizada com a API
      showNotification('Pergunta removida com sucesso.', 'info')
    } catch (error) {
      console.error('[API] Erro ao remover pergunta:', error)
      showNotification('Não foi possível remover a pergunta na API.', 'error')
    }
  }

  const handleSaveAllChanges = async () => {
    // Defensive programming: validate quizId before API call
    if (!quizId || quizId === 'undefined' || quizId === 'null' || quizId.trim() === '') {
      console.error('[EditQuiz] Invalid quizId in handleSaveAllChanges:', quizId);
      showNotification('Erro: ID do quiz inválido. Recarregue a página.', 'error')
      return
    }
    
    if (!quiz) return

    try {
      const normalizedVideos = (quiz.youtubeVideos || [])
        .map((u) => (u || '').trim())
        .filter((u) => u.length > 0)

      // Sincroniza com a API
      console.log('[EditQuiz] Saving all changes for quizId:', quizId);
      await updateQuizApi({
        id: quizId,
        title: quiz.title,
        description: quiz.subject,
        grade: quiz.grade,
        isPublished: quiz.isPublished,
        supportText: quiz.supportText,
        youtubeVideos: normalizedVideos,
      })

      // Atualiza o estado local
      editQuiz(quizId, {
        ...quiz,
        youtubeVideos: normalizedVideos,
        questions,
      })

      showNotification(`Quiz "${quiz.title}" atualizado com sucesso!`, 'success')
      setHasUnsavedChanges(false)
      setTimeout(() => navigate('/'), 1200)
    } catch (error) {
      console.error('[API] Erro ao salvar alterações do quiz:', error)
      showNotification('Não foi possível salvar todas as alterações na API.', 'error')
    }
  }

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm('Você tem alterações não salvas. Tem certeza de que deseja sair?')
      if (!confirmLeave) return
    }
    navigate('/')
  }

  const handleAiQuestionsGenerated = async (questions: Question[]) => {
    // Defensive programming: validate quizId before API call
    if (!quizId || quizId === 'undefined' || quizId === 'null' || quizId.trim() === '') {
      console.error('[EditQuiz] Invalid quizId in handleAiQuestionsGenerated:', quizId);
      showNotification('Não conseguimos identificar este quiz. Recarregue a página e tente novamente.', 'error');
      return;
    }

    const currentQuiz = quizzes.find(q => q.id === quizId);
    if (!currentQuiz) {
      showNotification('O quiz selecionado já não existe. Volte atrás e escolha outro.', 'error');
      return;
    }

    if (!questions || questions.length === 0) {
      showNotification('A geração não devolveu perguntas válidas.', 'warning');
      return;
    }

    const hasInvalidStructure = questions.some((question, index) => {
      if (!question.type || !question.prompt) {
        showNotification(`Pergunta ${index + 1} está incompleta. Verifique o enunciado e o tipo.`, 'error');
        return true;
      }

      if ((question.type === 'mcq' || question.type === 'truefalse') &&
        (!question.choices || question.choices.length === 0 || !question.choices.some(choice => choice.correct))) {
        showNotification(`Pergunta ${index + 1} precisa de opções com uma resposta correta.`, 'error');
        return true;
      }

      if ((question.type === 'short' || question.type === 'gapfill' || question.type === 'essay') && (!question.answer || !String(question.answer).trim())) {
        showNotification(`Pergunta ${index + 1} precisa de uma resposta preenchida.`, 'error');
        return true;
      }

      if (question.type === 'matching') {
        const pairs = question.matchingPairs || [];
        const hasValidPairs = pairs.length > 0 && pairs.every(pair =>
          pair.leftItem && pair.leftItem.trim() && pair.rightItem && pair.rightItem.trim()
        );
        if (!hasValidPairs) {
          showNotification(`Pergunta ${index + 1} de associação precisa de pares completos.`, 'error');
          return true;
        }
      }

      if (question.type === 'ordering') {
        const items = (question.orderingItems || []).map(item => item?.trim()).filter(Boolean);
        if (items.length < 3) {
          showNotification(`Pergunta ${index + 1} de ordenação precisa de pelo menos 3 itens definidos.`, 'error');
          return true;
        }
      }

      return false;
    });

    if (hasInvalidStructure) {
      return;
    }

    try {
      // Process all questions in parallel
      const createPromises = questions.map(async (question, questionIndex) => {
        const { id: _discarded, ...questionWithoutId } = question as Question & { id?: string };
        const normalizedChoices = questionWithoutId.choices?.map((choice, choiceIndex) => ({
          id: choice.id || `${Date.now()}-${questionIndex}-${choiceIndex}`,
          text: choice.text?.trim() || '',
          correct: !!choice.correct
        }));

        const normalizedPairs = questionWithoutId.matchingPairs?.map((pair, pairIndex) => ({
          id: pair.id || `${Date.now()}-${questionIndex}-pair-${pairIndex}`,
          leftItem: pair.leftItem?.trim() || '',
          rightItem: pair.rightItem?.trim() || ''
        }));

        const normalizedOrdering = questionWithoutId.orderingItems
          ? questionWithoutId.orderingItems.map(item => item?.trim()).filter(Boolean)
          : undefined;

        const payload: Omit<Question, 'id'> = {
          ...questionWithoutId,
          prompt: question.prompt.trim(),
          choices: normalizedChoices,
          matchingPairs: normalizedPairs,
          orderingItems: normalizedOrdering,
          answer:
            question.type === 'ordering'
              ? normalizedOrdering?.join(' -> ')
              : (question.type === 'short' || question.type === 'gapfill' || question.type === 'essay'
                  ? String(question.answer ?? '').trim()
                  : question.answer)
        };

        return createQuestionApi(quizId, payload);
      });

      // Wait for all questions to be created
      await Promise.all(createPromises);

      // Refresh questions from API to get the latest state
      const refreshed = await getQuizQuestions(quizId);
      setQuestions(refreshed);
      setQuiz(prev => (prev ? { ...prev, questions: refreshed } as Quiz : prev));

      setHasUnsavedChanges(false);
      setShowAiPanel(false);
      showNotification(`${questions.length} perguntas adicionadas com sucesso!`, 'success');
    } catch (error) {
      console.error('Erro ao adicionar perguntas geradas:', error);
      showNotification('Não foi possível adicionar as perguntas geradas. Tente novamente.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 transition-colors duration-200">Carregando quiz...</p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md dark:bg-yellow-900/20 dark:border-yellow-800 transition-colors duration-200">
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-4">
              <ExclamationIcon />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-200">Quiz não encontrado</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4 transition-colors duration-200">O quiz que você está tentando editar não foi encontrado ou foi removido.</p>
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCancel}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-300 hover:scale-110 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
                title="Voltar para a página inicial"
              >
                <ChevronLeftIcon />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Editar Quiz</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">Modifique as informações e perguntas do seu quiz</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {quiz && (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    quiz.isPublished
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200'
                  }`}
                >
                  {quiz.isPublished ? 'Publicado' : 'Rascunho'}
                </span>
              )}
              {quiz && (
                <button
                  onClick={handleTogglePublish}
                  disabled={isPublishing}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium shadow-sm hover:bg-blue-700 disabled:opacity-60 transition-all duration-200"
                >
                  {isPublishing
                    ? 'A atualizar...'
                    : quiz.isPublished
                    ? 'Marcar como rascunho'
                    : 'Publicar quiz'}
                </button>
              )}
              {hasUnsavedChanges && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>
                  Alterações não salvas
                </span>
              )}
              <button
                onClick={handleSaveAllChanges}
                className="inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl text-sm sm:text-base whitespace-nowrap hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:scale-105"
              >
                <SaveIcon />
                <span className="ml-2">Salvar Todas as Alterações</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <DocumentTextIcon />
                <span>Informações do Quiz</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                activeTab === 'questions'
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <QuestionMarkCircleIcon />
                <span>Perguntas ({questions.length})</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden dark:bg-gray-800 dark:border-gray-700 transition-all duration-300 hover:shadow-lg">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-gray-700 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30 transition-colors duration-200">
                    <DocumentTextIcon />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-200">Informações Básicas</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">Atualize os detalhes fundamentais do seu quiz</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <QuizForm
                  initialData={quiz}
                  onSubmit={handleSaveQuizDetails}
                  onCancel={handleCancel}
                />
              </div>
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="space-y-6">
            {/* Quiz Info Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden dark:bg-gray-800 dark:border-gray-700 transition-all duration-300 hover:shadow-lg animate-fade-in">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-gray-700 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30 transition-colors duration-200">
                      <QuestionMarkCircleIcon />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-200">Gerenciar Perguntas</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">Adicione, edite ou remova perguntas do seu quiz</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">Quiz: {quiz.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 transition-colors duration-200">{questions.length} perguntas</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors duration-200">Título:</span>
                    <p className="text-base font-medium text-gray-900 dark:text-white transition-colors duration-200">{quiz.title}</p>
                  </div>
                  {quiz.subject && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors duration-200">Disciplina:</span>
                      <p className="text-base font-medium text-gray-900 dark:text-white transition-colors duration-200">{quiz.subject}</p>
                    </div>
                  )}
                  {quiz.grade && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors duration-200">Nível/Ano:</span>
                      <p className="text-base font-medium text-gray-900 dark:text-white transition-colors duration-200">{quiz.grade}</p>
                    </div>
                  )}
                </div>

                {/* AI Assistant Button */}
                <div className="mb-6">
                  <button
                    onClick={() => setShowAiPanel(!showAiPanel)}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:scale-105"
                  >
                    <SparklesIcon />
                    <span className="ml-2">{showAiPanel ? 'Ocultar' : 'Gerar perguntas com IA'}</span>
                  </button>
                </div>

                {/* AI Panel */}
                {showAiPanel && (
                  <div className="space-y-4 mb-6">
                    <AiProviderSelector
                      label="Provedor de IA para Geração de Perguntas"
                      value={selectedProvider}
                      onChange={setSelectedProvider}
                    />
                   
                    {/* API Key Configuration Alert */}
                    {((selectedProvider === 'huggingface' && !appSettings.huggingFaceToken) ||
                      (selectedProvider === 'mistral' && !appSettings.mistralToken)) && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-yellow-800">
                                {selectedProvider === 'huggingface' ? 'Token do Hugging Face necessário' : 'Chave de API do Mistral necessária'}
                              </h3>
                              <div className="mt-2 text-sm text-yellow-700">
                                <p>
                                  Você precisa configurar uma {selectedProvider === 'huggingface' ? 'token do Hugging Face' : 'chave de API do Mistral'} para usar este provedor.
                                </p>
                                <div className="mt-3 flex space-x-3">
                                  <button
                                    onClick={() => navigate('/settings')}
                                    className="px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                  >
                                    Configurar nas Definições
                                  </button>
                                  <button
                                    onClick={() => {
                                      // Show quick instructions in a modal/tooltip
                                      alert(selectedProvider === 'huggingface'
                                        ? 'Para obter seu token do Hugging Face:\n1. Acesse huggingface.co/settings/tokens\n2. Crie um novo token\n3. Copie e cole nas Definições'
                                        : 'Para obter sua chave de API do Mistral:\n1. Acesse console.mistral.ai/api-keys\n2. Crie uma nova chave\n3. Copie e cole nas Definições');
                                    }}
                                    className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                  >
                                    Como Obter
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                   
                    <AiTextPanel
                      onQuestionsGenerated={handleAiQuestionsGenerated}
                      currentProvider={selectedProvider}
                      huggingFaceToken={appSettings.huggingFaceToken}
                      mistralToken={appSettings.mistralToken}
                      quizId={quizId || undefined}
                      disciplinaFromQuiz={quiz?.subject || ''}
                    />
                  </div>
                )}

                {/* Support Text Form - Only show if quiz has questions */}
                {questions.length > 0 && (
                  <SupportTextForm
                    quiz={quiz}
                    questions={questions}
                    onUpdateSupportText={async (supportText) => {
                      setQuiz(prev => prev ? { ...prev, supportText } : null);
                      if (quizId && quiz) {
                        editQuiz(quizId, { ...quiz, supportText });

                        // Atualiza via API
                        try {
                          await updateQuizApi({
                            id: quizId,
                            supportText: supportText,
                          });
                          console.log('[EditQuiz] Support text saved to API');
                        } catch (error) {
                          console.error('[EditQuiz] Error saving support text to API:', error);
                        }
                      }
                    }}
                    aiProvider={selectedProvider}
                    aiToken={
                      selectedProvider === 'huggingface' ? appSettings.huggingFaceToken :
                      selectedProvider === 'mistral' ? appSettings.mistralToken :
                      ''
                    }
                  />
                )}

                {/* Question Editor */}
                <QuestionEditor
                  questions={questions}
                  onAddQuestion={handleAddQuestion}
                  onEditQuestion={handleEditQuestion}
                  onRemoveQuestion={handleRemoveQuestion}
                />

                {/* YouTube Video Suggestions - disponível também ao editar,
                    apenas quando há perguntas (contexto real). */}
                {questions.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                      Vídeos de apoio do YouTube
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Gera pesquisas contextualizadas, usa o botão Abrir para validar cada resultado e clica em Adicionar para ligar o vídeo diretamente ao quiz.
                    </p>
                    <QuizVideoSuggestions
                      quizContext={{
                        title: quiz.title,
                        subject: quiz.subject,
                        grade: quiz.grade,
                        introText: (quiz as any).supportText,
                        questions: questions.map((q) => ({
                          type: q.type,
                          prompt: q.prompt,
                          tags: [],
                        })),
                      }}
                      value={quiz.youtubeVideos || []}
                      onChange={async (videos: string[]) => {
                        if (!quizId) return

                        // Atualiza o estado local imediatamente
                        editQuiz(quizId, {
                          ...quiz,
                          youtubeVideos: videos,
                        })

                        // Salva automaticamente na API
                        try {
                          const normalizedVideos = videos
                            .map((u) => (u || '').trim())
                            .filter((u) => u.length > 0)

                          await updateQuizApi({
                            id: quizId,
                            youtubeVideos: normalizedVideos,
                          })

                          console.log('[EditQuiz] Vídeos salvos automaticamente na API')
                        } catch (error) {
                          console.error('[EditQuiz] Erro ao salvar vídeos na API:', error)
                          showNotification('Erro ao salvar vídeos. Tente novamente.', 'error')
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EditQuiz


