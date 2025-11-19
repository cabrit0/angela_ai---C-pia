import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../lib/auth/AuthContext'
import Reports from '../pages/Reports'
import { vi } from 'vitest'

// Mock das funções da API
vi.mock('../lib/api', () => ({
  statisticsApi: {
    getQuizStatistics: vi.fn(),
    getClassStatistics: vi.fn(),
    getStudentAttempts: vi.fn(),
    getQuizAttempts: vi.fn(),
    getAssignmentStatistics: vi.fn(),
  },
  getQuizzes: vi.fn(),
  classesApi: {
    listForCurrentUser: vi.fn(),
  },
  assignmentsApi: {
    listForCurrentUser: vi.fn(),
  },
}))

// Mock do pdfmake para evitar problemas de importação
vi.mock('pdfmake', () => ({
  createPdf: vi.fn(() => ({
    download: vi.fn(),
  })),
}))


const mockQuizzes = [
  {
    id: 'quiz1',
    title: 'Quiz de Matemática',
    subject: 'Matemática',
    grade: '7º Ano',
    questions: [],
    createdAt: '2023-01-01T00:00:00Z',
  },
]

const mockClasses = [
  {
    id: 'class1',
    name: 'Turma 7ºA',
    description: 'Turma do 7º ano A',
    teacherId: 'teacher1',
  },
]

const mockAssignments = [
  {
    id: 'assignment1',
    quizId: 'quiz1',
    classId: 'class1',
    isActive: true,
    availableFrom: '2023-01-01T00:00:00Z',
    availableTo: '2023-12-31T23:59:59Z',
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

describe('Reports Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock das funções da API
    const { getQuizzes, classesApi, assignmentsApi } = require('../lib/api')
    getQuizzes.mockResolvedValue(mockQuizzes)
    classesApi.listForCurrentUser.mockResolvedValue(mockClasses)
    assignmentsApi.listForCurrentUser.mockResolvedValue(mockAssignments)
  })

  it('renders the reports page with tabs', async () => {
    renderWithProviders(<Reports />)
    
    // Verifica se o título da página é renderizado
    expect(screen.getByText('Relatórios e Estatísticas')).toBeInTheDocument()
    
    // Verifica se as abas são renderizadas
    expect(screen.getByText('Estatísticas do Quiz')).toBeInTheDocument()
    expect(screen.getByText('Estatísticas da Turma')).toBeInTheDocument()
    expect(screen.getByText('Tentativas do Aluno')).toBeInTheDocument()
    expect(screen.getByText('Tentativas do Quiz')).toBeInTheDocument()
    expect(screen.getByText('Estatísticas do Assignment')).toBeInTheDocument()
  })

  it('switches between tabs correctly', async () => {
    renderWithProviders(<Reports />)
    
    // Verifica se a aba inicial é a de estatísticas do quiz
    expect(screen.getByText('Estatísticas do Quiz')).toHaveClass('reports-tab-button-active')
    
    // Clica na aba de estatísticas da turma
    fireEvent.click(screen.getByText('Estatísticas da Turma'))
    
    // Verifica se a aba de estatísticas da turma está ativa
    await waitFor(() => {
      expect(screen.getByText('Estatísticas da Turma')).toHaveClass('reports-tab-button-active')
      expect(screen.getByText('Estatísticas do Quiz')).toHaveClass('reports-tab-button-inactive')
    })
  })

  it('loads and displays quizzes in the dropdown', async () => {
    renderWithProviders(<Reports />)
    
    // Espera o carregamento dos quizzes
    await waitFor(() => {
      expect(require('../lib/api').getQuizzes).toHaveBeenCalled()
    })
    
    // Clica no campo de busca para abrir o dropdown
    const searchInput = screen.getByPlaceholderText('Buscar quiz...')
    fireEvent.focus(searchInput)
    fireEvent.change(searchInput, { target: { value: 'Matemática' } })
    
    // Verifica se o quiz aparece no dropdown
    await waitFor(() => {
      expect(screen.getByText('Quiz de Matemática')).toBeInTheDocument()
    })
  })

  it('shows filters panel when filters button is clicked', async () => {
    renderWithProviders(<Reports />)
    
    // Clica no botão de filtros
    const filtersButton = screen.getByText('Filtros')
    fireEvent.click(filtersButton)
    
    // Verifica se o painel de filtros é exibido
    await waitFor(() => {
      expect(screen.getByText('Filtrar por Data')).toBeInTheDocument()
      expect(screen.getByText('Data Início')).toBeInTheDocument()
      expect(screen.getByText('Data Fim')).toBeInTheDocument()
    })
  })

  it('displays quiz statistics when a quiz is selected', async () => {
    const mockStatistics = {
      quizId: 'quiz1',
      totalAttempts: 25,
      averageScore: 75.5,
      passRate: 80.0,
      averageTimeMinutes: 15,
      questionStatistics: [
        {
          questionId: 'q1',
          prompt: 'Quanto é 2 + 2?',
          correctAnswers: 20,
          incorrectAnswers: 5,
          correctRate: 80.0,
        },
      ],
    }
    
    const { statisticsApi } = require('../lib/api')
    statisticsApi.getQuizStatistics.mockResolvedValue(mockStatistics)
    
    renderWithProviders(<Reports />)
    
    // Seleciona um quiz
    const searchInput = screen.getByPlaceholderText('Buscar quiz...')
    fireEvent.focus(searchInput)
    fireEvent.change(searchInput, { target: { value: 'Matemática' } })
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Quiz de Matemática'))
    })
    
    // Clica no botão de buscar estatísticas
    const searchButton = screen.getByText('Buscar Estatísticas')
    fireEvent.click(searchButton)
    
    // Verifica se as estatísticas são exibidas
    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument() // Total de Tentativas
      expect(screen.getByText('75.5%')).toBeInTheDocument() // Pontuação Média
      expect(screen.getByText('80.0%')).toBeInTheDocument() // Taxa de Aprovação
      expect(screen.getByText('Análise por Pergunta')).toBeInTheDocument()
    })
  })

  it('shows export options when statistics are loaded', async () => {
    const mockStatistics = {
      quizId: 'quiz1',
      totalAttempts: 25,
      averageScore: 75.5,
      passRate: 80.0,
      averageTimeMinutes: 15,
      questionStatistics: [
        {
          questionId: 'q1',
          prompt: 'Quanto é 2 + 2?',
          correctAnswers: 20,
          incorrectAnswers: 5,
          correctRate: 80.0,
        },
      ],
    }
    
    const { statisticsApi } = require('../lib/api')
    statisticsApi.getQuizStatistics.mockResolvedValue(mockStatistics)
    
    renderWithProviders(<Reports />)
    
    // Seleciona um quiz e busca estatísticas
    const searchInput = screen.getByPlaceholderText('Buscar quiz...')
    fireEvent.focus(searchInput)
    fireEvent.change(searchInput, { target: { value: 'Matemática' } })
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Quiz de Matemática'))
    })
    
    const searchButton = screen.getByText('Buscar Estatísticas')
    fireEvent.click(searchButton)
    
    // Verifica se as opções de exportação são exibidas
    await waitFor(() => {
      expect(screen.getByText('Exportar Dados')).toBeInTheDocument()
      expect(screen.getByText('Exportar CSV')).toBeInTheDocument()
      expect(screen.getByText('Exportar PDF')).toBeInTheDocument()
    })
  })

  it('handles error states correctly', async () => {
    const { statisticsApi } = require('../lib/api')
    statisticsApi.getQuizStatistics.mockRejectedValue(new Error('API Error'))
    
    renderWithProviders(<Reports />)
    
    // Seleciona um quiz
    const searchInput = screen.getByPlaceholderText('Buscar quiz...')
    fireEvent.focus(searchInput)
    fireEvent.change(searchInput, { target: { value: 'Matemática' } })
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Quiz de Matemática'))
    })
    
    // Clica no botão de buscar estatísticas
    const searchButton = screen.getByText('Buscar Estatísticas')
    fireEvent.click(searchButton)
    
    // Verifica se a mensagem de erro é exibida
    await waitFor(() => {
      expect(screen.getByText(/Erro ao carregar estatísticas do quiz/)).toBeInTheDocument()
    })
  })
})