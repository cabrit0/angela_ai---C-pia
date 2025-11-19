import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../lib/auth/AuthContext'
import Assignments from '../pages/Assignments'
import { vi } from 'vitest'

// Mock das funções da API
vi.mock('../lib/api', () => ({
  assignmentsApi: {
    listForCurrentUser: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  getQuizzes: vi.fn(),
  classesApi: {
    listForCurrentUser: vi.fn(),
  },
}))


const mockAssignments = [
  {
    id: 'assignment1',
    quizId: 'quiz1',
    quizTitle: 'Quiz de Matemática',
    classId: 'class1',
    className: 'Turma 7ºA',
    isActive: true,
    availableFrom: '2023-01-01T00:00:00Z',
    availableTo: '2023-12-31T23:59:59Z',
    createdAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 'assignment2',
    quizId: 'quiz2',
    quizTitle: 'Quiz de História',
    classId: 'class2',
    className: 'Turma 8ºB',
    isActive: false,
    availableFrom: '2023-02-01T00:00:00Z',
    availableTo: '2023-11-30T23:59:59Z',
    createdAt: '2023-02-01T00:00:00Z',
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
    grade: '8º Ano',
  },
]

const mockClasses = [
  {
    id: 'class1',
    name: 'Turma 7ºA',
    description: 'Turma do 7º ano A',
  },
  {
    id: 'class2',
    name: 'Turma 8ºB',
    description: 'Turma do 8º ano B',
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

describe('Assignments Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock das funções da API
    const { assignmentsApi, getQuizzes, classesApi } = require('../lib/api')
    assignmentsApi.listForCurrentUser.mockResolvedValue(mockAssignments)
    getQuizzes.mockResolvedValue(mockQuizzes)
    classesApi.listForCurrentUser.mockResolvedValue(mockClasses)
  })

  it('renders the assignments page with title', async () => {
    renderWithProviders(<Assignments />)
    
    // Verifica se o título da página é renderizado
    expect(screen.getByText('Gerenciamento de Assignments')).toBeInTheDocument()
    
    // Verifica se o botão de criar assignment é renderizado
    expect(screen.getByText('Criar Novo Assignment')).toBeInTheDocument()
  })

  it('loads and displays assignments', async () => {
    renderWithProviders(<Assignments />)
    
    // Espera o carregamento dos assignments
    await waitFor(() => {
      expect(require('../lib/api').assignmentsApi.listForCurrentUser).toHaveBeenCalled()
    })
    
    // Verifica se os assignments são exibidos
    await waitFor(() => {
      expect(screen.getByText('Quiz de Matemática')).toBeInTheDocument()
      expect(screen.getByText('Turma 7ºA')).toBeInTheDocument()
      expect(screen.getByText('Quiz de História')).toBeInTheDocument()
      expect(screen.getByText('Turma 8ºB')).toBeInTheDocument()
    })
  })

  it('shows active and inactive status correctly', async () => {
    renderWithProviders(<Assignments />)
    
    // Espera o carregamento dos assignments
    await waitFor(() => {
      expect(screen.getByText('Quiz de Matemática')).toBeInTheDocument()
    })
    
    // Verifica se os status são exibidos corretamente
    await waitFor(() => {
      expect(screen.getByText('Ativo')).toBeInTheDocument()
      expect(screen.getByText('Inativo')).toBeInTheDocument()
    })
  })

  it('opens create assignment modal when button is clicked', async () => {
    renderWithProviders(<Assignments />)
    
    // Clica no botão de criar assignment
    const createButton = screen.getByText('Criar Novo Assignment')
    fireEvent.click(createButton)
    
    // Verifica se o modal é aberto
    await waitFor(() => {
      expect(screen.getByText('Criar Novo Assignment')).toBeInTheDocument()
      expect(screen.getByLabelText('Quiz')).toBeInTheDocument()
      expect(screen.getByLabelText('Turma')).toBeInTheDocument()
    })
  })

  it('creates a new assignment when form is submitted', async () => {
    const { assignmentsApi } = require('../lib/api')
    assignmentsApi.create.mockResolvedValue({ id: 'assignment3', quizId: 'quiz1', classId: 'class1' })
    
    renderWithProviders(<Assignments />)
    
    // Abre o modal de criação
    const createButton = screen.getByText('Criar Novo Assignment')
    fireEvent.click(createButton)
    
    // Preenche o formulário
    await waitFor(() => {
      // Seleciona um quiz
      const quizSelect = screen.getByLabelText('Quiz')
      fireEvent.change(quizSelect, { target: { value: 'quiz1' } })
      
      // Seleciona uma turma
      const classSelect = screen.getByLabelText('Turma')
      fireEvent.change(classSelect, { target: { value: 'class1' } })
    })
    
    // Submete o formulário
    const submitButton = screen.getByText('Criar Assignment')
    fireEvent.click(submitButton)
    
    // Verifica se a API foi chamada corretamente
    await waitFor(() => {
      expect(assignmentsApi.create).toHaveBeenCalledWith({
        quizId: 'quiz1',
        classId: 'class1',
        availableFrom: expect.any(String),
        availableTo: expect.any(String),
      })
    })
  })

  it('opens edit assignment modal when edit button is clicked', async () => {
    renderWithProviders(<Assignments />)
    
    // Espera o carregamento dos assignments
    await waitFor(() => {
      expect(screen.getByText('Quiz de Matemática')).toBeInTheDocument()
    })
    
    // Clica no botão de editar
    const editButton = screen.getByText('Editar')
    fireEvent.click(editButton)
    
    // Verifica se o modal de edição é aberto
    await waitFor(() => {
      expect(screen.getByText('Editar Assignment')).toBeInTheDocument()
    })
  })

  it('toggles assignment status when toggle button is clicked', async () => {
    const { assignmentsApi } = require('../lib/api')
    assignmentsApi.update.mockResolvedValue({ id: 'assignment1', isActive: false })
    
    renderWithProviders(<Assignments />)
    
    // Espera o carregamento dos assignments
    await waitFor(() => {
      expect(screen.getByText('Quiz de Matemática')).toBeInTheDocument()
    })
    
    // Clica no botão de toggle
    const toggleButton = screen.getByText('Desativar')
    fireEvent.click(toggleButton)
    
    // Verifica se a API foi chamada corretamente
    await waitFor(() => {
      expect(assignmentsApi.update).toHaveBeenCalledWith('assignment1', { isActive: false })
    })
  })

  it('shows confirmation dialog when delete button is clicked', async () => {
    renderWithProviders(<Assignments />)
    
    // Espera o carregamento dos assignments
    await waitFor(() => {
      expect(screen.getByText('Quiz de Matemática')).toBeInTheDocument()
    })
    
    // Clica no botão de excluir
    const deleteButton = screen.getByText('Excluir')
    fireEvent.click(deleteButton)
    
    // Verifica se o diálogo de confirmação é exibido
    await waitFor(() => {
      expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument()
      expect(screen.getByText(/Tem certeza que deseja excluir o assignment/)).toBeInTheDocument()
    })
  })

  it('deletes the assignment when confirmed', async () => {
    const { assignmentsApi } = require('../lib/api')
    assignmentsApi.delete.mockResolvedValue({ success: true })
    
    renderWithProviders(<Assignments />)
    
    // Clica no botão de excluir
    await waitFor(() => {
      const deleteButton = screen.getByText('Excluir')
      fireEvent.click(deleteButton)
    })
    
    // Confirma a exclusão
    await waitFor(() => {
      const confirmButton = screen.getByText('Excluir Assignment')
      fireEvent.click(confirmButton)
    })
    
    // Verifica se a API foi chamada corretamente
    await waitFor(() => {
      expect(assignmentsApi.delete).toHaveBeenCalledWith('assignment1')
    })
  })

  it('handles error states correctly', async () => {
    const { assignmentsApi } = require('../lib/api')
    assignmentsApi.listForCurrentUser.mockRejectedValue(new Error('API Error'))
    
    renderWithProviders(<Assignments />)
    
    // Verifica se a mensagem de erro é exibida
    await waitFor(() => {
      expect(screen.getByText(/Erro ao carregar assignments/)).toBeInTheDocument()
    })
  })
})