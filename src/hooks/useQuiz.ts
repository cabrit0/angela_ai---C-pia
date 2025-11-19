import { useQuizContext } from '../lib/store'
import type { Quiz, Question, Choice } from '../types'

// Hook customizado que fornece acesso ao estado e ações do quiz
export const useQuiz = () => {
  const context = useQuizContext()
  
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider')
  }

  const { state, dispatch, ...actions } = context

  // Ações simplificadas para manipular quizzes
  const quizActions = {
    // Regista um quiz já existente (carregado da API) no estado local
    createQuiz: (quizData: Quiz | Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>): string => {
      if ('id' in quizData) {
        actions.addQuiz(quizData)
        return quizData.id
      }

      const newQuiz: Quiz = {
        ...quizData,
        id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      actions.addQuiz(newQuiz)
      return newQuiz.id
    },

    // Atualizar um quiz existente
    editQuiz: (id: string, updates: Partial<Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>>) => {
      actions.updateQuiz(id, updates)
    },

    // Remover um quiz
    removeQuiz: (id: string) => {
      actions.deleteQuiz(id)
    },

    // Adicionar uma pergunta a um quiz
    createQuestion: (quizId: string, questionData: Omit<Question, 'id'>) => {
      console.log('=== HOOK: createQuestion called ===');
      console.log('Quiz ID:', quizId);
      console.log('Question data:', questionData);
      actions.addQuestion(quizId, questionData);
    },

    // Atualizar uma pergunta existente
    editQuestion: (quizId: string, questionId: string, updates: Partial<Omit<Question, 'id'>>) => {
      actions.updateQuestion(quizId, questionId, updates)
    },

    // Remover uma pergunta
    removeQuestion: (quizId: string, questionId: string) => {
      actions.deleteQuestion(quizId, questionId)
    },

    // Adicionar uma opção de resposta
    createChoice: (quizId: string, questionId: string, choiceData: Omit<Choice, 'id'>) => {
      actions.addChoice(quizId, questionId, choiceData)
    },

    // Atualizar uma opção de resposta
    editChoice: (quizId: string, questionId: string, choiceId: string, updates: Partial<Omit<Choice, 'id'>>) => {
      actions.updateChoice(quizId, questionId, choiceId, updates)
    },

    // Remover uma opção de resposta
    removeChoice: (quizId: string, questionId: string, choiceId: string) => {
      actions.deleteChoice(quizId, questionId, choiceId)
    },

    // Carregar quizzes do localStorage
    loadQuizzes: (quizzes: Quiz[]) => {
      actions.loadQuizzes(quizzes)
    },

    // Limpar todos os quizzes
    clearAllQuizzes: () => {
      actions.clearAll()
    }
  }

  // Funções auxiliares para obter dados específicos
  const getters = {
    // Obter todos os quizzes
    getAllQuizzes: () => state.quizzes,

    // Obter um quiz por ID
    getQuizById: (id: string): Quiz | undefined => {
      return state.quizzes.find(quiz => quiz.id === id)
    },

    // Obter quizzes por disciplina
    getQuizzesBySubject: (subject: string): Quiz[] => {
      return state.quizzes.filter(quiz => quiz.subject === subject)
    },

    // Obter quizzes por nível/ano
    getQuizzesByGrade: (grade: string): Quiz[] => {
      return state.quizzes.filter(quiz => quiz.grade === grade)
    },

    // Obter número total de quizzes
    getQuizzesCount: (): number => {
      return state.quizzes.length
    },

    // Obter número total de perguntas em todos os quizzes
    getTotalQuestionsCount: (): number => {
      return state.quizzes.reduce((total, quiz) => total + quiz.questions.length, 0)
    },

    // Obter um quiz por título
    getQuizByTitle: (title: string): Quiz | undefined => {
      return state.quizzes.find(quiz => quiz.title === title)
    },

    // Verificar se um quiz existe
    quizExists: (id: string): boolean => {
      return state.quizzes.some(quiz => quiz.id === id)
    }
  }

  return {
    // Estado
    quizzes: state.quizzes,
    
    // Ações
    ...quizActions,
    
    // Getters
    ...getters,
    
    // Acesso direto ao dispatch (se necessário)
    dispatch
  }
}

// Exportar tipos úteis
export type UseQuizReturn = ReturnType<typeof useQuiz>
