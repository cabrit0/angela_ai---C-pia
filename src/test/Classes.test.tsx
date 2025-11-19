import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../lib/auth/AuthContext'
import Classes from '../pages/Classes'
import { vi } from 'vitest'

// Mock das funções da API
vi.mock('../lib/api', () => ({
  classesApi: {
    listForCurrentUser: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    enrollStudent: vi.fn(),
    removeStudent: vi.fn(),
    getStudents: vi.fn(),
  },
}))

const mockUser = {
  id: 'teacher1',
  name: 'Professor Teste',
  email: 'professor@teste.com',
  role: 'TEACHER' as const,
}

const mockClasses = [
  {
    id: 'class1',
    name: 'Turma 7ºA',
    description: 'Turma do 7º ano A',
    teacherId: 'teacher1',
    createdAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 'class2',
    name: 'Turma 8ºB',
    description: 'Turma do 8º ano B',
    teacherId: 'teacher1',
    createdAt: '2023-01-02T00:00:00Z',
  },
]

const mockStudents = [
  {
    id: 'student1',
    name: 'Aluno Teste',
    email: 'aluno@teste.com',
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

describe('Classes Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock das funções da API
    const { classesApi } = require('../lib/api')
    classesApi.listForCurrentUser.mockResolvedValue(mockClasses)
    classesApi.getStudents.mockResolvedValue(mockStudents)
  })

  it('renders the classes page with title', async () => {
    renderWithProviders(<Classes />)
    
    // Verifica se o título da página é renderizado
    expect(screen.getByText('Gerenciamento de Turmas')).toBeInTheDocument()
    
    // Verifica se o botão de criar turma é renderizado
    expect(screen.getByText('Criar Nova Turma')).toBeInTheDocument()
  })

  it('loads and displays classes', async () => {
    renderWithProviders(<Classes />)
    
    // Espera o carregamento das turmas
    await waitFor(() => {
      expect(require('../lib/api').classesApi.listForCurrentUser).toHaveBeenCalled()
    })
    
    // Verifica se as turmas são exibidas
    await waitFor(() => {
      expect(screen.getByText('Turma 7ºA')).toBeInTheDocument()
      expect(screen.getByText('Turma do 7º ano A')).toBeInTheDocument()
      expect(screen.getByText('Turma 8ºB')).toBeInTheDocument()
      expect(screen.getByText('Turma do 8º ano B')).toBeInTheDocument()
    })
  })

  it('opens create class modal when button is clicked', async () => {
    renderWithProviders(<Classes />)
    
    // Clica no botão de criar turma
    const createButton = screen.getByText('Criar Nova Turma')
    fireEvent.click(createButton)
    
    // Verifica se o modal é aberto
    await waitFor(() => {
      expect(screen.getByText('Criar Nova Turma')).toBeInTheDocument()
      expect(screen.getByLabelText('Nome da Turma')).toBeInTheDocument()
      expect(screen.getByLabelText('Descrição')).toBeInTheDocument()
    })
  })

  it('creates a new class when form is submitted', async () => {
    const { classesApi } = require('../lib/api')
    classesApi.create.mockResolvedValue({ id: 'class3', name: 'Nova Turma' })
    
    renderWithProviders(<Classes />)
    
    // Abre o modal de criação
    const createButton = screen.getByText('Criar Nova Turma')
    fireEvent.click(createButton)
    
    // Preenche o formulário
    await waitFor(() => {
      const nameInput = screen.getByLabelText('Nome da Turma')
      const descriptionInput = screen.getByLabelText('Descrição')
      
      fireEvent.change(nameInput, { target: { value: 'Nova Turma' } })
      fireEvent.change(descriptionInput, { target: { value: 'Descrição da nova turma' } })
    })
    
    // Submete o formulário
    const submitButton = screen.getByText('Criar Turma')
    fireEvent.click(submitButton)
    
    // Verifica se a API foi chamada corretamente
    await waitFor(() => {
      expect(classesApi.create).toHaveBeenCalledWith({
        name: 'Nova Turma',
        description: 'Descrição da nova turma',
      })
    })
  })

  it('opens edit class modal when edit button is clicked', async () => {
    renderWithProviders(<Classes />)
    
    // Espera o carregamento das turmas
    await waitFor(() => {
      expect(screen.getByText('Turma 7ºA')).toBeInTheDocument()
    })
    
    // Clica no botão de editar
    const editButton = screen.getByText('Editar')
    fireEvent.click(editButton)
    
    // Verifica se o modal de edição é aberto
    await waitFor(() => {
      expect(screen.getByText('Editar Turma')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Turma 7ºA')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Turma do 7º ano A')).toBeInTheDocument()
    })
  })

  it('opens enroll students modal when enroll button is clicked', async () => {
    renderWithProviders(<Classes />)
    
    // Espera o carregamento das turmas
    await waitFor(() => {
      expect(screen.getByText('Turma 7ºA')).toBeInTheDocument()
    })
    
    // Clica no botão de matricular alunos
    const enrollButton = screen.getByText('Matricular Alunos')
    fireEvent.click(enrollButton)
    
    // Verifica se o modal de matrícula é aberto
    await waitFor(() => {
      expect(screen.getByText('Matricular Alunos')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Digite o email do aluno')).toBeInTheDocument()
    })
  })

  it('enrolls a student when form is submitted', async () => {
    const { classesApi } = require('../lib/api')
    classesApi.enrollStudent.mockResolvedValue({ success: true })
    
    renderWithProviders(<Classes />)
    
    // Abre o modal de matrícula
    await waitFor(() => {
      const enrollButton = screen.getByText('Matricular Alunos')
      fireEvent.click(enrollButton)
    })
    
    // Preenche o formulário
    await waitFor(() => {
      const emailInput = screen.getByPlaceholderText('Digite o email do aluno')
      fireEvent.change(emailInput, { target: { value: 'novoaluno@teste.com' } })
    })
    
    // Submete o formulário
    const submitButton = screen.getByText('Matricular')
    fireEvent.click(submitButton)
    
    // Verifica se a API foi chamada corretamente
    await waitFor(() => {
      expect(classesApi.enrollStudent).toHaveBeenCalledWith('class1', 'novoaluno@teste.com')
    })
  })

  it('shows confirmation dialog when delete button is clicked', async () => {
    renderWithProviders(<Classes />)
    
    // Espera o carregamento das turmas
    await waitFor(() => {
      expect(screen.getByText('Turma 7ºA')).toBeInTheDocument()
    })
    
    // Clica no botão de excluir
    const deleteButton = screen.getByText('Excluir')
    fireEvent.click(deleteButton)
    
    // Verifica se o diálogo de confirmação é exibido
    await waitFor(() => {
      expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument()
      expect(screen.getByText(/Tem certeza que deseja excluir a turma/)).toBeInTheDocument()
    })
  })

  it('deletes a class when confirmed', async () => {
    const { classesApi } = require('../lib/api')
    classesApi.delete.mockResolvedValue({ success: true })
    
    renderWithProviders(<Classes />)
    
    // Clica no botão de excluir
    await waitFor(() => {
      const deleteButton = screen.getByText('Excluir')
      fireEvent.click(deleteButton)
    })
    
    // Confirma a exclusão
    await waitFor(() => {
      const confirmButton = screen.getByText('Excluir Turma')
      fireEvent.click(confirmButton)
    })
    
    // Verifica se a API foi chamada corretamente
    await waitFor(() => {
      expect(classesApi.delete).toHaveBeenCalledWith('class1')
    })
  })

  it('handles error states correctly', async () => {
    const { classesApi } = require('../lib/api')
    classesApi.listForCurrentUser.mockRejectedValue(new Error('API Error'))
    
    renderWithProviders(<Classes />)
    
    // Verifica se a mensagem de erro é exibida
    await waitFor(() => {
      expect(screen.getByText(/Erro ao carregar turmas/)).toBeInTheDocument()
    })
  })
})