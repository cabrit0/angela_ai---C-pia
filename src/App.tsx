import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QuizProvider } from './lib/store'
import { useDarkMode } from './hooks/useDarkMode'
import Router from './app/router'

function App() {
  const { themePreference } = useDarkMode()

  // Initialize theme on app load
  useEffect(() => {
    // Ensure the theme is properly applied on initial load
    // The useDarkMode hook should handle this, but let's make sure
    console.log('[DEBUG] App - Initializing theme:', { themePreference })
  }, [themePreference])

  return (
    <QuizProvider>
      <BrowserRouter>
        <div className="page-transition-enter-active">
          <Router />
        </div>
      </BrowserRouter>
    </QuizProvider>
  )
}

export default App
