import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import DarkModeToggle from './DarkModeToggle'
import { useAuth } from '../lib/auth/AuthContext'

interface LayoutProps {
  children: React.ReactNode
  showBackButton?: boolean
  title?: string
  subtitle?: string
}

// SVG Icon Components
const HomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const PlusCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const Cog6ToothIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572-1.065c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const AcademicCapIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-1.05.174v-4.102l1.69-.723z" />
  </svg>
)

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

const ChartIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

export default function Layout({ children, showBackButton, title, subtitle }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()

  const isActive = (path: string) => location.pathname === path

  const isQuizPage =
    location.pathname.startsWith('/quiz/') && !location.pathname.includes('/edit')
  const isResultsPage = location.pathname === '/results'
  const isAuthPage = location.pathname === '/auth'

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/auth')
    }
  }


  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-50 transition-colors duration-200 dark:bg-gray-900 page-transition-enter-active">
      <div className="pointer-events-none absolute -top-40 right-[-10%] h-96 w-96 rounded-full bg-primary-200 opacity-40 blur-3xl dark:bg-primary-800/40 float-animation" />
      <div className="pointer-events-none absolute -bottom-48 left-[-15%] h-[28rem] w-[28rem] rounded-full bg-secondary-200 opacity-35 blur-3xl dark:bg-secondary-800/40 float-animation" />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/80 shadow-sm backdrop-blur supports-[backdrop-filter]:backdrop-blur-md transition-colors duration-200 dark:border-gray-700/60 dark:bg-gray-900/70 slide-in-top-fade">
          <div className="container">
            <div className="flex items-center justify-between h-16">
              {/* Left side - Logo/Back button and Title */}
              <div className="flex items-center space-x-4">
                {showBackButton ? (
                  <Link to="/" className="btn-hover-bounce btn-ghost">
                    <ArrowLeftIcon className="w-5 h-5" />
                    Voltar
                  </Link>
                ) : (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-sm">
                      <AcademicCapIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        Quiz com IA
                      </h1>
                      <p className="text-sm text-gray-600 hidden sm:block dark:text-gray-400">
                        Crie quizzes inteligentes
                      </p>
                    </div>
                  </div>
                )}

                {title && (
                  <div className="hidden sm:block">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {showBackButton && <span className="mr-2">/</span>}
                      {title}
                    </div>
                    {subtitle && (
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {subtitle}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right side - Navigation + Auth */}
              <div className="flex items-center space-x-2">
                {!isAuthPage && !showBackButton && !isQuizPage && !isResultsPage && (
                  <nav className="flex items-center space-x-1">
                    <Link
                      to="/"
                      className={`btn-hover-bounce nav-link ${
                        isActive('/') ? 'nav-link-active' : ''
                      }`}
                    >
                      <HomeIcon className="w-5 h-5" />
                      <span className="hidden sm:inline ml-2">Início</span>
                    </Link>
                    {/* Only show Create link for teachers and admins */}
                    {user && (user.role === 'TEACHER' || user.role === 'ADMIN') && (
                      <Link
                        to="/create"
                        className={`btn-hover-bounce nav-link ${
                          isActive('/create') ? 'nav-link-active' : ''
                        }`}
                      >
                        <PlusCircleIcon className="w-5 h-5" />
                        <span className="hidden sm:inline ml-2">Criar</span>
                      </Link>
                    )}
                    {/* Only show Settings link for teachers and admins */}
                    {user && (user.role === 'TEACHER' || user.role === 'ADMIN') && (
                      <Link
                        to="/settings"
                        className={`btn-hover-bounce nav-link ${
                          isActive('/settings') ? 'nav-link-active' : ''
                        }`}
                      >
                        <Cog6ToothIcon className="w-5 h-5" />
                        <span className="hidden sm:inline ml-2">Config</span>
                      </Link>
                    )}
                    {/* Only show Dashboard link for teachers and admins */}
                    {user && (user.role === 'TEACHER' || user.role === 'ADMIN') && (
                      <Link
                        to="/dashboard"
                        className={`btn-hover-bounce nav-link ${
                          isActive('/dashboard') ? 'nav-link-active' : ''
                        }`}
                      >
                        <HomeIcon className="w-5 h-5" />
                        <span className="hidden sm:inline ml-2">Painel</span>
                      </Link>
                    )}
                    {/* Only show Progress link for students */}
                    {user && user.role === 'STUDENT' && (
                      <Link
                        to="/progress"
                        className={`btn-hover-bounce nav-link ${
                          isActive('/progress') ? 'nav-link-active' : ''
                        }`}
                      >
                        <ChartIcon className="w-5 h-5" />
                        <span className="hidden sm:inline ml-2">Progresso</span>
                      </Link>
                    )}
                  </nav>
                )}

                {(isQuizPage || isResultsPage) && (
                  <div className="flex items-center space-x-2">
                    <button className="btn-ghost">
                      <Cog6ToothIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* Dark mode toggle always visible */}
                <DarkModeToggle />

                {/* Auth CTA / User info */}
                {!isAuthPage && !isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => navigate('/auth')}
                    className="ml-1 inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-medium text-gray-800 bg-primary-100 hover:bg-primary-200 border border-primary-300 transition-all dark:bg-primary-900 dark:text-primary-100 dark:border-primary-700"
                  >
                    Entrar
                  </button>
                )}

                {!isAuthPage && isAuthenticated && user && (
                  <div className="flex items-center space-x-2">
                    <div className="hidden sm:flex flex-col items-end leading-tight">
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100 max-w-[120px] truncate">
                        {user.name || user.email}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          user.role === 'ADMIN'
                            ? 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
                            : user.role === 'TEACHER'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
                            : 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full mr-1 animate-pulse ${
                            user.role === 'ADMIN'
                              ? 'bg-red-500'
                              : user.role === 'TEACHER'
                              ? 'bg-blue-500'
                              : 'bg-green-500'
                          }"></span>
                          {user.role === 'ADMIN' ? 'Administrador' : user.role === 'TEACHER' ? 'Professor' : 'Estudante'}
                        </span>
                      </div>
                    </div>
                    <div className="relative group">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg border-2 border-white dark:border-gray-800">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"></div>
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user.name || user.email}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                        <div className="p-2">
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 5V4C12 3.44772 11.5523 3 11 3H5C4.44772 3 4 3.44772 4 4V20C4 20.5523 4.44772 21 5 21H11C11.5523 21 12 20.5523 12 20V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Terminar sessão
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      
      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Mobile bottom navigation */}
      {!showBackButton && !isQuizPage && !isResultsPage && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200 slide-in-bottom-fade">
          <div className={`grid h-16 ${user && (user.role === 'TEACHER' || user.role === 'ADMIN') ? 'grid-cols-3' : user && user.role === 'STUDENT' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <Link
              to="/"
              className={`btn-hover-bounce mobile-nav-link ${isActive('/') ? 'mobile-nav-link-active' : ''}`}
            >
              <HomeIcon className="w-6 h-6" />
              <span className="text-xs mt-1">Início</span>
            </Link>
            {/* Only show Create link for teachers and admins */}
            {user && (user.role === 'TEACHER' || user.role === 'ADMIN') && (
              <Link
                to="/create"
                className={`btn-hover-bounce mobile-nav-link ${isActive('/create') ? 'mobile-nav-link-active' : ''}`}
              >
                <PlusCircleIcon className="w-6 h-6" />
                <span className="text-xs mt-1">Criar</span>
              </Link>
            )}
            {/* Only show Settings link for teachers and admins */}
            {user && (user.role === 'TEACHER' || user.role === 'ADMIN') && (
              <Link
                to="/settings"
                className={`btn-hover-bounce mobile-nav-link ${isActive('/settings') ? 'mobile-nav-link-active' : ''}`}
              >
                <Cog6ToothIcon className="w-6 h-6" />
                <span className="text-xs mt-1">Config</span>
              </Link>
            )}
            {/* Only show Progress link for students */}
            {user && user.role === 'STUDENT' && (
              <Link
                to="/progress"
                className={`btn-hover-bounce mobile-nav-link ${isActive('/progress') ? 'mobile-nav-link-active' : ''}`}
              >
                <ChartIcon className="w-6 h-6" />
                <span className="text-xs mt-1">Progresso</span>
              </Link>
            )}
          </div>
        </nav>
      )}
      
      {/* Add padding for mobile bottom navigation */}
      {!showBackButton && !isQuizPage && !isResultsPage && (
        <div className="sm:hidden h-16"></div>
      )}
      </div>
    </div>
  )
}
