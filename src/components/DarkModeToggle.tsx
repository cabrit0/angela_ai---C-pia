import { useDarkMode } from '../hooks/useDarkMode'

const SunIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const MoonIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
)

const ComputerIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

export default function DarkModeToggle() {
  const { theme, themePreference, isDark, isLight, isSystem, setTheme } = useDarkMode()

  console.log('[DEBUG] DarkModeToggle - State:', {
    theme,
    themePreference,
    isDark,
    isLight,
    isSystem,
    documentClasses: document.documentElement.className
  })

  return (
    <div className="relative group">
      {/* Main toggle button */}
      <button
        onClick={() => {
          console.log('[DEBUG] DarkModeToggle - Click detected:', {
            currentTheme: theme,
            themePreference,
            isDark,
            isLight,
            isSystem
          })
          
          if (isSystem) {
            console.log('[DEBUG] DarkModeToggle - Setting theme to light')
            setTheme('light')
          } else if (isLight) {
            console.log('[DEBUG] DarkModeToggle - Setting theme to dark')
            setTheme('dark')
          } else {
            console.log('[DEBUG] DarkModeToggle - Setting theme to system')
            setTheme('system')
          }
        }}
        className="btn-ghost p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        aria-label="Toggle theme"
      >
        <div className="relative w-5 h-5">
          <SunIcon 
            className={`absolute inset-0 transition-all duration-300 ${isLight ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'}`} 
          />
          <MoonIcon 
            className={`absolute inset-0 transition-all duration-300 ${isDark ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`} 
          />
          <ComputerIcon 
            className={`absolute inset-0 transition-all duration-300 ${isSystem ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`} 
          />
        </div>
      </button>

      {/* Tooltip */}
      <div className="absolute right-0 top-full mt-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
        {isSystem ? 'System theme' : isDark ? 'Dark mode' : 'Light mode'}
      </div>

      {/* Expanded options (shown on hover) */}
      <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[140px]">
        <div className="py-1">
          <button
            onClick={() => setTheme('light')}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors duration-150 ${
              isLight 
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <SunIcon className="w-4 h-4" />
            Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors duration-150 ${
              isDark 
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <MoonIcon className="w-4 h-4" />
            Dark
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors duration-150 ${
              isSystem 
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <ComputerIcon className="w-4 h-4" />
            System
          </button>
        </div>
      </div>
    </div>
  )
}