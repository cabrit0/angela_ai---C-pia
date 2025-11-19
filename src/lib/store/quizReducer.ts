import type { Quiz, Question, Choice } from '../../types'

// Tipos de ações para manipular quizzes
export type QuizAction =
  | { type: 'ADD_QUIZ'; payload: Quiz }
  | { type: 'UPDATE_QUIZ'; payload: { id: string; updates: Partial<Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>> } }
  | { type: 'DELETE_QUIZ'; payload: { id: string } }
  | { type: 'ADD_QUESTION'; payload: { quizId: string; question: Omit<Question, 'id'> } }
  | { type: 'UPDATE_QUESTION'; payload: { quizId: string; questionId: string; updates: Partial<Omit<Question, 'id'>> } }
  | { type: 'DELETE_QUESTION'; payload: { quizId: string; questionId: string } }
  | { type: 'ADD_CHOICE'; payload: { quizId: string; questionId: string; choice: Omit<Choice, 'id'> } }
  | { type: 'UPDATE_CHOICE'; payload: { quizId: string; questionId: string; choiceId: string; updates: Partial<Omit<Choice, 'id'>> } }
  | { type: 'DELETE_CHOICE'; payload: { quizId: string; questionId: string; choiceId: string } }
  | { type: 'LOAD_QUIZZES'; payload: Quiz[] }
  | { type: 'LOAD_LOCAL_QUIZZES'; payload: Quiz[] }
  | { type: 'MARK_QUIZ_LOCAL'; payload: { id: string; isLocal: boolean } }
  | { type: 'CLEAR_ALL' }

// Estado inicial
export interface QuizState {
  quizzes: Quiz[]
}

export const initialQuizState: QuizState = {
  quizzes: []
}

// Funções auxiliares para gerar IDs únicos
const generateId = (): string => Math.random().toString(36).substring(2, 15)
const getCurrentTimestamp = (): number => Date.now()

// Implementação do reducer
export const quizReducer = (state: QuizState, action: QuizAction): QuizState => {
  switch (action.type) {
    case 'ADD_QUIZ': {
      // The quiz is already fully formed in the store/index.ts
      const newQuiz = {
        ...action.payload,
        // Mark as locally saved if not already marked
        isLocallySaved: action.payload.isLocallySaved !== undefined ? action.payload.isLocallySaved : true
      };
      console.log('=== REDUCER: ADD_QUIZ action ===');
      console.log('New quiz created:', newQuiz);
      console.log('New quiz ID:', newQuiz.id);
      console.log('Is locally saved:', newQuiz.isLocallySaved);
      return {
        ...state,
        quizzes: [...state.quizzes, newQuiz]
      }
    }

    case 'UPDATE_QUIZ': {
      const { id, updates } = action.payload
      return {
        ...state,
        quizzes: state.quizzes.map(quiz =>
          quiz.id === id
            ? { ...quiz, ...updates, updatedAt: getCurrentTimestamp() }
            : quiz
        )
      }
    }

    case 'DELETE_QUIZ': {
      const { id } = action.payload
      return {
        ...state,
        quizzes: state.quizzes.filter(quiz => quiz.id !== id)
      }
    }

    case 'ADD_QUESTION': {
      const { quizId, question } = action.payload
      console.log('=== REDUCER: ADD_QUESTION action ===');
      console.log('Quiz ID:', quizId);
      console.log('Question:', question);
      console.log('Current quizzes count:', state.quizzes.length);
      
      const targetQuiz = state.quizzes.find(q => q.id === quizId);
      console.log('Target quiz found:', !!targetQuiz);
      if (targetQuiz) {
        console.log('Target quiz current questions count:', targetQuiz.questions.length);
      }
      
      return {
        ...state,
        quizzes: state.quizzes.map(quiz => {
          if (quiz.id === quizId) {
            const newQuestion: Question = {
              ...question,
              id: generateId()
            }
            console.log('Creating new question with ID:', newQuestion.id);
            console.log('New question structure:', newQuestion);
            
            const updatedQuiz = {
              ...quiz,
              questions: [...quiz.questions, newQuestion],
              updatedAt: getCurrentTimestamp()
            }
            
            console.log('Updated quiz questions count:', updatedQuiz.questions.length);
            return updatedQuiz;
          }
          return quiz
        })
      }
    }

    case 'UPDATE_QUESTION': {
      const { quizId, questionId, updates } = action.payload
      return {
        ...state,
        quizzes: state.quizzes.map(quiz => {
          if (quiz.id === quizId) {
            return {
              ...quiz,
              questions: quiz.questions.map(question =>
                question.id === questionId
                  ? { ...question, ...updates }
                  : question
              ),
              updatedAt: getCurrentTimestamp()
            }
          }
          return quiz
        })
      }
    }

    case 'DELETE_QUESTION': {
      const { quizId, questionId } = action.payload
      return {
        ...state,
        quizzes: state.quizzes.map(quiz => {
          if (quiz.id === quizId) {
            return {
              ...quiz,
              questions: quiz.questions.filter(question => question.id !== questionId),
              updatedAt: getCurrentTimestamp()
            }
          }
          return quiz
        })
      }
    }

    case 'ADD_CHOICE': {
      const { quizId, questionId, choice } = action.payload
      return {
        ...state,
        quizzes: state.quizzes.map(quiz => {
          if (quiz.id === quizId) {
            return {
              ...quiz,
              questions: quiz.questions.map(question => {
                if (question.id === questionId && question.choices) {
                  const newChoice: Choice = {
                    ...choice,
                    id: generateId()
                  }
                  return {
                    ...question,
                    choices: [...question.choices, newChoice]
                  }
                }
                return question
              }),
              updatedAt: getCurrentTimestamp()
            }
          }
          return quiz
        })
      }
    }

    case 'UPDATE_CHOICE': {
      const { quizId, questionId, choiceId, updates } = action.payload
      return {
        ...state,
        quizzes: state.quizzes.map(quiz => {
          if (quiz.id === quizId) {
            return {
              ...quiz,
              questions: quiz.questions.map(question => {
                if (question.id === questionId && question.choices) {
                  return {
                    ...question,
                    choices: question.choices.map(choice =>
                      choice.id === choiceId
                        ? { ...choice, ...updates }
                        : choice
                    )
                  }
                }
                return question
              }),
              updatedAt: getCurrentTimestamp()
            }
          }
          return quiz
        })
      }
    }

    case 'DELETE_CHOICE': {
      const { quizId, questionId, choiceId } = action.payload
      return {
        ...state,
        quizzes: state.quizzes.map(quiz => {
          if (quiz.id === quizId) {
            return {
              ...quiz,
              questions: quiz.questions.map(question => {
                if (question.id === questionId && question.choices) {
                  return {
                    ...question,
                    choices: question.choices.filter(choice => choice.id !== choiceId)
                  }
                }
                return question
              }),
              updatedAt: getCurrentTimestamp()
            }
          }
          return quiz
        })
      }
    }

    case 'LOAD_QUIZZES': {
      return {
        ...state,
        quizzes: action.payload
      }
    }

    case 'LOAD_LOCAL_QUIZZES': {
      // Mark all loaded quizzes as locally saved
      const localQuizzes = action.payload.map(quiz => ({
        ...quiz,
        isLocallySaved: true
      }))
      return {
        ...state,
        quizzes: localQuizzes
      }
    }

    case 'MARK_QUIZ_LOCAL': {
      const { id, isLocal } = action.payload
      return {
        ...state,
        quizzes: state.quizzes.map(quiz =>
          quiz.id === id
            ? { ...quiz, isLocallySaved: isLocal }
            : quiz
        )
      }
    }

    case 'CLEAR_ALL': {
      return {
        ...state,
        quizzes: []
      }
    }

    default:
      return state
  }
}