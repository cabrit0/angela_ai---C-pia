import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import type { ReactNode, Dispatch } from 'react'
import { quizReducer, initialQuizState } from './quizReducer'
import type { QuizState, QuizAction } from './quizReducer'
import type { Quiz, Question, Choice } from '../../types'
import { saveQuizzes, loadQuizzes as loadQuizzesFromStorage } from '../utils/storage'

// Tipo do contexto
export interface QuizContextType {
  state: QuizState
  dispatch: Dispatch<QuizAction>
  // Ações simplificadas para manipular quizzes
  addQuiz: (quiz: Quiz) => void
  updateQuiz: (id: string, updates: Partial<Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>>) => void
  deleteQuiz: (id: string) => void
  addQuestion: (quizId: string, question: Omit<Question, 'id'>) => void
  updateQuestion: (quizId: string, questionId: string, updates: Partial<Omit<Question, 'id'>>) => void
  deleteQuestion: (quizId: string, questionId: string) => void
  addChoice: (quizId: string, questionId: string, choice: Omit<Choice, 'id'>) => void
  updateChoice: (quizId: string, questionId: string, choiceId: string, updates: Partial<Omit<Choice, 'id'>>) => void
  deleteChoice: (quizId: string, questionId: string, choiceId: string) => void
  loadQuizzes: (quizzes: Quiz[]) => void
  clearAll: () => void
  // localStorage functions
  saveQuizzesToStore: () => boolean
  syncQuizzesWithApi: () => Promise<void>
  isOnline: boolean
}

// Criar o contexto
const QuizContext = createContext<QuizContextType | undefined>(undefined)

// Provider component
export interface QuizProviderProps {
  children: ReactNode
}

export const QuizProvider: React.FC<QuizProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(quizReducer, initialQuizState)

  const [isOnline, setIsOnline] = React.useState(navigator.onLine)

  const refreshFromApi = React.useCallback(async () => {
    try {
      const { httpClient } = await import('../api/httpClient')
      const token = httpClient.getAccessToken?.()

      if (!token) {
        // Try to load from localStorage if no token
        console.log('[STORE] No token found, trying to load from localStorage')
        const localQuizzes = loadQuizzesFromStorage()
        if (localQuizzes.length > 0) {
          dispatch({ type: 'LOAD_LOCAL_QUIZZES', payload: localQuizzes })
        } else {
          dispatch({ type: 'CLEAR_ALL' })
        }
        return
      }

      const { getQuizzes } = await import('../api')
      const remoteQuizzes = await getQuizzes()
      dispatch({ type: 'LOAD_QUIZZES', payload: remoteQuizzes })
      
      // After successfully loading from API, sync with localStorage
      const localQuizzes = loadQuizzesFromStorage()
      if (localQuizzes.length > 0) {
        console.log('[STORE] Syncing localStorage with API data')
        // Merge local and remote quizzes, prioritizing remote versions
        const mergedQuizzes = [...remoteQuizzes]
        
        // Add locally saved quizzes that don't exist on the server
        localQuizzes.forEach(localQuiz => {
          if (!remoteQuizzes.some(remoteQuiz => remoteQuiz.id === localQuiz.id)) {
            mergedQuizzes.push({ ...localQuiz, isLocallySaved: true })
          }
        })
        
        dispatch({ type: 'LOAD_QUIZZES', payload: mergedQuizzes })
        saveQuizzes(mergedQuizzes)
      }
    } catch (error) {
      console.error('[STORE] Falha ao carregar quizzes da API:', error)
      // Try to load from localStorage when API fails
      console.log('[STORE] API failed, trying to load from localStorage')
      const localQuizzes = loadQuizzesFromStorage()
      if (localQuizzes.length > 0) {
        dispatch({ type: 'LOAD_LOCAL_QUIZZES', payload: localQuizzes })
      } else {
        dispatch({ type: 'CLEAR_ALL' })
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      if (!cancelled) {
        await refreshFromApi()
      }
    }

    void init()

    const handler = () => {
      void refreshFromApi()
    }

    window.addEventListener('auth:session-changed', handler)
    return () => {
      cancelled = true
      window.removeEventListener('auth:session-changed', handler)
    }
  }, [refreshFromApi])

  // Ações simplificadas
  const addQuiz = (quiz: Quiz) => {
    // Mark quiz as locally saved if offline
    const quizWithLocalFlag = {
      ...quiz,
      isLocallySaved: !isOnline
    }
    dispatch({ type: 'ADD_QUIZ', payload: quizWithLocalFlag })
    
    // If offline, save to localStorage immediately
    if (!isOnline) {
      setTimeout(() => saveQuizzesToStore(), 0)
    }
  }

  const updateQuiz = (id: string, updates: Partial<Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>>) => {
    dispatch({ type: 'UPDATE_QUIZ', payload: { id, updates } })
  }

  const deleteQuiz = (id: string) => {
    dispatch({ type: 'DELETE_QUIZ', payload: { id } })
  }

  const addQuestion = (quizId: string, question: Omit<Question, 'id'>) => {
    console.log('=== STORE: addQuestion called ===');
    console.log('Quiz ID:', quizId);
    console.log('Question:', question);
    console.log('STORE: Current state quizzes count before dispatch:', state.quizzes.length);
    dispatch({ type: 'ADD_QUESTION', payload: { quizId, question } })
    console.log('=== STORE: addQuestion dispatched ===');
    
    // Note: Removed immediate save to avoid race conditions with auto-save
    // The auto-save useEffect will handle saving the state
  }

  const updateQuestion = (quizId: string, questionId: string, updates: Partial<Omit<Question, 'id'>>) => {
    dispatch({ type: 'UPDATE_QUESTION', payload: { quizId, questionId, updates } })
  }

  const deleteQuestion = (quizId: string, questionId: string) => {
    dispatch({ type: 'DELETE_QUESTION', payload: { quizId, questionId } })
  }

  const addChoice = (quizId: string, questionId: string, choice: Omit<Choice, 'id'>) => {
    dispatch({ type: 'ADD_CHOICE', payload: { quizId, questionId, choice } })
  }

  const updateChoice = (quizId: string, questionId: string, choiceId: string, updates: Partial<Omit<Choice, 'id'>>) => {
    dispatch({ type: 'UPDATE_CHOICE', payload: { quizId, questionId, choiceId, updates } })
  }

  const deleteChoice = (quizId: string, questionId: string, choiceId: string) => {
    dispatch({ type: 'DELETE_CHOICE', payload: { quizId, questionId, choiceId } })
  }

  const loadQuizzes = (quizzes: Quiz[]) => {
    dispatch({ type: 'LOAD_QUIZZES', payload: quizzes })
  }

  const clearAll = () => {
    dispatch({ type: 'CLEAR_ALL' })
  }

  // Save current quizzes to localStorage
  const saveQuizzesToStore = useCallback((): boolean => {
    try {
      console.log('[STORE] Saving quizzes to localStorage:', state.quizzes.length)
      return saveQuizzes(state.quizzes)
    } catch (error) {
      console.error('[STORE] Error saving quizzes to localStorage:', error)
      return false
    }
  }, [state.quizzes])

  // Sync locally saved quizzes with API when online
  const syncQuizzesWithApi = useCallback(async (): Promise<void> => {
    if (!isOnline) {
      console.log('[STORE] Cannot sync: offline')
      return
    }

    try {
      const { httpClient } = await import('../api/httpClient')
      const token = httpClient.getAccessToken?.()

      if (!token) {
        console.log('[STORE] Cannot sync: no authentication token')
        return
      }

      // Get locally saved quizzes
      const localQuizzes = state.quizzes.filter(quiz => quiz.isLocallySaved)
      
      if (localQuizzes.length === 0) {
        console.log('[STORE] No local quizzes to sync')
        return
      }

      console.log(`[STORE] Syncing ${localQuizzes.length} local quizzes with API`)
      
      const { createQuiz, updateQuiz } = await import('../api')
      
      for (const quiz of localQuizzes) {
        try {
          // Create a copy without the isLocallySaved flag and id (will be added separately)
          const { isLocallySaved, id, ...quizData } = quiz
          
          // Try to update first (in case it was created on another device)
          await updateQuiz({ id, ...quizData })
          
          // Mark as synced
          dispatch({ type: 'MARK_QUIZ_LOCAL', payload: { id, isLocal: false } })
          console.log(`[STORE] Synced quiz: ${id}`)
        } catch (updateError) {
          // If update fails, try to create
          try {
            const { isLocallySaved, id, ...quizData } = quiz
            await createQuiz(quizData)
            
            // Mark as synced
            dispatch({ type: 'MARK_QUIZ_LOCAL', payload: { id, isLocal: false } })
            console.log(`[STORE] Created and synced quiz: ${id}`)
          } catch (createError) {
            console.error(`[STORE] Failed to sync quiz ${quiz.id}:`, createError)
          }
        }
      }
      
      // Save the updated state to localStorage
      saveQuizzesToStore()
    } catch (error) {
      console.error('[STORE] Error during sync:', error)
    }
  }, [isOnline, state.quizzes, saveQuizzesToStore])

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('[STORE] Connection restored')
      setIsOnline(true)
      // Try to sync when coming back online
      syncQuizzesWithApi()
    }

    const handleOffline = () => {
      console.log('[STORE] Connection lost')
      setIsOnline(false)
      // Save current state to localStorage when going offline
      saveQuizzesToStore()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [syncQuizzesWithApi, saveQuizzesToStore])

  // Auto-save to localStorage when state changes
  useEffect(() => {
    if (!isOnline) {
      // Only auto-save when offline to avoid unnecessary localStorage operations
      saveQuizzesToStore()
    }
  }, [state.quizzes, isOnline, saveQuizzesToStore])

  const contextValue: QuizContextType = {
    state,
    dispatch,
    addQuiz,
    updateQuiz,
    deleteQuiz,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    addChoice,
    updateChoice,
    deleteChoice,
    loadQuizzes,
    clearAll,
    saveQuizzesToStore,
    syncQuizzesWithApi,
    isOnline
  }

  return React.createElement(
    QuizContext.Provider,
    { value: contextValue },
    children
  )
}

// Hook personalizado para usar o contexto
export const useQuizContext = (): QuizContextType => {
  const context = useContext(QuizContext)
  if (context === undefined) {
    throw new Error('useQuizContext must be used within a QuizProvider')
  }
  return context
}

// Função para criar o contexto e provider (para uso externo se necessário)
export const createQuizContext = () => {
  return {
    QuizContext,
    QuizProvider,
    useQuizContext
  }
}

// Exportar tudo
export { quizReducer, initialQuizState }
export type { QuizState, QuizAction }

