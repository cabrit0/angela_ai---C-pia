import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../lib/auth/AuthContext'
import StudentAttempts from '../pages/StudentAttempts'
import { vi } from 'vitest'

// Mock das funções da API
vi.mock('../lib/api', () => ({
  statisticsApi: {
    getStudentAttempts: vi.fn(),
    getQuizAttempts: vi.fn(),
  },
  getQuizzes: vi.fn(),
}))

const mockTeacher = {
  id: 'teacher1',
  name: 'Professor Teste',
  email: 'professor@teste.com',
  role: 'TEACHER' as const,
}

const mockStudent = {
  id: 'student1',
  name: 'Aluno Teste',
  email: 'aluno@teste.com',
  role: 'STUDENT' as const,
}

const mockAttempts = [
  {
    id: 'attempt1',
    quizId: 'quiz1',
    quizTitle: 'Quiz de Matemática',
    studentId: 'student1',
    studentName: 'Aluno Teste',
    score: 85,
    totalQuestions: 10,
    correctAnswers: 8,
    timeSpentMinutes: 15,
    startedAt: '2023-01-01T10:00:00Z',
    completedAt: '2023-01-01T10:15:00Z',
  },
  {
    id: 'attempt2',
    quizId: 'quiz2',
    quizTitle: 'Quiz de História',
    studentId: 'student1',
    studentName: 'Aluno Teste',
    score: 70,
    totalQuestions: 10,
    correctAnswers: 7,
    timeSpentMinutes: 12,
    startedAt: '2023-01-02T14:00:00Z',
    completedAt: '2023-01-02T14:12:00Z',
  },
]

const mockQuizzes = [
  {
    id: 'quiz1',
    title: 'Quiz de Matemática',
    subject: 'Matemática',
    grade: '7º Ano',
  },
  {
    id: 'quiz2',
    title: 'Quiz de História',
    subject: 'História',
    grade: '7º Ano',
  },
]

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('StudentAttempts Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock das funções da API
    const { statisticsApi, getQuizzes } = require('../lib/api')
    statisticsApi.getStudentAttempts.mockResolvedValue(mockAttempts)
    statisticsApi.getQuizAttempts.mockResolvedValue(mockAttempts)
    getQuizzes.mockResolvedValue(mockQuizzes)
  })

  describe('Teacher View', () => {
    it('renders the student attempts page with title', async () => {
      renderWithProviders(<StudentAttempts />)
      
      // Verifica se o título da página é renderizado
      expect(screen.getByText('Tentativas dos Alunos')).toBeInTheDocument()
    })

    it('loads and displays student attempts', async () => {
      renderWithProviders(<StudentAttempts />)
      
      // Espera o carregamento das tentativas
      await waitFor(() => {
        expect(require('../lib/api').statisticsApi.getStudentAttempts).toHaveBeenCalled()
      })
      
      // Verifica se as tentativas são exibidas
      await waitFor(() => {
        expect(screen.getByText('Quiz de Matemática')).toBeInTheDocument()
        expect(screen.getByText('Quiz de História')).toBeInTheDocument()
        expect(screen.getByText('85%')).toBeInTheDocument()
        expect(screen.getByText('70%')).toBeInTheDocument()
      })
    })

    it('shows statistics summary', async () => {
      renderWithProviders(<StudentAttempts />)
      
      // Espera o carregamento das tentativas
      await waitFor(() => {
        expect(screen.getByText('Quiz de Matemática')).toBeInTheDocument()
      })
      
      // Verifica se o resumo de estatísticas é exibido
      await waitFor(() => {
        expect(screen.getByText('Resumo de Estatísticas')).toBeInTheDocument()
        expect(screen.getByText('Total de Tentativas')).toBeInTheDocument()
        expect(screen.getByText('Pontuação Média')).toBeInTheDocument()
        expect(screen.getByText('Taxa de Aprovação')).toBeInTheDocument()
      })
    })

    it('filters attempts by quiz', async () => {
      renderWithProviders(<StudentAttempts />)
      
      // Espera o carregamento das tentativas
      await waitFor(() => {
        expect(screen.getByText('Quiz de Matemática')).toBeInTheDocument()
      })
      
      // Seleciona um quiz no filtro
      const quizSelect = screen.getByLabelText('Filtrar por Quiz')
      fireEvent.change(quizSelect, { target: { value: 'quiz1' } })
      
      // Verifica se a API foi chamada com o filtro
      await waitFor(() => {
        expect(require('../lib/api').statisticsApi.getStudentAttempts).toHaveBeenCalledWith(
          undefined,
          'quiz1'
        )
      })
    })

    it('loads quizzes for filter dropdown', async () => {
      renderWithProviders(<StudentAttempts />)
      
      // Espera o carregamento dos quizzes
      await waitFor(() => {
        expect(require('../lib/api').getQuizzes).toHaveBeenCalled()
      })
      
      // Verifica se os quizzes são exibidos no filtro
      await waitFor(() => {
        expect(screen.getByText('Quiz de Matemática')).toBeInTheDocument()
        expect(screen.getByText('Quiz de História')).toBeInTheDocument()
      })
    })
  })

  describe('Student View', () => {
    it('renders the student attempts page with title for student', async () => {
      renderWithProviders(<StudentAttempts />)
      
      // Verifica se o título da página é renderizado
      expect(screen.getByText('Minhas Tentativas')).toBeInTheDocument()
    })

    it('loads and displays student attempts for student', async () => {
      renderWithProviders(<StudentAttempts />)
      
      // Espera o carregamento das tentativas
      await waitFor(() => {
        expect(require('../lib/api').statisticsApi.getStudentAttempts).toHaveBeenCalledWith(
          'student1',
          undefined
        )
      })
      
      // Verifica se as tentativas são exibidas
      await waitFor(() => {
        expect(screen.getByText('Quiz de Matemática')).toBeInTheDocument()
        expect(screen.getByText('Quiz de História')).toBeInTheDocument()
        expect(screen.getByText('85%')).toBeInTheDocument()
        expect(screen.getByText('70%')).toBeInTheDocument()
      })
    })

    it('shows personal statistics summary for student', async () => {
      renderWithProviders(<StudentAttempts />)
      
      // Espera o carregamento das tentativas
      await waitFor(() => {
        expect(screen.getByText('Quiz de Matemática')).toBeInTheDocument()
      })
      
      // Verifica se o resumo de estatísticas pessoais é exibido
      await waitFor(() => {
        expect(screen.getByText('Minhas Estatísticas')).toBeInTheDocument()
        expect(screen.getByText('Total de Tentativas')).toBeInTheDocument()
        expect(screen.getByText('Pontuação Média')).toBeInTheDocument()
        expect(screen.getByText('Taxa de Aprovação')).toBeInTheDocument()
      })
    })
  })

  describe('Common Functionality', () => {
    it('displays attempt details correctly', async () => {
      renderWithProviders(<StudentAttempts />)
      
      // Espera o carregamento das tentativas
      await waitFor(() => {
        expect(screen.getByText('Quiz de Matemática')).toBeInTheDocument()
      })
      
      // Verifica se os detalhes da tentativa são exibidos
      await waitFor(() => {
        expect(screen.getByText('8 de 10')).toBeInTheDocument()
        expect(screen.getByText('15 minutos')).toBeInTheDocument()
      })
    })

    it('shows loading state while fetching data', async () => {
      const { statisticsApi } = require('../lib/api')
      statisticsApi.getStudentAttempts.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      renderWithProviders(<StudentAttempts />)
      
      // Verifica se o estado de carregamento é exibido
      expect(screen.getByText('Carregando tentativas...')).toBeInTheDocument()
    })

    it('handles error states correctly', async () => {
      const { statisticsApi } = require('../lib/api')
      statisticsApi.getStudentAttempts.mockRejectedValue(new Error('API Error'))
      
      renderWithProviders(<StudentAttempts />)
      
      // Verifica se a mensagem de erro é exibida
      await waitFor(() => {
        expect(screen.getByText(/Erro ao carregar tentativas/)).toBeInTheDocument()
      })
    })

    it('shows empty state when no attempts are found', async () => {
      const { statisticsApi } = require('../lib/api')
      statisticsApi.getStudentAttempts.mockResolvedValue([])
      
      renderWithProviders(<StudentAttempts />)
      
      // Verifica se o estado vazio é exibido
      await waitFor(() => {
        expect(screen.getByText('Nenhuma tentativa encontrada')).toBeInTheDocument()
      })
    })
  })
})