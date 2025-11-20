import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Home from '../pages/Home'
import Create from '../pages/Create'
import Settings from '../pages/Settings'
import QuizPage from '../pages/Quiz'
import EditQuiz from '../pages/EditQuiz'
import Results from '../pages/Results'
import AuthPage from '../pages/Auth'
import DashboardPage from '../pages/Dashboard'
import Reports from '../pages/Reports'
import Classes from '../pages/Classes'
import Assignments from '../pages/Assignments'
import SharedQuizzes from '../pages/SharedQuizzes'
import StudentProgress from '../pages/StudentProgress'
import AdminUsers from '../pages/AdminUsers'
import { useAuth } from '../lib/auth/AuthContext'

// Componente para página não encontrada
const NotFound = () => (
  <Layout>
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md mx-auto card p-8 text-center">
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2 dark:text-white transition-colors duration-200">Página não encontrada</h1>
        <p className="text-gray-600 mb-6 dark:text-gray-300 transition-colors duration-200">
          A página que está a tentar acessar não existe.
        </p>
        <a
          href="/"
          className="btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar para a página principal
        </a>
      </div>
    </div>
  </Layout>
)

// Protected route component
const ProtectedRoute = ({ children, requiredRoles }: { children: React.ReactNode; requiredRoles?: Array<'TEACHER' | 'STUDENT' | 'ADMIN'> }) => {
  const { isAuthenticated, isLoading, requireRole } = useAuth()
  
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">A verificar sessão...</p>
          </div>
        </div>
      </Layout>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }
  
  if (requiredRoles && requiredRoles.length > 0 && !requireRole(...requiredRoles)) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md dark:bg-yellow-900/20 dark:border-yellow-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Acesso Restrito</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Esta área requer permissões de {requiredRoles.join(' / ')}.
              </p>
              <button
                onClick={() => window.location.href = '/auth'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Iniciar Sessão
              </button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }
  
  return <>{children}</>
}

// Public route component - redirects to appropriate page if already authenticated
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">A verificar sessão...</p>
        </div>
      </div>
    )
  }
  
  if (isAuthenticated) {
    // Redirect based on user role
    switch (user?.role) {
      case 'TEACHER':
      case 'ADMIN':
        return <Navigate to="/dashboard" replace />
      case 'STUDENT':
        return <Navigate to="/" replace />
      default:
        return <Navigate to="/auth" replace />
    }
  }
  
  return <>{children}</>
}

export default function Router() {
  return (
    <Routes>
      {/* Public auth route - redirects if already authenticated */}
      <Route
        path="/auth"
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        }
      />

      {/* Home route - accessible to all authenticated users */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout title="Início"><Home /></Layout>
          </ProtectedRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRoles={['TEACHER', 'ADMIN']}>
            <Layout title="O meu painel"><DashboardPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute requiredRoles={['TEACHER', 'ADMIN']}>
            <Layout title="Relatórios e Estatísticas"><Reports /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes"
        element={
          <ProtectedRoute requiredRoles={['TEACHER', 'ADMIN']}>
            <Layout title="Gestão de Turmas"><Classes /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/assignments"
        element={
          <ProtectedRoute requiredRoles={['TEACHER', 'ADMIN']}>
            <Layout title="Gestão de Assignments"><Assignments /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/shared"
        element={
          <ProtectedRoute requiredRoles={['TEACHER', 'ADMIN']}>
            <Layout title="Quizzes Compartilhados"><SharedQuizzes /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requiredRoles={['ADMIN']}>
            <Layout title="Gestão de contas"><AdminUsers /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/create"
        element={
          <ProtectedRoute requiredRoles={['TEACHER', 'ADMIN']}>
            <Layout showBackButton title="Criar Quiz"><Create /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz/edit/:quizId"
        element={
          <ProtectedRoute requiredRoles={['TEACHER', 'ADMIN']}>
            <Layout showBackButton title="Editar Quiz"><EditQuiz /></Layout>
          </ProtectedRoute>
        }
      />
      
      {/* Student routes */}
      <Route
        path="/quiz/:quizId"
        element={
          <ProtectedRoute requiredRoles={['STUDENT']}>
            <Layout showBackButton title="Quiz"><QuizPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/results"
        element={
          <ProtectedRoute requiredRoles={['STUDENT']}>
            <Layout showBackButton title="Resultados"><Results /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress"
        element={
          <ProtectedRoute requiredRoles={['STUDENT']}>
            <Layout title="Meu Progresso"><StudentProgress /></Layout>
          </ProtectedRoute>
        }
      />
      
      {/* Shared routes (both teacher and student) */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout title="Configurações"><Settings /></Layout>
          </ProtectedRoute>
        }
      />
      
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  )
}
