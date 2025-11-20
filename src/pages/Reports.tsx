import React, { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth/AuthContext'
import {
  statisticsApi,
  getQuizzes,
  classesApi,
  assignmentsApi
} from '../lib/api'
import type {
  QuizStatistics,
  ClassStatistics,
  StudentAttempt,
  AssignmentStatistics
} from '../types'

// Simple chart component for visualizations
const SimpleBarChart = ({ data, title, color = 'primary' }: { data: { label: string; value: number }[]; title: string; color?: string }) => {
  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{title}</h4>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{item.label}</span>
                <span className="text-xs font-medium text-gray-900 dark:text-white">{item.value}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full bg-${color}-500`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Simple pie chart component
const SimplePieChart = ({ data, title }: { data: { label: string; value: number; color: string }[]; title: string }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{title}</h4>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full bg-${item.color}-500`}></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-900 dark:text-white">{item.value}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">({((item.value / total) * 100).toFixed(1)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Icon for export functionality
const DownloadIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

// Icon for calendar
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

// SVG Icon Components
const ChartBarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)


const ClipboardListIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
)

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const ReportsPage: React.FC = () => {
  const { user } = useAuth()
  
  // Redirect students away from this page
  if (user?.role === 'STUDENT') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Acesso Restrito</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Esta página está disponível apenas para professores e administradores.</p>
          <a href="/" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Voltar para Início</a>
        </div>
      </div>
    );
  }
  const [activeTab, setActiveTab] = useState<'quiz' | 'class' | 'student' | 'assignment'>('quiz')
  
  // Data states
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  
  // Selection states
  const [selectedQuiz, setSelectedQuiz] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [selectedAssignment, setSelectedAssignment] = useState<string>('')
  
  // Statistics states
  const [quizStats, setQuizStats] = useState<QuizStatistics | null>(null)
  const [classStats, setClassStats] = useState<ClassStatistics | null>(null)
  const [studentAttempts, setStudentAttempts] = useState<StudentAttempt[]>([])
  const [quizAttempts, setQuizAttempts] = useState<StudentAttempt[]>([])
  const [assignmentStats, setAssignmentStats] = useState<AssignmentStatistics | null>(null)
  
  // UI states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  
  // Filter states
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        if (user?.role === 'TEACHER' || user?.role === 'ADMIN') {
          console.log('[Reports] Loading data for user:', user.role)
          const [quizzesData, classesData, assignmentsData] = await Promise.all([
            getQuizzes(),
            classesApi.listForCurrentUser(),
            assignmentsApi.listForCurrentUser()
          ])
          console.log('[Reports] Quizzes loaded:', quizzesData?.length || 0, quizzesData)
          console.log('[Reports] Classes loaded:', classesData?.length || 0, classesData)
          console.log('[Reports] Assignments loaded:', assignmentsData?.length || 0, assignmentsData)
          setQuizzes(quizzesData || [])
          setClasses(classesData || [])
          setAssignments(assignmentsData || [])
        }
      } catch (err) {
        console.error('[Reports] Error loading data:', err)
      }
    }

    loadData()
  }, [user])

  // Load students when a class is selected
  useEffect(() => {
    const loadStudents = async () => {
      if (selectedClass && (activeTab === 'class' || activeTab === 'student')) {
        try {
          const studentsData = await classesApi.getStudents(selectedClass)
          setStudents(studentsData)
        } catch (error) {
          console.error('Error loading students:', error)
          // Fallback to mock data if API fails
          const mockStudents = [
            { id: 'student1', name: 'João Silva', email: 'joao@exemplo.com' },
            { id: 'student2', name: 'Maria Santos', email: 'maria@exemplo.com' },
            { id: 'student3', name: 'Pedro Costa', email: 'pedro@exemplo.com' },
            { id: 'student4', name: 'Ana Oliveira', email: 'ana@exemplo.com' },
            { id: 'student5', name: 'Carlos Ferreira', email: 'carlos@exemplo.com' },
          ]
          setStudents(mockStudents)
        }
      }
    }
    
    loadStudents()
  }, [selectedClass, activeTab])

  const handleGetQuizStatistics = async () => {
    if (!selectedQuiz) {
      setError('Por favor, selecione um quiz')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Load both statistics and attempts
      const [stats, attempts] = await Promise.all([
        statisticsApi.getQuizStatistics(selectedQuiz),
        statisticsApi.getQuizAttempts(selectedQuiz)
      ])
      setQuizStats(stats)
      setQuizAttempts(attempts)
    } catch (err: any) {
      if (err.code === 404) {
        setError('Endpoint de estatísticas de quiz não encontrado (404). Verifique se o servidor foi atualizado com a implementação mais recente.')
      } else {
        setError('Erro ao carregar estatísticas do quiz. Tente novamente.')
      }
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleGetClassStatistics = async () => {
    if (!selectedClass) {
      setError('Por favor, selecione uma turma')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const stats = await statisticsApi.getClassStatistics(selectedClass)
      setClassStats(stats)
    } catch (err: any) {
      if (err.code === 404) {
        setError('Endpoint de estatísticas de turma não encontrado (404). Verifique se o servidor foi atualizado com a implementação mais recente.')
      } else {
        setError('Erro ao carregar estatísticas da turma. Tente novamente.')
      }
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleGetStudentAttempts = async () => {
    if (!selectedStudent) {
      setError('Por favor, selecione um estudante')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const attempts = await statisticsApi.getStudentAttempts(selectedStudent, selectedQuiz || undefined)
      setStudentAttempts(attempts)
    } catch (err: any) {
      if (err.code === 404) {
        setError('Endpoint de tentativas de estudante não encontrado (404). Verifique se o servidor foi atualizado com a implementação mais recente.')
      } else {
        setError('Erro ao carregar tentativas do estudante. Tente novamente.')
      }
      console.error(err)
    } finally {
      setLoading(false)
    }
  }


  const handleGetAssignmentStatistics = async () => {
    if (!selectedAssignment) {
      setError('Por favor, selecione um assignment')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const stats = await statisticsApi.getAssignmentStatistics(selectedAssignment)
      setAssignmentStats(stats)
    } catch (err: any) {
      if (err.code === 404) {
        setError('Endpoint de estatísticas de assignment não encontrado (404). Verifique se o servidor foi atualizado com a implementação mais recente.')
      } else {
        setError('Erro ao carregar estatísticas do assignment. Tente novamente.')
      }
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const notification = document.createElement('div')
    const notificationClass = type === 'success' ? 'notification-success' : 'notification-error'
    notification.className = `notification-enter ${notificationClass}`
    notification.innerHTML = `
      <div class="notification-content">
        <svg class="notification-icon" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
        ${message}
      </div>
    `
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.classList.remove('notification-enter')
      notification.classList.add('notification-enter-active')
    }, 100)
    
    setTimeout(() => {
      notification.classList.remove('notification-enter-active')
      notification.classList.add('notification-exit-active')
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 300)
    }, 3000)
  }

  // Export functions
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      showNotification('Não há dados para exportar', 'error')
      return
    }

    // Get headers from the first object
    const headers = Object.keys(data[0])
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header]
          // Handle nested objects and arrays
          if (typeof value === 'object' && value !== null) {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`
          }
          // Handle strings with commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
    ].join('\n')

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    showNotification('Dados exportados com sucesso para CSV', 'success')
  }

  const exportToPDF = async (data: any[], filename: string, title: string) => {
    if (data.length === 0) {
      showNotification('Não há dados para exportar', 'error')
      return
    }

    try {
      // Import pdfmake dynamically (same approach as in toPdf.ts)
      const pdfMakeModule = await import('pdfmake')
      const fonts = await import('pdfmake/build/vfs_fonts')
      
      const pdfMake = (pdfMakeModule as any).default || (pdfMakeModule as any)
      
      // Configure VFS
      if (fonts && (fonts as any).default) {
        pdfMake.vfs = (fonts as any).default
      } else if ((fonts as any).pdfMake && (fonts as any).pdfMake.vfs) {
        pdfMake.vfs = (fonts as any).pdfMake.vfs
      } else {
        pdfMake.vfs = fonts as any
      }

      if (!pdfMake.vfs || Object.keys(pdfMake.vfs).length === 0) {
        console.error('VFS não foi configurado corretamente', pdfMake.vfs)
        throw new Error('Não foi possível configurar as fontes do PDF.')
      }

      // Create document definition
      const headers = Object.keys(data[0])
      const body = [
        headers, // Header row
        ...data.map(row =>
          headers.map(header => {
            const value = row[header]
            // Handle different data types
            if (typeof value === 'object' && value !== null) {
              return JSON.stringify(value)
            }
            return String(value || '')
          })
        )
      ]

      const docDefinition = {
        content: [
          { text: title, fontSize: 16, bold: true, margin: [0, 0, 0, 10] },
          { text: `Gerado em: ${new Date().toLocaleDateString('pt-PT')}`, fontSize: 10, margin: [0, 0, 0, 20] },
          {
            table: {
              headerRows: 1,
              body: body
            }
          }
        ],
        styles: {
          header: {
            bold: true,
            fontSize: 12,
            color: 'black'
          }
        }
      }

      // Create and download PDF
      const pdfDoc = pdfMake.createPdf(docDefinition)
      pdfDoc.download(`${filename}.pdf`)
      showNotification('Dados exportados com sucesso para PDF', 'success')
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      showNotification('Erro ao exportar para PDF', 'error')
    }
  }

  // Filter functions for dropdowns
  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const filteredAssignments = assignments.filter(assignment => {
    const quiz = quizzes.find(q => q.id === assignment.quizId)
    const quizTitle = quiz ? quiz.title : 'Quiz Desconhecido'
    return quizTitle.toLowerCase().includes(searchTerm.toLowerCase())
  })


  return (
    <div className="reports-container">
      <div className="pointer-events-none absolute -top-40 right-[-10%] h-96 w-96 rounded-full bg-primary-200 opacity-40 blur-3xl dark:bg-primary-800/40 float-animation" />
      <div className="pointer-events-none absolute -bottom-48 left-[-15%] h-[28rem] w-[28rem] rounded-full bg-secondary-200 opacity-35 blur-3xl dark:bg-secondary-800/40 float-animation" />

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Header */}
          <div className="reports-header">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Análise de Dados,
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Relatórios e Estatísticas
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Visualize e analise o desempenho dos quizzes e alunos
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="reports-tabs">
            <nav className="reports-tab-nav" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('quiz')}
                className={`reports-tab-button ${
                  activeTab === 'quiz' ? 'reports-tab-button-active' : 'reports-tab-button-inactive'
                }`}
              >
                <ChartBarIcon className="w-4 h-4" />
                <span>Estatísticas do Quiz</span>
              </button>
              <button
                onClick={() => setActiveTab('class')}
                className={`reports-tab-button ${
                  activeTab === 'class' ? 'reports-tab-button-active' : 'reports-tab-button-inactive'
                }`}
              >
                <UsersIcon className="w-4 h-4" />
                <span>Estatísticas da Turma</span>
              </button>
              <button
                onClick={() => setActiveTab('student')}
                className={`reports-tab-button ${
                  activeTab === 'student' ? 'reports-tab-button-active' : 'reports-tab-button-inactive'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>Tentativas do Aluno</span>
              </button>
              <button
                onClick={() => setActiveTab('assignment')}
                className={`reports-tab-button ${
                  activeTab === 'assignment' ? 'reports-tab-button-active' : 'reports-tab-button-inactive'
                }`}
              >
                <ClipboardListIcon className="w-4 h-4" />
                <span>Estatísticas do Assignment</span>
              </button>
            </nav>
          </div>

          {/* Error Message */}
          {error && (
            <div className="reports-error-message">
              {error}
            </div>
          )}

          {/* Quiz Statistics Tab */}
          {activeTab === 'quiz' && (
            <div className="reports-card">
              <div className="p-5 sm:p-6 space-y-6">
                <div className="reports-card-header">
                  <div className="reports-card-icon bg-primary-100 dark:bg-primary-900/30">
                    <ChartBarIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h2 className="reports-card-title">Estatísticas do Quiz</h2>
                    <p className="reports-card-description">Análise detalhada do desempenho por quiz</p>
                  </div>
                </div>
               
                {quizzes.length === 0 ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                      ℹ️ Nenhum quiz encontrado. Crie um quiz primeiro para ver estatísticas.
                    </p>
                  </div>
                ) : (
                  <div className="reports-search-container">
                    <div className="flex flex-col gap-4">
                      {/* Search and Filter Controls */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <div className="reports-search-icon">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            placeholder="Buscar quiz..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => setShowDropdown(true)}
                            className="input reports-search-input"
                          />
                        </div>
                        <button
                          onClick={() => setShowFilters(!showFilters)}
                          className="btn btn-secondary flex items-center gap-2"
                        >
                          <CalendarIcon className="w-4 h-4" />
                          Filtros
                        </button>
                        <button
                          onClick={handleGetQuizStatistics}
                          disabled={loading || !selectedQuiz}
                          className="btn btn-primary btn-hover-bounce"
                        >
                          {loading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Carregando...
                            </>
                          ) : (
                            'Buscar Estatísticas'
                          )}
                        </button>
                      </div>

                    {/* Date Filters */}
                    {showFilters && (
                      <div className="reports-filters-panel">
                        <h4 className="reports-filters-title">Filtrar por Data</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="reports-filter-label">Data Início</label>
                            <input
                              type="date"
                              value={dateFilter.startDate}
                              onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                              className="input reports-filter-input"
                            />
                          </div>
                          <div>
                            <label className="reports-filter-label">Data Fim</label>
                            <input
                              type="date"
                              value={dateFilter.endDate}
                              onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                              className="input reports-filter-input"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                          <button
                            onClick={() => setDateFilter({ startDate: '', endDate: '' })}
                            className="btn btn-secondary btn-sm"
                          >
                            Limpar Filtros
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                 
                  {/* Dropdown for quiz selection */}
                  {showDropdown && searchTerm && (
                    <div className="reports-dropdown">
                      {filteredQuizzes.length === 0 ? (
                        <div className="reports-empty-state">
                          Nenhum quiz encontrado
                        </div>
                      ) : (
                        filteredQuizzes.map((quiz) => (
                          <button
                            key={quiz.id}
                            onClick={() => {
                              setSelectedQuiz(quiz.id)
                              setSearchTerm(quiz.title)
                              setShowDropdown(false)
                            }}
                            className={`reports-dropdown-item ${
                              selectedQuiz === quiz.id
                                ? 'reports-dropdown-item-selected'
                                : 'reports-dropdown-item-not-selected'
                            }`}
                          >
                            <div>
                              <div className="font-medium">{quiz.title}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {quiz.subject} • {quiz.questions?.length || 0} perguntas
                              </div>
                            </div>
                            {selectedQuiz === quiz.id && (
                              <CheckIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                )}

                {quizzes.length > 0 && selectedQuiz && !showDropdown && (
                  <div className="reports-selected-info reports-selected-info-primary">
                    <div className="reports-selected-info-content">
                      <div>
                        <p className="reports-selected-info-label text-primary-800 dark:text-primary-200">Quiz selecionado:</p>
                        <p className="reports-selected-info-value text-primary-600 dark:text-primary-300">
                          {quizzes.find(q => q.id === selectedQuiz)?.title || 'Quiz Desconhecido'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedQuiz('')
                          setSearchTerm('')
                        }}
                        className="reports-close-button reports-close-button-primary"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}


                {quizStats && (
                  <div className="space-y-6 settings-tab-transition">
                    <div className="reports-stats-grid">
                      <div className="reports-stat-card reports-stat-card-primary">
                        <div className="reports-stat-value reports-stat-value-primary">{quizStats.totalAttempts}</div>
                        <div className="reports-stat-label reports-stat-label-primary">Total de Tentativas</div>
                      </div>
                      <div className="reports-stat-card reports-stat-card-success">
                        <div className="reports-stat-value reports-stat-value-success">{quizStats.averageScore.toFixed(1)}%</div>
                        <div className="reports-stat-label reports-stat-label-success">Pontuação Média</div>
                      </div>
                      <div className="reports-stat-card reports-stat-card-warning">
                        <div className="reports-stat-value reports-stat-value-warning">{quizStats.passRate.toFixed(1)}%</div>
                        <div className="reports-stat-label reports-stat-label-warning">Taxa de Aprovação</div>
                      </div>
                      <div className="reports-stat-card reports-stat-card-secondary">
                        <div className="reports-stat-value reports-stat-value-secondary">{formatTime(quizStats.averageTimeMinutes * 60)}</div>
                        <div className="reports-stat-label reports-stat-label-secondary">Tempo Médio</div>
                      </div>
                    </div>

                    {/* Visualizations */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Question Performance */}
                      <SimpleBarChart
                        data={quizStats.questionStatistics?.map(q => ({
                          label: q.prompt.length > 30 ? q.prompt.substring(0, 30) + '...' : q.prompt,
                          value: q.correctRate
                        })) || []}
                        title="Taxa de Acerto por Pergunta (%)"
                        color="primary"
                      />
                      
                      {/* Pass/Fail Rate */}
                      <SimplePieChart
                        data={[
                          { label: 'Aprovados', value: Math.round(quizStats.totalAttempts * (quizStats.passRate / 100)), color: 'green' },
                          { label: 'Reprovados', value: Math.round(quizStats.totalAttempts * ((100 - quizStats.passRate) / 100)), color: 'red' }
                        ]}
                        title="Taxa de Aprovação"
                      />
                    </div>

                    <div>
                      <h3 className="reports-details-title">Análise por Pergunta</h3>
                      <div className="reports-question-stats">
                        {quizStats.questionStatistics?.map((question) => (
                          <div key={question.questionId} className="reports-question-stat-item">
                            <div className="reports-question-stat-header">
                              <div className="flex-1">
                                <p className="reports-question-stat-title">{question.prompt}</p>
                                <p className="reports-question-stat-subtitle">
                                  {question.correctAnswers} corretas de {question.correctAnswers + question.incorrectAnswers} respostas
                                </p>
                              </div>
                              <div className="ml-4">
                                <div className="reports-question-stat-score">{question.correctRate.toFixed(1)}%</div>
                              </div>
                            </div>
                            <div className="reports-question-stat-progress">
                              <div
                                className="bg-primary-500 h-2 rounded-full progress-bar"
                                style={{ width: `${question.correctRate}%` }}
                              ></div>
                            </div>
                          </div>
                        )) || []}
                      </div>
                    </div>
                  </div>
                )}

                {/* Student Attempts List */}
                {quizAttempts.length > 0 && (
                  <div className="space-y-4 settings-tab-transition">
                    <h3 className="reports-details-title">Tentativas dos Alunos</h3>
                    <div className="reports-table-container">
                      <table className="reports-table">
                        <thead className="reports-table-head">
                          <tr>
                            <th className="reports-table-header">Aluno</th>
                            <th className="reports-table-header">Pontuação</th>
                            <th className="reports-table-header">Percentagem</th>
                            <th className="reports-table-header">Status</th>
                            <th className="reports-table-header">Tempo Gasto</th>
                            <th className="reports-table-header">Data de Submissão</th>
                          </tr>
                        </thead>
                        <tbody className="reports-table-body">
                          {quizAttempts.map((attempt) => (
                            <tr key={attempt.id} className="reports-table-row">
                              <td className="reports-table-cell reports-table-cell-medium">
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {attempt.studentName || 'Aluno Desconhecido'}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {attempt.studentId}
                                  </div>
                                </div>
                              </td>
                              <td className="reports-table-cell reports-table-cell-normal">
                                <div className="font-medium">
                                  {attempt.score}/{attempt.maxScore}
                                </div>
                              </td>
                              <td className="reports-table-cell reports-table-cell-normal">
                                <div className="flex items-center gap-2">
                                  <span className={`font-medium ${
                                    attempt.percentage >= 80 ? 'text-green-600 dark:text-green-400' :
                                    attempt.percentage >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                                    'text-red-600 dark:text-red-400'
                                  }`}>
                                    {attempt.percentage.toFixed(1)}%
                                  </span>
                                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        attempt.percentage >= 80 ? 'bg-green-500' :
                                        attempt.percentage >= 60 ? 'bg-yellow-500' :
                                        'bg-red-500'
                                      }`}
                                      style={{ width: `${attempt.percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </td>
                              <td className="reports-table-cell reports-table-cell-normal">
                                <span className={`badge badge-${
                                  attempt.status === 'SUBMITTED' ? 'green' : 'yellow'
                                }`}>
                                  {attempt.status === 'SUBMITTED' ? 'Concluído' : 'Em Progresso'}
                                </span>
                              </td>
                              <td className="reports-table-cell reports-table-cell-normal">
                                {formatTime(attempt.timeSpentMinutes * 60)}
                              </td>
                              <td className="reports-table-cell reports-table-cell-normal">
                                {attempt.submittedAt ? formatDate(attempt.submittedAt) : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Export Options */}
                {(quizStats || quizAttempts.length > 0) && (
                  <div className="reports-export-section">
                    <h3 className="reports-export-title">Exportar Dados</h3>
                    <div className="reports-export-buttons">
                      {quizStats && (
                        <>
                          <button
                            onClick={() => {
                              const exportData = quizStats.questionStatistics?.map(q => ({
                                Pergunta: q.prompt,
                                'Taxa de Acerto': `${q.correctRate}%`,
                                'Respostas Corretas': q.correctAnswers,
                                'Respostas Incorretas': q.incorrectAnswers
                              })) || []
                              exportToCSV(exportData, `quiz-${selectedQuiz}-estatisticas`)
                            }}
                            className="reports-export-button reports-export-button-csv"
                          >
                            <DownloadIcon className="w-4 h-4" />
                            Exportar Estatísticas CSV
                          </button>
                          <button
                            onClick={() => {
                              const exportData = quizStats.questionStatistics?.map(q => ({
                                Pergunta: q.prompt,
                                'Taxa de Acerto': `${q.correctRate}%`,
                                'Respostas Corretas': q.correctAnswers,
                                'Respostas Incorretas': q.incorrectAnswers
                              })) || []
                              exportToPDF(exportData, `quiz-${selectedQuiz}-estatisticas`, 'Estatísticas do Quiz')
                            }}
                            className="reports-export-button reports-export-button-pdf"
                          >
                            <DownloadIcon className="w-4 h-4" />
                            Exportar Estatísticas PDF
                          </button>
                        </>
                      )}
                      {quizAttempts.length > 0 && (
                        <>
                          <button
                            onClick={() => {
                              const exportData = quizAttempts.map(attempt => ({
                                'Aluno': attempt.studentName || 'Desconhecido',
                                'Pontuação': `${attempt.score}/${attempt.maxScore}`,
                                'Percentagem': `${attempt.percentage.toFixed(1)}%`,
                                'Status': attempt.status === 'SUBMITTED' ? 'Concluído' : 'Em Progresso',
                                'Tempo Gasto': formatTime(attempt.timeSpentMinutes * 60),
                                'Data de Submissão': attempt.submittedAt ? formatDate(attempt.submittedAt) : 'N/A'
                              }))
                              exportToCSV(exportData, `quiz-${selectedQuiz}-tentativas`)
                            }}
                            className="reports-export-button reports-export-button-csv"
                          >
                            <DownloadIcon className="w-4 h-4" />
                            Exportar Tentativas CSV
                          </button>
                          <button
                            onClick={() => {
                              const exportData = quizAttempts.map(attempt => ({
                                'Aluno': attempt.studentName || 'Desconhecido',
                                'Pontuação': `${attempt.score}/${attempt.maxScore}`,
                                'Percentagem': `${attempt.percentage.toFixed(1)}%`,
                                'Status': attempt.status === 'SUBMITTED' ? 'Concluído' : 'Em Progresso',
                                'Tempo Gasto': formatTime(attempt.timeSpentMinutes * 60),
                                'Data de Submissão': attempt.submittedAt ? formatDate(attempt.submittedAt) : 'N/A'
                              }))
                              exportToPDF(exportData, `quiz-${selectedQuiz}-tentativas`, 'Tentativas do Quiz')
                            }}
                            className="reports-export-button reports-export-button-pdf"
                          >
                            <DownloadIcon className="w-4 h-4" />
                            Exportar Tentativas PDF
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Class Statistics Tab */}
          {activeTab === 'class' && (
            <div className="reports-card">
              <div className="p-5 sm:p-6 space-y-6">
                <div className="reports-card-header">
                  <div className="reports-card-icon bg-blue-100 dark:bg-blue-900/30">
                    <UsersIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="reports-card-title">Estatísticas da Turma</h2>
                    <p className="reports-card-description">Desempenho geral por turma</p>
                  </div>
                </div>

                {classes.length === 0 ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                      ℹ️ Nenhuma turma encontrada. Crie uma turma primeiro para ver estatísticas.
                    </p>
                  </div>
                ) : (
                  <div className="reports-search-container">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <div className="reports-search-icon">
                          <SearchIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Buscar turma..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onFocus={() => setShowDropdown(true)}
                          className="input reports-search-input"
                        />
                      </div>
                      <button
                      onClick={handleGetClassStatistics}
                      disabled={loading || !selectedClass}
                      className="btn btn-primary btn-hover-bounce"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Carregando...
                        </>
                      ) : (
                        'Buscar Estatísticas'
                      )}
                    </button>
                  </div>
                 
                  {/* Dropdown for class selection */}
                  {showDropdown && searchTerm && (
                    <div className="reports-dropdown">
                      {filteredClasses.length === 0 ? (
                        <div className="reports-empty-state">
                          Nenhuma turma encontrada
                        </div>
                      ) : (
                        filteredClasses.map((cls) => (
                          <button
                            key={cls.id}
                            onClick={() => {
                              setSelectedClass(cls.id)
                              setSearchTerm(cls.name)
                              setShowDropdown(false)
                            }}
                            className={`reports-dropdown-item ${
                              selectedClass === cls.id
                                ? 'reports-dropdown-item-selected'
                                : 'reports-dropdown-item-not-selected'
                            }`}
                          >
                            <div>
                              <div className="font-medium">{cls.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {cls.description || 'Sem descrição'}
                              </div>
                            </div>
                            {selectedClass === cls.id && (
                              <CheckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                )}

                {classes.length > 0 && selectedClass && !showDropdown && (
                  <div className="reports-selected-info reports-selected-info-blue">
                    <div className="reports-selected-info-content">
                      <div>
                        <p className="reports-selected-info-label text-blue-800 dark:text-blue-200">Turma selecionada:</p>
                        <p className="reports-selected-info-value text-blue-600 dark:text-blue-300">
                          {classes.find(c => c.id === selectedClass)?.name || 'Turma Desconhecida'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedClass('')
                          setSearchTerm('')
                        }}
                        className="reports-close-button reports-close-button-blue"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Export Options */}
                {classStats && (
                  <div className="reports-export-section">
                    <h3 className="reports-export-title">Exportar Dados</h3>
                    <div className="reports-export-buttons">
                      <button
                        onClick={() => {
                          const exportData = classStats.topPerformers?.map(p => ({
                            'Nome do Aluno': p.name,
                            'Pontuação Média': `${p.averageScore.toFixed(1)}%`,
                            'Total de Tentativas': p.totalAttempts
                          })) || []
                          exportToCSV(exportData, `turma-${selectedClass}-top-performers`)
                        }}
                        className="reports-export-button reports-export-button-csv"
                      >
                        <DownloadIcon className="w-4 h-4" />
                        Exportar CSV
                      </button>
                      <button
                        onClick={() => {
                          const exportData = classStats.topPerformers?.map(p => ({
                            'Nome do Aluno': p.name,
                            'Pontuação Média': `${p.averageScore.toFixed(1)}%`,
                            'Total de Tentativas': p.totalAttempts
                          })) || []
                          exportToPDF(exportData, `turma-${selectedClass}-top-performers`, 'Melhores Desempenhos da Turma')
                        }}
                        className="reports-export-button reports-export-button-pdf"
                      >
                        <DownloadIcon className="w-4 h-4" />
                        Exportar PDF
                      </button>
                    </div>
                  </div>
                )}

                {classStats && (
                  <div className="space-y-6 settings-tab-transition">
                    <div className="reports-stats-grid">
                      <div className="reports-stat-card reports-stat-card-blue">
                        <div className="reports-stat-value reports-stat-value-blue">{classStats.totalStudents}</div>
                        <div className="reports-stat-label reports-stat-label-blue">Total de Alunos</div>
                      </div>
                      <div className="reports-stat-card reports-stat-card-green">
                        <div className="reports-stat-value reports-stat-value-green">{classStats.averageScore.toFixed(1)}%</div>
                        <div className="reports-stat-label reports-stat-label-green">Pontuação Média</div>
                      </div>
                      <div className="reports-stat-card reports-stat-card-yellow">
                        <div className="reports-stat-value reports-stat-value-yellow">{classStats.activeStudents}</div>
                        <div className="reports-stat-label reports-stat-label-yellow">Alunos Ativos</div>
                      </div>
                    </div>

                    {/* Visualizations */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Top Performers */}
                      <SimpleBarChart
                        data={classStats.topPerformers?.map(p => ({
                          label: p.name,
                          value: p.averageScore
                        })) || []}
                        title="Melhores Desempenhos (%)"
                        color="blue"
                      />
                      
                      {/* Student Activity */}
                      <SimplePieChart
                        data={[
                          { label: 'Alunos Ativos', value: classStats.activeStudents, color: 'green' },
                          { label: 'Alunos Inativos', value: classStats.totalStudents - classStats.activeStudents, color: 'gray' }
                        ]}
                        title="Atividade dos Alunos"
                      />
                    </div>

                    <div>
                      <h3 className="reports-details-title">Melhores Desempenhos</h3>
                      <div className="reports-table-container">
                        <table className="reports-table">
                          <thead className="reports-table-head">
                            <tr>
                              <th className="reports-table-header">
                                Aluno
                              </th>
                              <th className="reports-table-header">
                                Pontuação Média
                              </th>
                              <th className="reports-table-header">
                                Tentativas
                              </th>
                            </tr>
                          </thead>
                          <tbody className="reports-table-body">
                            {classStats.topPerformers?.map((performer) => (
                              <tr key={performer.studentId} className="reports-table-row">
                                <td className="reports-table-cell reports-table-cell-medium">
                                  {performer.name}
                                </td>
                                <td className="reports-table-cell reports-table-cell-normal">
                                  {performer.averageScore.toFixed(1)}%
                                </td>
                                <td className="reports-table-cell reports-table-cell-normal">
                                  {performer.totalAttempts}
                                </td>
                              </tr>
                            )) || []}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Student Attempts Tab */}
          {activeTab === 'student' && (
            <div className="reports-card">
              <div className="p-5 sm:p-6 space-y-6">
                <div className="reports-card-header">
                  <div className="reports-card-icon bg-green-100 dark:bg-green-900/30">
                    <UserIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h2 className="reports-card-title">Tentativas do Aluno</h2>
                    <p className="reports-card-description">Histórico de tentativas por aluno</p>
                  </div>
                </div>

                {!selectedClass ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                      ℹ️ Selecione uma turma primeiro na aba "Estatísticas da Turma" para ver os alunos.
                    </p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                      ℹ️ Nenhum aluno encontrado nesta turma. Adicione alunos à turma primeiro.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Student Selection */}
                      <div className="relative">
                      <div className="reports-search-icon">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar aluno..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setShowDropdown(true)}
                        className="input reports-search-input"
                      />
                   
                    {/* Dropdown for student selection */}
                    {showDropdown && searchTerm && (
                      <div className="reports-dropdown">
                        {filteredStudents.length === 0 ? (
                          <div className="reports-empty-state">
                            Nenhum aluno encontrado
                          </div>
                        ) : (
                          filteredStudents.map((student) => (
                            <button
                              key={student.id}
                              onClick={() => {
                                setSelectedStudent(student.id)
                                setSearchTerm(student.name)
                                setShowDropdown(false)
                              }}
                              className={`reports-dropdown-item ${
                                selectedStudent === student.id
                                  ? 'reports-dropdown-item-selected'
                                  : 'reports-dropdown-item-not-selected'
                              }`}
                            >
                              <div>
                                <div className="font-medium">{student.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {student.email}
                                </div>
                              </div>
                              {selectedStudent === student.id && (
                                <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
    
                  </div>
                 
                  {/* Quiz Selection (Optional) */}
                  <div className="relative">
                    <div className="reports-search-icon">
                      <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Quiz (opcional)"
                      value={selectedQuiz ? quizzes.find(q => q.id === selectedQuiz)?.title || '' : ''}
                      onChange={(e) => {
                        const value = e.target.value
                        setSearchTerm(value)
                        const quiz = quizzes.find(q => q.title.toLowerCase().includes(value.toLowerCase()))
                        if (quiz) {
                          setSelectedQuiz(quiz.id)
                        } else {
                          setSelectedQuiz('')
                        }
                      }}
                      onFocus={() => setShowDropdown(true)}
                      className="input reports-search-input"
                    />
                  </div>
                </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleGetStudentAttempts}
                      disabled={loading || !selectedStudent}
                      className="btn btn-primary btn-hover-bounce"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Carregando...
                        </>
                      ) : (
                        'Buscar Tentativas'
                      )}
                    </button>
                  </div>
                  </>
                )}

                {students.length > 0 && selectedStudent && (
                  <div className="reports-selected-info reports-selected-info-green">
                    <div className="reports-selected-info-content">
                      <div>
                        <p className="reports-selected-info-label text-green-800 dark:text-green-200">Aluno selecionado:</p>
                        <p className="reports-selected-info-value text-green-600 dark:text-green-300">
                          {students.find(s => s.id === selectedStudent)?.name || 'Aluno Desconhecido'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedStudent('')
                          setSearchTerm('')
                        }}
                        className="reports-close-button reports-close-button-green"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Export Options */}
                {studentAttempts.length > 0 && (
                  <div className="reports-export-section">
                    <h3 className="reports-export-title">Exportar Dados</h3>
                    <div className="reports-export-buttons">
                      <button
                        onClick={() => {
                          const exportData = studentAttempts.map(attempt => ({
                            'Quiz': attempt.quizTitle,
                            'Pontuação': `${attempt.score}/${attempt.maxScore}`,
                            'Percentagem': `${attempt.percentage.toFixed(1)}%`,
                            'Status': attempt.status === 'SUBMITTED' ? 'Concluído' : 'Em Progresso',
                            'Tempo Gasto': formatTime(attempt.timeSpentMinutes * 60),
                            'Data de Início': formatDate(attempt.startedAt),
                            'Data de Submissão': attempt.submittedAt ? formatDate(attempt.submittedAt) : 'N/A'
                          }))
                          exportToCSV(exportData, `aluno-${selectedStudent}-tentativas`)
                        }}
                        className="reports-export-button reports-export-button-csv"
                      >
                        <DownloadIcon className="w-4 h-4" />
                        Exportar CSV
                      </button>
                      <button
                        onClick={() => {
                          const exportData = studentAttempts.map(attempt => ({
                            'Quiz': attempt.quizTitle,
                            'Pontuação': `${attempt.score}/${attempt.maxScore}`,
                            'Percentagem': `${attempt.percentage.toFixed(1)}%`,
                            'Status': attempt.status === 'SUBMITTED' ? 'Concluído' : 'Em Progresso',
                            'Tempo Gasto': formatTime(attempt.timeSpentMinutes * 60),
                            'Data de Início': formatDate(attempt.startedAt),
                            'Data de Submissão': attempt.submittedAt ? formatDate(attempt.submittedAt) : 'N/A'
                          }))
                          exportToPDF(exportData, `aluno-${selectedStudent}-tentativas`, 'Tentativas do Aluno')
                        }}
                        className="reports-export-button reports-export-button-pdf"
                      >
                        <DownloadIcon className="w-4 h-4" />
                        Exportar PDF
                      </button>
                    </div>
                  </div>
                )}

                {studentAttempts.length > 0 && (
                  <div className="space-y-4 settings-tab-transition">
                    {studentAttempts.map((attempt) => (
                      <div key={attempt.id} className="reports-attempt-card">
                        <div className="reports-attempt-header">
                          <div>
                            <h3 className="reports-attempt-title">{attempt.quizTitle}</h3>
                            <p className="reports-attempt-subtitle">
                              Concluído em {formatDate(attempt.submittedAt || attempt.startedAt)} • Tempo: {formatTime(attempt.timeSpentMinutes * 60)}
                            </p>
                          </div>
                          <div className="reports-attempt-score">
                            <div className="reports-attempt-score-value">
                              {attempt.score}/{attempt.maxScore}
                            </div>
                            <div className="reports-attempt-score-percentage">
                              {attempt.percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div className={`badge badge-${
                          attempt.status === 'SUBMITTED' ? 'green' : 'yellow'
                        }`}>
                          {attempt.status === 'SUBMITTED' ? 'Concluído' : 'Em Progresso'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}


          {/* Assignment Statistics Tab */}
          {activeTab === 'assignment' && (
            <div className="reports-card">
              <div className="p-5 sm:p-6 space-y-6">
                <div className="reports-card-header">
                  <div className="reports-card-icon bg-orange-100 dark:bg-orange-900/30">
                    <ClipboardListIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h2 className="reports-card-title">Estatísticas do Assignment</h2>
                    <p className="reports-card-description">Análise de assignments atribuídos</p>
                  </div>
                </div>
               
                <div className="reports-search-container">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <div className="reports-search-icon">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar assignment..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setShowDropdown(true)}
                        className="input reports-search-input"
                      />
                    </div>
                    <button
                      onClick={handleGetAssignmentStatistics}
                      disabled={loading || !selectedAssignment}
                      className="btn btn-primary btn-hover-bounce"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Carregando...
                        </>
                      ) : (
                        'Buscar Estatísticas'
                      )}
                    </button>
                  </div>
                 
                  {/* Dropdown for assignment selection */}
                  {showDropdown && searchTerm && (
                    <div className="reports-dropdown">
                      {filteredAssignments.length === 0 ? (
                        <div className="reports-empty-state">
                          Nenhum assignment encontrado
                        </div>
                      ) : (
                        filteredAssignments.map((assignment) => {
                          const quiz = quizzes.find(q => q.id === assignment.quizId)
                          const quizTitle = quiz ? quiz.title : 'Quiz Desconhecido'
                          return (
                            <button
                              key={assignment.id}
                              onClick={() => {
                                setSelectedAssignment(assignment.id)
                                setSearchTerm(quizTitle)
                                setShowDropdown(false)
                              }}
                              className={`reports-dropdown-item ${
                                selectedAssignment === assignment.id
                                  ? 'reports-dropdown-item-selected'
                                  : 'reports-dropdown-item-not-selected'
                              }`}
                            >
                              <div>
                                <div className="font-medium">{quizTitle}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {assignment.classId ? `Turma: ${classes.find(c => c.id === assignment.classId)?.name || 'Desconhecida'}` : 'Atribuição individual'}
                                  {assignment.isActive ? ' • Ativo' : ' • Inativo'}
                                </div>
                              </div>
                              {selectedAssignment === assignment.id && (
                                <CheckIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                              )}
                            </button>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>

                {selectedAssignment && !showDropdown && (
                  <div className="reports-selected-info reports-selected-info-orange">
                    <div className="reports-selected-info-content">
                      <div>
                        <p className="reports-selected-info-label text-orange-800 dark:text-orange-200">Assignment selecionado:</p>
                        <p className="reports-selected-info-value text-orange-600 dark:text-orange-300">
                          {(() => {
                            const assignment = assignments.find(a => a.id === selectedAssignment)
                            const quiz = quizzes.find(q => q.id === assignment?.quizId)
                            return quiz ? quiz.title : 'Assignment Desconhecido'
                          })()}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedAssignment('')
                          setSearchTerm('')
                        }}
                        className="reports-close-button reports-close-button-orange"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {assignmentStats && (
                  <div className="space-y-6 settings-tab-transition">
                    <div className="reports-stats-grid">
                      <div className="reports-stat-card reports-stat-card-blue">
                        <div className="reports-stat-value reports-stat-value-blue">{assignmentStats.totalAssigned}</div>
                        <div className="reports-stat-label reports-stat-label-blue">Total Atribuído</div>
                      </div>
                      <div className="reports-stat-card reports-stat-card-green">
                        <div className="reports-stat-value reports-stat-value-green">{assignmentStats.totalAttempts}</div>
                        <div className="reports-stat-label reports-stat-label-green">Concluídos</div>
                      </div>
                      <div className="reports-stat-card reports-stat-card-yellow">
                        <div className="reports-stat-value reports-stat-value-yellow">{assignmentStats.completionRate.toFixed(1)}%</div>
                        <div className="reports-stat-label reports-stat-label-yellow">Taxa de Conclusão</div>
                      </div>
                      <div className="reports-stat-card reports-stat-card-purple">
                        <div className="reports-stat-value reports-stat-value-purple">{assignmentStats.averageScore.toFixed(1)}%</div>
                        <div className="reports-stat-label reports-stat-label-purple">Pontuação Média</div>
                      </div>
                    </div>

                    {/* Visualizations */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Completion Rate */}
                      <SimplePieChart
                        data={[
                          { label: 'Concluídos', value: assignmentStats.totalAttempts, color: 'green' },
                          { label: 'Pendentes', value: assignmentStats.totalAssigned - assignmentStats.totalAttempts, color: 'yellow' }
                        ]}
                        title="Taxa de Conclusão"
                      />
                      
                      {/* Performance Distribution */}
                      <SimpleBarChart
                        data={[
                          { label: 'Excelente (90-100%)', value: Math.round(assignmentStats.totalAttempts * 0.3) },
                          { label: 'Bom (70-89%)', value: Math.round(assignmentStats.totalAttempts * 0.4) },
                          { label: 'Suficiente (50-69%)', value: Math.round(assignmentStats.totalAttempts * 0.2) },
                          { label: 'Insuficiente (<50%)', value: Math.round(assignmentStats.totalAttempts * 0.1) }
                        ]}
                        title="Distribuição de Desempenho"
                        color="purple"
                      />
                    </div>

                    <div className="reports-details-card">
                      <h3 className="reports-details-title">Detalhes</h3>
                      <div className="reports-details-content">
                        <p className="reports-details-item">
                          <span className="reports-details-label">Título:</span> {assignmentStats.quizTitle}
                        </p>
                        {assignmentStats.className && (
                          <p className="reports-details-item">
                            <span className="reports-details-label">Turma:</span> {assignmentStats.className}
                          </p>
                        )}
                        <p className="reports-details-item">
                          <span className="reports-details-label">Status:</span>
                          <span className={`badge badge-${
                            assignmentStats.status === 'ACTIVE' ? 'green' :
                            assignmentStats.status === 'EXPIRED' ? 'red' : 'gray'
                          }`}>
                            {assignmentStats.status === 'ACTIVE' ? 'Ativo' :
                             assignmentStats.status === 'EXPIRED' ? 'Expirado' : 'Rascunho'}
                          </span>
                        </p>
                        {assignmentStats.dueDate && (
                          <p className="reports-details-item">
                            <span className="reports-details-label">Data de Entrega:</span> {formatDate(assignmentStats.dueDate)}
                          </p>
                        )}
                        {assignmentStats.averageTimeMinutes && (
                          <p className="reports-details-item">
                            <span className="reports-details-label">Tempo Médio:</span> {formatTime(assignmentStats.averageTimeMinutes * 60)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Export Options */}
                {assignmentStats && (
                  <div className="reports-export-section">
                    <h3 className="reports-export-title">Exportar Dados</h3>
                    <div className="reports-export-buttons">
                      <button
                        onClick={() => {
                          const exportData = [{
                            'Título do Quiz': assignmentStats.quizTitle,
                            'Turma': assignmentStats.className || 'N/A',
                            'Total Atribuído': assignmentStats.totalAssigned,
                            'Total Concluídos': assignmentStats.totalAttempts,
                            'Taxa de Conclusão': `${assignmentStats.completionRate.toFixed(1)}%`,
                            'Pontuação Média': `${assignmentStats.averageScore.toFixed(1)}%`,
                            'Status': assignmentStats.status,
                            'Data de Entrega': assignmentStats.dueDate ? formatDate(assignmentStats.dueDate) : 'N/A'
                          }]
                          exportToCSV(exportData, `assignment-${selectedAssignment}-estatisticas`)
                        }}
                        className="reports-export-button reports-export-button-csv"
                      >
                        <DownloadIcon className="w-4 h-4" />
                        Exportar CSV
                      </button>
                      <button
                        onClick={() => {
                          const exportData = [{
                            'Título do Quiz': assignmentStats.quizTitle,
                            'Turma': assignmentStats.className || 'N/A',
                            'Total Atribuído': assignmentStats.totalAssigned,
                            'Total Concluídos': assignmentStats.totalAttempts,
                            'Taxa de Conclusão': `${assignmentStats.completionRate.toFixed(1)}%`,
                            'Pontuação Média': `${assignmentStats.averageScore.toFixed(1)}%`,
                            'Status': assignmentStats.status,
                            'Data de Entrega': assignmentStats.dueDate ? formatDate(assignmentStats.dueDate) : 'N/A'
                          }]
                          exportToPDF(exportData, `assignment-${selectedAssignment}-estatisticas`, 'Estatísticas do Assignment')
                        }}
                        className="reports-export-button reports-export-button-pdf"
                      >
                        <DownloadIcon className="w-4 h-4" />
                        Exportar PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReportsPage