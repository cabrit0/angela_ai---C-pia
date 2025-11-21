import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../hooks/useQuiz';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from '../lib/auth/AuthContext';
import type { Quiz, Question, AppSettings, AiProvider } from '../types';
import QuizForm from '../components/QuizForm';
import QuestionEditor from '../components/QuestionEditor';
import SupportTextForm from '../components/SupportTextForm';
import QuizVideoSuggestions from '../components/QuizVideoSuggestions';
import AiTextPanel from '../components/AiTextPanel';
import AiProviderSelector from '../components/AiProviderSelector';
import { loadSettings, saveQuizzes, loadQuizzes } from '../lib/utils/storage';
import {
  createQuiz as createQuizApi,
  updateQuiz as updateQuizApi,
  createQuestion as createQuestionApi,
  updateQuestion as updateQuestionApi,
  deleteQuestion as deleteQuestionApi,
  getQuizQuestions,
} from '../lib/api';

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

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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

const Create: React.FC = () => {
  const navigate = useNavigate();
  const { quizzes, editQuiz, loadQuizzes: syncQuizStore } = useQuiz();
  const { user } = useAuth();
  
  // Get user settings
  const [appSettings, setAppSettings] = useLocalStorage<AppSettings>('quiz-app-settings', {
    textProvider: 'pollinations',
    imageProvider: 'pollinations',
    updatedAt: Date.now()
  });

  // Check if user is a student and redirect them
  useEffect(() => {
    if (user && user.role === 'STUDENT') {
      navigate('/');
      return;
    }
  }, [user, navigate]);
  
  // Sync settings with storage - run only once
  useEffect(() => {
    const currentSettings = loadSettings();
    setAppSettings(currentSettings);
  }, []);
  
  const [quizData, setQuizData] = useState<Partial<Quiz>>({
    title: '',
    subject: '',
    grade: '',
    questions: []
  });
  
  const [isQuizSaved, setIsQuizSaved] = useState(false);
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>(appSettings.textProvider);
  const [isLocallySaved, setIsLocallySaved] = useState(false);
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Load locally saved quizzes on component mount
  useEffect(() => {
    const locallySavedQuizzes = loadQuizzes();
    if (locallySavedQuizzes.length > 0) {
      // Check if any of these quizzes are not already in the global store
      const newQuizzes = locallySavedQuizzes.filter(localQuiz =>
        !quizzes.some(storeQuiz => storeQuiz.id === localQuiz.id)
      );
      
      if (newQuizzes.length > 0) {
        syncQuizStore([...quizzes, ...newQuizzes]);
        showNotification(`${newQuizzes.length} quiz(es) carregado(s) do armazenamento local.`, 'info');
      }
    }
  }, []); // Run only on mount

  // Sync quiz state when currentQuizId changes or when quizzes in store change
  useEffect(() => {
    if (currentQuizId) {
      const quiz = quizzes.find(q => q.id === currentQuizId);
      if (quiz) {
        setQuizData(prev => ({
          ...prev,
          id: quiz.id,
          title: quiz.title,
          subject: quiz.subject,
          grade: quiz.grade,
          questions: quiz.questions,
          supportText: quiz.supportText
        }));
        setIsLocallySaved(quiz.isLocallySaved || false);
      }
    }
  }, [currentQuizId, quizzes]);
  
  // Update selectedProvider when appSettings changes
  useEffect(() => {
    setSelectedProvider(appSettings.textProvider);
  }, [appSettings.textProvider]);

  const handleQuizSave = async (
    data: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt' | 'questions'> & { youtubeVideos?: string[] }
  ) => {
    try {
      const { id } = await createQuizApi({
        title: data.title,
        description: data.subject || '',
        grade: data.grade || '',
        supportText: data.supportText,
        youtubeVideos: data.youtubeVideos,
      });

      setCurrentQuizId(id);
      setIsLocallySaved(false);

      // Validate quiz ID before using it for localStorage
      if (id && id !== 'undefined' && id !== 'null' && id.trim() !== '') {
        console.log('[Create] Using quiz ID for localStorage:', id);
        if (typeof window !== 'undefined' && data.subject && data.subject.trim()) {
          try {
            window.localStorage.setItem(`ai_quiz_subject_${id}`, data.subject.trim());
          } catch (error) {
            console.warn('Não foi possível guardar a disciplina do quiz no localStorage para AI:', error);
          }
        }
      } else {
        console.error('[Create] Invalid quiz ID for localStorage:', id);
      }

      const normalizedSubject = data.subject || '';
      const normalizedGrade = data.grade || '';

      setQuizData({
        ...data,
        id,
        isPublished: false,
        questions: [],
      });

      const placeholderQuiz: Quiz = {
        id,
        title: data.title,
        subject: normalizedSubject,
        grade: normalizedGrade,
        isPublished: false,
        questions: [],
        supportText: data.supportText,
        youtubeVideos: data.youtubeVideos ?? [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isLocallySaved: false,
      };

      const updatedStoreQuizzes = (() => {
        const existingIndex = quizzes.findIndex(q => q.id === id);
        if (existingIndex >= 0) {
          const clone = [...quizzes];
          clone[existingIndex] = {
            ...clone[existingIndex],
            ...placeholderQuiz,
          };
          return clone;
        }
        return [...quizzes, placeholderQuiz];
      })();

      syncQuizStore(updatedStoreQuizzes);

      setIsQuizSaved(true);
      setCurrentStep(2);
      showNotification('Quiz criado com sucesso! Agora adicione perguntas.', 'success');
    } catch (error: any) {
      console.error('[API] Erro ao criar quiz:', error);
      
      // Fallback to localStorage when API fails
      const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCurrentQuizId(localId);
      setIsLocallySaved(true);
      
      const normalizedSubject = data.subject || '';
      const normalizedGrade = data.grade || '';

      setQuizData({
        ...data,
        id: localId,
        isPublished: false,
        questions: [],
      });

      const localQuiz: Quiz = {
        id: localId,
        title: data.title,
        subject: normalizedSubject,
        grade: normalizedGrade,
        isPublished: false,
        questions: [],
        supportText: data.supportText,
        youtubeVideos: data.youtubeVideos ?? [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isLocallySaved: true,
      };

      // Save to localStorage
      const updatedQuizzes = [...quizzes, localQuiz];
      const saveSuccess = saveQuizzes(updatedQuizzes);
      
      if (saveSuccess) {
        syncQuizStore(updatedQuizzes);
        setIsQuizSaved(true);
        setCurrentStep(2);
        showNotification('Quiz guardado localmente! Será sincronizado quando a API estiver disponível.', 'warning');
      } else {
        showNotification('Não foi possível guardar o quiz localmente. Tente novamente.', 'error');
      }
    }
  };

  const handleAddQuestion = async (questionData: Omit<Question, 'id'>) => {
    if (!currentQuizId) {
      showNotification('Guarde o quiz antes de adicionar perguntas.', 'error');
      return;
    }

    try {
      // If quiz is local, add question to local state only
      if (isLocallySaved || currentQuizId.startsWith('local_')) {
        const newQuestion: Question = {
          id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...questionData,
        };

        // Update local state
        setQuizData(prev => ({
          ...prev,
          questions: [...(prev.questions || []), newQuestion],
        }));

        // Update global store
        const currentQuiz = quizzes.find(q => q.id === currentQuizId);
        if (currentQuiz) {
          const updatedQuestions = [...(currentQuiz.questions || []), newQuestion];
          editQuiz(currentQuizId, { questions: updatedQuestions });

          // Save to localStorage
          const updatedQuizzes = quizzes.map(q =>
            q.id === currentQuizId
              ? { ...q, questions: updatedQuestions }
              : q
          );
          saveQuizzes(updatedQuizzes);
        }

        showNotification('Pergunta adicionada com sucesso!', 'success');
      } else {
        // Quiz is in backend, use API
        await createQuestionApi(currentQuizId, questionData);
        const refreshed = await getQuizQuestions(currentQuizId);

        // Update both local state and global store
        setQuizData(prev => ({
          ...prev,
          questions: refreshed,
        }));

        // Also update the quiz in the global store to keep it in sync
        const currentQuiz = quizzes.find(q => q.id === currentQuizId);
        if (currentQuiz) {
          editQuiz(currentQuizId, { questions: refreshed });
        }

        showNotification('Pergunta adicionada com sucesso!', 'success');
      }
    } catch (error: any) {
      console.error('[API] Erro ao adicionar pergunta:', error);
      showNotification(
        error?.message || 'Não foi possível adicionar a pergunta. Tente novamente.',
        'error'
      );
    }
  };

  const handleEditQuestion = async (questionId: string, questionData: Omit<Question, 'id'>) => {
    if (!currentQuizId) return;

    try {
      // If quiz is local, update question in local state only
      if (isLocallySaved || currentQuizId.startsWith('local_')) {
        const updatedQuestions = (quizData.questions || []).map(q =>
          q.id === questionId ? { ...q, ...questionData } : q
        );

        // Update local state
        setQuizData(prev => ({
          ...prev,
          questions: updatedQuestions,
        }));

        // Update global store
        const currentQuiz = quizzes.find(q => q.id === currentQuizId);
        if (currentQuiz) {
          editQuiz(currentQuizId, { questions: updatedQuestions });

          // Save to localStorage
          const updatedQuizzes = quizzes.map(q =>
            q.id === currentQuizId
              ? { ...q, questions: updatedQuestions }
              : q
          );
          saveQuizzes(updatedQuizzes);
        }

        showNotification('Pergunta atualizada com sucesso!', 'success');
      } else {
        // Quiz is in backend, use API
        await updateQuestionApi(currentQuizId, questionId, questionData);
        const refreshed = await getQuizQuestions(currentQuizId);
        setQuizData(prev => ({
          ...prev,
          questions: refreshed,
        }));
        showNotification('Pergunta atualizada com sucesso!', 'success');
      }
    } catch (error: any) {
      console.error('[API] Erro ao atualizar pergunta:', error);
      showNotification(
        error?.message || 'Não foi possível atualizar a pergunta.',
        'error'
      );
    }
  };

  const handleRemoveQuestion = async (questionId: string) => {
    if (!currentQuizId) return;

    try {
      // If quiz is local, remove question from local state only
      if (isLocallySaved || currentQuizId.startsWith('local_')) {
        const updatedQuestions = (quizData.questions || []).filter(q => q.id !== questionId);

        // Update local state
        setQuizData(prev => ({
          ...prev,
          questions: updatedQuestions,
        }));

        // Update global store
        const currentQuiz = quizzes.find(q => q.id === currentQuizId);
        if (currentQuiz) {
          editQuiz(currentQuizId, { questions: updatedQuestions });

          // Save to localStorage
          const updatedQuizzes = quizzes.map(q =>
            q.id === currentQuizId
              ? { ...q, questions: updatedQuestions }
              : q
          );
          saveQuizzes(updatedQuizzes);
        }

        showNotification('Pergunta removida com sucesso!', 'info');
      } else {
        // Quiz is in backend, use API
        await deleteQuestionApi(currentQuizId, questionId);
        const refreshed = await getQuizQuestions(currentQuizId);
        setQuizData(prev => ({
          ...prev,
          questions: refreshed,
        }));
        showNotification('Pergunta removida com sucesso!', 'info');
      }
    } catch (error: any) {
      console.error('[API] Erro ao remover pergunta:', error);
      showNotification(
        error?.message || 'Não foi possível remover a pergunta.',
        'error'
      );
    }
  };

  const handleFinish = async () => {
    if (!currentQuizId) {
      showNotification('Por favor, guarde o quiz antes de concluir.', 'warning');
      return;
    }

    if (!quizData.questions || quizData.questions.length === 0) {
      const confirmLeave = window.confirm('O quiz não tem perguntas. Deseja concluir mesmo assim?');
      if (!confirmLeave) return;
    }

    navigate('/');
  };

  const handleNewQuiz = () => {
    setQuizData({
      title: '',
      subject: '',
      grade: '',
      questions: []
    });
    setIsQuizSaved(false);
    setCurrentQuizId(null);
    setIsLocallySaved(false);
    setCurrentStep(1);
  };

  // Function to sync locally saved quizzes to the server
  const handleSyncToServer = async () => {
    if (!currentQuizId || !isLocallySaved) {
      showNotification('Este quiz já está sincronizado com o servidor.', 'info');
      return;
    }

    const currentQuiz = quizzes.find(q => q.id === currentQuizId);
    if (!currentQuiz) {
      showNotification('Quiz não encontrado.', 'error');
      return;
    }

    try {
      // Create the quiz on the server
      const { id: serverId } = await createQuizApi({
        title: currentQuiz.title,
        description: currentQuiz.subject || '',
        grade: currentQuiz.grade || '',
      });

      // Update the quiz with the server ID
      const updatedQuiz: Quiz = {
        ...currentQuiz,
        id: serverId,
        isLocallySaved: false,
        updatedAt: Date.now(),
      };

      // Update the store
      const updatedQuizzes = quizzes.map(q =>
        q.id === currentQuizId ? updatedQuiz : q
      );
      syncQuizStore(updatedQuizzes);
      
      // Save to localStorage to update the flag
      saveQuizzes(updatedQuizzes);

      // Update current state
      setCurrentQuizId(serverId);
      setIsLocallySaved(false);
      setQuizData(prev => ({ ...prev, id: serverId }));

      showNotification('Quiz sincronizado com sucesso!', 'success');
    } catch (error: any) {
      console.error('[API] Erro ao sincronizar quiz:', error);
      showNotification(
        error?.message || 'Não foi possível sincronizar o quiz. Tente novamente mais tarde.',
        'error'
      );
    }
  };

  const handleAiQuestionsGenerated = (questions: Question[]) => {
    if (!currentQuizId || !isQuizSaved) {
      showNotification('Guarde as informações do quiz antes de adicionar perguntas geradas.', 'warning');
      return;
    }

    const currentQuiz = quizzes.find(q => q.id === currentQuizId);
    if (!currentQuiz) {
      showNotification('Não encontrámos o quiz selecionado. Recarregue a página e tente novamente.', 'error');
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
      // Normalize all questions first
      const normalizedQuestions: Question[] = questions.map((question, questionIndex) => {
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

        return {
          id: `temp-${Date.now()}-${questionIndex}`,
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
        } as Question;
      });

      // Add questions to local state immediately
      setQuizData(prev => ({
        ...prev,
        questions: [...(prev.questions || []), ...normalizedQuestions],
      }));

      // Update global store
      const currentQuiz = quizzes.find(q => q.id === currentQuizId);
      if (currentQuiz) {
        editQuiz(currentQuizId, {
          questions: [...(currentQuiz.questions || []), ...normalizedQuestions]
        });
      }

      // If quiz is not local, persist to backend
      if (!isLocallySaved && currentQuizId && !currentQuizId.startsWith('local_')) {
        normalizedQuestions.forEach((question) => {
          const { id: _discarded, ...questionWithoutId } = question;

          void (async () => {
            try {
              await createQuestionApi(currentQuizId, questionWithoutId);

              // After all questions are persisted, refresh from API
              const refreshed = await getQuizQuestions(currentQuizId);
              setQuizData(prev => ({
                ...prev,
                questions: refreshed,
              }));

              // Also update the quiz in the global store
              const currentQuiz = quizzes.find(q => q.id === currentQuizId);
              if (currentQuiz) {
                editQuiz(currentQuizId, { questions: refreshed });
              }
            } catch (error) {
              console.error('[API] Erro ao persistir pergunta gerada por IA:', error);
            }
          })();
        });
      } else {
        // For local quizzes, save to localStorage
        const updatedQuizzes = quizzes.map(q =>
          q.id === currentQuizId
            ? { ...q, questions: [...(q.questions || []), ...normalizedQuestions] }
            : q
        );
        saveQuizzes(updatedQuizzes);
      }

      setShowAiPanel(false);
      showNotification(`${questions.length} perguntas adicionadas com sucesso!`, 'success');
    } catch (error) {
      console.error('Erro ao adicionar perguntas geradas:', error);
      showNotification('Não foi possível adicionar as perguntas geradas. Tente novamente.', 'error');
    }
  };

  // Simple notification function
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    // Create a simple notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full notification-enter`;
    
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

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    // Allow navigation to completed steps or the next step
    if (step <= currentStep || (step === 1 && !isQuizSaved) || (step === 2 && isQuizSaved)) {
      setCurrentStep(step);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 page-transition-enter-active mobile-safe-top mobile-safe-bottom">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200 slide-in-top-fade mobile-element-spacing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mobile-stack">
            <div className="flex items-center space-x-4 mobile-element-spacing">
              <button
                onClick={() => navigate('/')}
                className="btn-hover-bounce mobile-optimized-button mobile-pressable p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 mobile-focus-visible"
                title="Voltar para a página inicial"
              >
                <ChevronLeftIcon />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200 mobile-heading">Criar Quiz</h1>
            </div>
            <div className="flex items-center space-x-3 mobile-stack mobile-element-spacing">
              <button
                onClick={() => navigate('/settings')}
                className="btn-hover-bounce btn-hover-ripple mobile-optimized-button mobile-pressable px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-300 hover:scale-105 hover:shadow-md dark:text-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 mobile-focus-visible"
                title="Configurar chaves de API"
              >
                Definições
              </button>
              {isQuizSaved && (
                <>
                  {isLocallySaved && (
                    <button
                      onClick={handleSyncToServer}
                      className="btn-hover-bounce btn-hover-ripple mobile-optimized-button mobile-pressable px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:scale-105 mobile-focus-visible"
                      title="Sincronizar quiz com o servidor"
                    >
                      Sincronizar
                    </button>
                  )}
                  <button
                    onClick={handleNewQuiz}
                    className="btn-hover-bounce btn-hover-ripple mobile-optimized-button mobile-pressable px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-300 hover:scale-105 hover:shadow-md dark:text-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 mobile-focus-visible"
                  >
                    Novo Quiz
                  </button>
                  <button
                    onClick={handleFinish}
                    className="btn-hover-bounce btn-hover-ripple mobile-optimized-button mobile-pressable px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:scale-105 mobile-focus-visible"
                  >
                    Concluir
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200 mobile-element-spacing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mobile-scrollable">
            <div className="flex items-center space-x-2 sm:space-x-4 mobile-element-spacing">
              {/* Step 1 */}
              <button
                onClick={() => handleStepClick(1)}
                className={`flex items-center ${currentStep === 1 ? 'text-blue-600 dark:text-blue-400' : isQuizSaved ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'} transition-colors`}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${currentStep === 1 ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-400' : isQuizSaved ? 'border-green-600 bg-green-600 text-white dark:border-green-400 dark:bg-green-400' : 'border-gray-300 dark:border-gray-600'}`}>
                  {isQuizSaved ? <CheckIcon /> : <span className="text-sm">1</span>}
                </div>
                <span className="ml-2 text-sm font-medium hidden sm:inline">Informações Básicas</span>
              </button>

              {/* Connector */}
              <div className={`hidden sm:block w-8 h-0.5 ${isQuizSaved ? 'bg-green-600 dark:bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`}></div>

              {/* Step 2 */}
              <button
                onClick={() => handleStepClick(2)}
                className={`flex items-center ${currentStep === 2 ? 'text-blue-600 dark:text-blue-400' : !isQuizSaved ? 'text-gray-400 dark:text-gray-500' : quizData.questions && quizData.questions.length > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'} transition-colors`}
                disabled={!isQuizSaved}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${currentStep === 2 ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-400' : !isQuizSaved ? 'border-gray-300 dark:border-gray-600' : quizData.questions && quizData.questions.length > 0 ? 'border-green-600 bg-green-600 text-white dark:border-green-400 dark:bg-green-400' : 'border-gray-400 bg-gray-100 text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                  {quizData.questions && quizData.questions.length > 0 ? <CheckIcon /> : <span className="text-sm">2</span>}
                </div>
                <span className="ml-2 text-sm font-medium hidden sm:inline">Perguntas</span>
              </button>

              {/* Connector */}
              <div className={`hidden sm:block w-8 h-0.5 ${quizData.questions && quizData.questions.length > 0 ? 'bg-green-600 dark:bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`}></div>

              {/* Step 3 */}
              <button
                onClick={() => handleStepClick(3)}
                className={`flex items-center ${currentStep === 3 ? 'text-blue-600 dark:text-blue-400' : !isQuizSaved || !quizData.questions || quizData.questions.length === 0 ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'} transition-colors`}
                disabled={!isQuizSaved || !quizData.questions || quizData.questions.length === 0}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${currentStep === 3 ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-400' : !isQuizSaved || !quizData.questions || quizData.questions.length === 0 ? 'border-gray-300 dark:border-gray-600' : 'border-gray-400 bg-gray-100 text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                  <span className="text-sm">3</span>
                </div>
                <span className="ml-2 text-sm font-medium hidden sm:inline">Revisão</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mobile-section-spacing">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="max-w-2xl mx-auto slide-in-left-fade mobile-optimized-card">
            <div className="card-hover-lift bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden dark:bg-gray-800 dark:border-gray-700 transition-all duration-300 hover:shadow-lg mobile-gpu-accelerated mobile-will-change-transform">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-gray-700 transition-colors duration-200 mobile-element-spacing">
                <div className="flex items-center space-x-3 mobile-stack">
                  <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30 transition-colors duration-200">
                    <DocumentTextIcon />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-200 mobile-subheading">Informações Básicas do Quiz</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200 mobile-caption">Preencha os detalhes fundamentais do seu quiz</p>
                  </div>
                </div>
              </div>
              <div className="p-6 mobile-element-spacing">
                <QuizForm
                  initialData={quizData}
                  onSubmit={handleQuizSave}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Questions */}
        {currentStep === 2 && (
          <div className="space-y-6 mobile-element-spacing">
            {/* Quiz Info Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden slide-in-bottom-fade mobile-optimized-card mobile-gpu-accelerated mobile-will-change-transform">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 mobile-element-spacing">
                <div className="flex items-center justify-between mobile-stack">
                  <div className="flex items-center space-x-3 mobile-stack">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <QuestionMarkCircleIcon />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mobile-subheading">Adicionar Perguntas</h2>
                      <p className="text-sm text-gray-600 mobile-caption">Crie perguntas manualmente ou use a nossa IA para gerar automaticamente</p>
                    </div>
                  </div>
                  <div className="text-right mobile-element-spacing">
                    <p className="text-sm text-gray-500 mobile-caption">Quiz: {quizData.title}</p>
                    <p className="text-xs text-gray-400 mobile-caption">{quizData.questions?.length || 0} perguntas</p>
                    {isLocallySaved && (
                      <div className="flex items-center justify-end mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
                          </svg>
                          Guardado localmente
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6 mobile-element-spacing">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mobile-grid-single md:grid-cols-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500 mobile-caption">Título:</span>
                    <p className="text-base font-medium text-gray-900 mobile-body-text">{quizData.title}</p>
                  </div>
                  {quizData.subject && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 mobile-caption">Disciplina:</span>
                      <p className="text-base font-medium text-gray-900 mobile-body-text">{quizData.subject}</p>
                    </div>
                  )}
                  {quizData.grade && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 mobile-caption">Nível/Ano:</span>
                      <p className="text-base font-medium text-gray-900 mobile-body-text">{quizData.grade}</p>
                    </div>
                  )}
                </div>

                {/* AI Assistant Button */}
                <div className="mb-6 mobile-element-spacing">
                  <button
                    onClick={() => {
                      if (!isQuizSaved) {
                        showNotification('Por favor, salve as informações do quiz antes de gerar perguntas.', 'warning');
                        return;
                      }
                      setShowAiPanel(!showAiPanel);
                    }}
                    className="btn-hover-bounce btn-hover-ripple mobile-optimized-button mobile-pressable inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:scale-105 mobile-focus-visible"
                  >
                    <SparklesIcon />
                    <span className="ml-2">{showAiPanel ? 'Ocultar' : 'Gerar Perguntas com IA'}</span>
                  </button>
                </div>

                {/* AI Panel */}
                {showAiPanel && (
                  <div className="space-y-4 mb-6 slide-down mobile-element-spacing">
                    <AiProviderSelector
                      label="Provedor de IA para Geração de Perguntas"
                      value={selectedProvider}
                      onChange={setSelectedProvider}
                    />
                   
                    {/* API Key Configuration Alert */}
                    {((selectedProvider === 'huggingface' && !appSettings.huggingFaceToken) ||
                      (selectedProvider === 'mistral' && !appSettings.mistralToken)) && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mobile-optimized-card">
                          <div className="flex mobile-stack">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3 mobile-element-spacing">
                              <h3 className="text-sm font-medium text-yellow-800 mobile-caption">
                                {selectedProvider === 'huggingface' ? 'Token do Hugging Face necessário' : 'Chave de API do Mistral necessária'}
                              </h3>
                              <div className="mt-2 text-sm text-yellow-700 mobile-caption">
                                <p>
                                  Precisa configurar uma {selectedProvider === 'huggingface' ? 'token do Hugging Face' : 'chave de API do Mistral'} para usar este provedor.
                                </p>
                                <div className="mt-3 flex space-x-3 mobile-stack">
                                  <button
                                    onClick={() => navigate('/settings')}
                                    className="mobile-optimized-button mobile-pressable px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 mobile-focus-visible"
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
                                    className="mobile-optimized-button mobile-pressable px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 mobile-focus-visible"
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
                      quizId={currentQuizId || undefined}
                      imageProvider={appSettings.imageProvider}
                      huggingFaceImageToken={appSettings.huggingFaceToken}
                      mistralImageToken={appSettings.mistralToken}
                      disciplinaFromQuiz={quizData.subject || ''}
                    />
                  </div>
                )}

                {/* Support Text Form - Only show after quiz is saved and has questions */}
                {isQuizSaved && quizData.questions && quizData.questions.length > 0 && (
                  <SupportTextForm
                    quiz={{
                      id: currentQuizId || '',
                      title: quizData.title || '',
                      subject: quizData.subject || '',
                      grade: quizData.grade || '',
                      supportText: quizData.supportText || '',
                      questions: quizData.questions,
                      createdAt: Date.now(),
                      updatedAt: Date.now()
                    }}
                    questions={quizData.questions}
                    onUpdateSupportText={async (supportText) => {
                      setQuizData(prev => ({ ...prev, supportText }));
                      if (currentQuizId) {
                        const currentQuiz = quizzes.find(q => q.id === currentQuizId);
                        if (currentQuiz) {
                          // Atualiza o store local
                          editQuiz(currentQuizId, { ...currentQuiz, supportText });

                          // Atualiza via API
                          try {
                            await updateQuizApi({
                              id: currentQuizId,
                              supportText: supportText,
                            });
                            console.log('[Create] Support text saved to API');
                          } catch (error) {
                            console.error('[Create] Error saving support text to API:', error);
                          }
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
                  questions={quizData.questions || []}
                  onAddQuestion={handleAddQuestion}
                  onEditQuestion={handleEditQuestion}
                  onRemoveQuestion={handleRemoveQuestion}
                />

                {/* YouTube Video Suggestions - only after we have questions (contextual) */}
                {isQuizSaved && quizData.questions && quizData.questions.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                      Vídeos de apoio do YouTube
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Gera pesquisas contextualizadas, use o botão Abrir para validar cada resultado e clique em Adicionar para ligar o vídeo diretamente ao quiz.
                    </p>
                    <QuizVideoSuggestions
                      quizContext={{
                        title: quizData.title || '',
                        subject: quizData.subject,
                        grade: quizData.grade,
                        introText: quizData.supportText,
                        questions: (quizData.questions || []).map((q) => ({
                          type: q.type,
                          prompt: q.prompt,
                          tags: [],
                        })),
                      }}
                      value={
                        quizzes.find(q => q.id === currentQuizId)?.youtubeVideos || []
                      }
                      onChange={async (videos) => {
                        if (!currentQuizId) return;
                        const currentQuiz = quizzes.find(q => q.id === currentQuizId);
                        if (!currentQuiz) return;

                        // Atualiza o estado local imediatamente
                        editQuiz(currentQuizId, {
                          ...currentQuiz,
                          youtubeVideos: videos,
                        });

                        // Salva automaticamente na API
                        try {
                          const normalizedVideos = videos
                            .map((u) => (u || '').trim())
                            .filter((u) => u.length > 0)

                          await updateQuizApi({
                            id: currentQuizId,
                            youtubeVideos: normalizedVideos,
                          })

                          console.log('[Create] Vídeos salvos automaticamente na API')
                        } catch (error) {
                          console.error('[Create] Erro ao salvar vídeos na API:', error)
                        }
                      }}
                    />
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 3 && (
          <div className="max-w-4xl mx-auto slide-in-right-fade">
            <div className="card-hover-lift bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckIcon />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Revisão do Quiz</h2>
                    <p className="text-sm text-gray-600">Revise todas as informações antes de finalizar</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* Quiz Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Quiz</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Título:</span>
                        <p className="text-base font-medium text-gray-900">{quizData.title}</p>
                      </div>
                      {quizData.subject && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Disciplina:</span>
                          <p className="text-base font-medium text-gray-900">{quizData.subject}</p>
                        </div>
                      )}
                      {quizData.grade && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Nível/Ano:</span>
                          <p className="text-base font-medium text-gray-900">{quizData.grade}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Questions Summary */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Perguntas ({quizData.questions?.length || 0})</h3>
                  <div className="space-y-3">
                    {quizData.questions?.map((question, index) => (
                      <div key={question.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{question.prompt}</p>
                            <p className="text-xs text-gray-500 mt-1">Tipo: {question.type}</p>
                            {question.type === 'mcq' && question.choices && (
                              <div className="mt-2 space-y-1">
                                {question.choices.map((choice, choiceIndex) => (
                                  <div key={choiceIndex} className={`text-xs ${choice.correct ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                                    {choice.text} {choice.correct && '✓'}
                                  </div>
                                ))}
                              </div>
                            )}
                            {question.type === 'truefalse' && (
                              <div className="mt-1 text-xs text-gray-600">
                                Resposta: {question.answer === 'true' ? 'Verdadeiro' : 'Falso'}
                              </div>
                            )}
                            {['short', 'gapfill', 'essay'].includes(question.type) && question.answer && (
                              <div className="mt-1 text-xs text-gray-600">
                                Resposta: {question.answer}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Voltar para Perguntas
                  </button>
                  <div className="space-x-3">
                    <button
                      onClick={handleNewQuiz}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-300 hover:scale-105 hover:shadow-md"
                    >
                      Criar Novo Quiz
                    </button>
                    <button
                      onClick={handleFinish}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:scale-105"
                    >
                      Finalizar Quiz
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep !== 3 && (
          <div className="flex justify-between mt-8 mobile-stack mobile-element-spacing">
            <button
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className={`mobile-optimized-button mobile-pressable px-4 py-2 rounded-lg transition-all duration-300 ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:scale-105 hover:shadow-md mobile-focus-visible'
              }`}
            >
              <div className="flex items-center">
                <ChevronLeftIcon />
                <span className="ml-2">Anterior</span>
              </div>
            </button>
           
            {currentStep === 1 && (
              <div className="text-sm text-gray-500 mobile-caption">
                Preencha as informações básicas para continuar
              </div>
            )}
           
            {currentStep === 2 && (
              <button
                onClick={handleNextStep}
                disabled={!quizData.questions || quizData.questions.length === 0}
                className={`mobile-optimized-button mobile-pressable px-4 py-2 rounded-lg transition-all duration-300 ${
                  !quizData.questions || quizData.questions.length === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 hover:shadow-md mobile-focus-visible'
                }`}
              >
                <div className="flex items-center">
                  <span className="mr-2">Revisar</span>
                  <ChevronRightIcon />
                </div>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Create;
