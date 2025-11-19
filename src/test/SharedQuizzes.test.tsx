import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../lib/auth/AuthContext'
import SharedQuizzes from '../pages/SharedQuizzes'
import { vi } from 'vitest'

// Mock das funções da API
vi.mock('../lib/api', () => ({
  sharedQuizzesApi: {
    getReceived: vi.fn(),
    getShared: vi.fn(),
    shareQuiz: vi.fn(),
    revokeShare: vi.fn(),
    forkQuiz: vi.fn(),
  },
  getQuizzes: vi.fn(),
}))


const mockReceivedQuizzes = [
  {
    id: 'shared1',
    quizId: 'quiz1',
    quizTitle: 'Quiz de Matemática Compartilhado',
    sharedBy: 'teacher2',
    sharedByName: 'Professor João',
    sharedAt: '2023-01-01T00:00:00Z',
    canEdit: false,
  },
  {
    id: 'shared2',
    quizId: 'quiz2',
    quizTitle: 'Quiz de História Compartilhado',
    sharedBy: 'teacher3',
    sharedByName: 'Professora Maria',
    sharedAt: '2023-01-02T00:00:00Z',
    canEdit: true,
  },
]

const mockSharedQuizzes = [
  {
    id: 'shared3',
    quizId: 'quiz3',
    quizTitle: 'Quiz de Geografia',
    sharedWith: 'teacher4',
    sharedWithName: 'Professor Pedro',
    sharedAt: '2023-01-03T00:00:00Z',
    canEdit: true,
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

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('SharedQuizzes Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock das funções da API
    const { sharedQuizzesApi, getQuizzes } = require('../lib/api')
    sharedQuizzesApi.getReceived.mockResolvedValue(mockReceivedQuizzes)
    sharedQuizzesApi.getShared.mockResolvedValue(mockSharedQuizzes)
    getQuizzes.mockResolvedValue(mockQuizzes)
  })

  it('renders the shared quizzes page with title', async () => {
    renderWithProviders(<SharedQuizzes />)
    
    // Verifica se o título da página é renderizado
    expect(screen.getByText('Quizzes Compartilhados')).toBeInTheDocument()
    
    // Verifica se as abas são renderizadas
    expect(screen.getByText('Recebidos')).toBeInTheDocument()
    expect(screen.getByText('Compartilhados')).toBeInTheDocument()
  })

  it('loads and displays received quizzes', async () => {
    renderWithProviders(<SharedQuizzes />)
    
    // Espera o carregamento dos quizzes recebidos
    await waitFor(() => {
      expect(require('../lib/api').sharedQuizzesApi.getReceived).toHaveBeenCalled()
    })
    
    // Verifica se os quizzes recebidos são exibidos
    await waitFor(() => {
      expect(screen.getByText('Quiz de Matemática Compartilhado')).toBeInTheDocument()
      expect(screen.getByText('Professor João')).toBeInTheDocument()
      expect(screen.getByText('Quiz de História Compartilhado')).toBeInTheDocument()
      expect(screen.getByText('Professora Maria')).toBeInTheDocument()
    })
  })

  it('switches between tabs correctly', async () => {
    renderWithProviders(<SharedQuizzes />)
    
    // Verifica se a aba inicial é a de recebidos
    expect(screen.getByText('Recebidos')).toHaveClass('shared-tab-button-active')
    
    // Clica na aba de compartilhados
    fireEvent.click(screen.getByText('Compartilhados'))
    
    // Verifica se a aba de compartilhados está ativa
    await waitFor(() => {
      expect(screen.getByText('Compartilhados')).toHaveClass('shared-tab-button-active')
      expect(screen.getByText('Recebidos')).toHaveClass('shared-tab-button-inactive')
    })
  })

  it('loads and displays shared quizzes', async () => {
    renderWithProviders(<SharedQuizzes />)
    
    // Clica na aba de compartilhados
    fireEvent.click(screen.getByText('Compartilhados'))
    
    // Espera o carregamento dos quizzes compartilhados
    await waitFor(() => {
      expect(require('../lib/api').sharedQuizzesApi.getShared).toHaveBeenCalled()
    })
    
    // Verifica se os quizzes compartilhados são exibidos
    await waitFor(() => {
      expect(screen.getByText('Quiz de Geografia')).toBeInTheDocument()
      expect(screen.getByText('Professor Pedro')).toBeInTheDocument()
    })
  })

  it('opens share quiz modal when button is clicked', async () => {
    renderWithProviders(<SharedQuizzes />)
    
    // Clica no botão de compartilhar
    const shareButton = screen.getByText('Compartilhar Quiz')
    fireEvent.click(shareButton)
    
    // Verifica se o modal é aberto
    await waitFor(() => {
      expect(screen.getByText('Compartilhar Quiz')).toBeInTheDocument()
      expect(screen.getByLabelText('Quiz')).toBeInTheDocument()
      expect(screen.getByLabelText('Email do Destinatário')).toBeInTheDocument()
    })
  })

  it('shares a quiz when form is submitted', async () => {
    const { sharedQuizzesApi } = require('../lib/api')
    sharedQuizzesApi.shareQuiz.mockResolvedValue({ success: true })
    
    renderWithProviders(<SharedQuizzes />)
    
    // Abre o modal de compartilhamento
    const shareButton = screen.getByText('Compartilhar Quiz')
    fireEvent.click(shareButton)
    
    // Preenche o formulário
    await waitFor(() => {
      // Seleciona um quiz
      const quizSelect = screen.getByLabelText('Quiz')
      fireEvent.change(quizSelect, { target: { value: 'quiz1' } })
      
      // Preenche o email
      const emailInput = screen.getByLabelText('Email do Destinatário')
      fireEvent.change(emailInput, { target: { value: 'professor@exemplo.com' } })
    })
    
    // Submete o formulário
    const submitButton = screen.getByText('Compartilhar')
    fireEvent.click(submitButton)
    
    // Verifica se a API foi chamada corretamente
    await waitFor(() => {
      expect(sharedQuizzesApi.shareQuiz).toHaveBeenCalledWith({
        quizId: 'quiz1',
        recipientEmail: 'professor@exemplo.com',
        canEdit: false,
      })
    })
  })

  it('forks a quiz when fork button is clicked', async () => {
    const { sharedQuizzesApi } = require('../lib/api')
    sharedQuizzesApi.forkQuiz.mockResolvedValue({ id: 'newQuiz', title: 'Cópia do Quiz' })
    
    renderWithProviders(<SharedQuizzes />)
    
    // Espera o carregamento dos quizzes recebidos
    await waitFor(() => {
      expect(screen.getByText('Quiz de Matemática Compartilhado')).toBeInTheDocument()
    })
    
    // Clica no botão de fork
    const forkButton = screen.getByText('Fork')
    fireEvent.click(forkButton)
    
    // Verifica se a API foi chamada corretamente
    await waitFor(() => {
      expect(sharedQuizzesApi.forkQuiz).toHaveBeenCalledWith('shared1')
    })
  })

  it('shows confirmation dialog when revoke button is clicked', async () => {
    renderWithProviders(<SharedQuizzes />)
    
    // Clica na aba de compartilhados
    fireEvent.click(screen.getByText('Compartilhados'))
    
    // Espera o carregamento dos quizzes compartilhados
    await waitFor(() => {
      expect(screen.getByText('Quiz de Geografia')).toBeInTheDocument()
    })
    
    // Clica no botão de revogar
    const revokeButton = screen.getByText('Revogar')
    fireEvent.click(revokeButton)
    
    // Verifica se o diálogo de confirmação é exibido
    await waitFor(() => {
      expect(screen.getByText('Confirmar Revogação')).toBeInTheDocument()
      expect(screen.getByText(/Tem certeza que deseja revogar o compartilhamento/)).toBeInTheDocument()
    })
  })

  it('revokes a shared quiz when confirmed', async () => {
    const { sharedQuizzesApi } = require('../lib/api')
    sharedQuizzesApi.revokeShare.mockResolvedValue({ success: true })
    
    renderWithProviders(<SharedQuizzes />)
    
    // Clica na aba de compartilhados
    fireEvent.click(screen.getByText('Compartilhados'))
    
    // Clica no botão de revogar
    await waitFor(() => {
      const revokeButton = screen.getByText('Revogar')
      fireEvent.click(revokeButton)
    })
    
    // Confirma a revogação
    await waitFor(() => {
      const confirmButton = screen.getByText('Revogar Compartilhamento')
      fireEvent.click(confirmButton)
    })
    
    // Verifica se a API foi chamada corretamente
    await waitFor(() => {
      expect(sharedQuizzesApi.revokeShare).toHaveBeenCalledWith('shared3')
    })
  })

  it('handles error states correctly', async () => {
    const { sharedQuizzesApi } = require('../lib/api')
    sharedQuizzesApi.getReceived.mockRejectedValue(new Error('API Error'))
    
    renderWithProviders(<SharedQuizzes />)
    
    // Verifica se a mensagem de erro é exibida
    await waitFor(() => {
      expect(screen.getByText(/Erro ao carregar quizzes recebidos/)).toBeInTheDocument()
    })
  })
})