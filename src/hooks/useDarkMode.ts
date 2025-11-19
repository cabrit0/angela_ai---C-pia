import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'

type Theme = 'light' | 'dark' | 'system'

export function useDarkMode() {
  // Get system preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }

  // Store user preference in localStorage
  const [themePreference, setThemePreference] = useLocalStorage<Theme>('quiz-app-theme', 'system')

  // Get the actual theme to apply
  const getAppliedTheme = (): 'light' | 'dark' => {
    if (themePreference === 'system') {
      return getSystemTheme()
    }
    return themePreference
  }

  // Toggle between light and dark mode
  const toggleDarkMode = () => {
    const currentTheme = getAppliedTheme()
    setThemePreference(currentTheme === 'dark' ? 'light' : 'dark')
  }

  // Set specific theme
  const setTheme = (theme: Theme) => {
    setThemePreference(theme)
  }

  // Apply theme to document
  useEffect(() => {
    const appliedTheme = getAppliedTheme()
    const root = document.documentElement
    
    console.log('[DEBUG] useDarkMode - Applying theme:', {
      themePreference,
      appliedTheme,
      currentClasses: root.className,
      systemTheme: getSystemTheme()
    })
    
    // Remove both classes first to ensure clean state
    root.classList.remove('light', 'dark')
    
    // Add the appropriate class
    root.classList.add(appliedTheme)
    
    // Force a reflow to ensure the theme is applied
    void root.offsetHeight
    
    console.log('[DEBUG] useDarkMode - Theme applied:', {
      newClasses: root.className,
      computedStyle: window.getComputedStyle(root).getPropertyValue('color')
    })
    
    // Add theme-color meta tag for mobile browsers
    let metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta')
      metaThemeColor.setAttribute('name', 'theme-color')
      document.head.appendChild(metaThemeColor)
    }
    
    // Set appropriate theme color based on theme
    metaThemeColor.setAttribute('content', appliedTheme === 'dark' ? '#0F172A' : '#F9FAFB')
  }, [themePreference])

  // Listen for system theme changes
  useEffect(() => {
    if (themePreference !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const appliedTheme = getAppliedTheme()
      const root = document.documentElement
      
      // Remove both classes first to ensure clean state
      root.classList.remove('light', 'dark')
      
      // Add the appropriate class
      root.classList.add(appliedTheme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [themePreference])

  return {
    theme: getAppliedTheme(),
    themePreference,
    isDark: getAppliedTheme() === 'dark',
    isLight: getAppliedTheme() === 'light',
    isSystem: themePreference === 'system',
    toggleDarkMode,
    setTheme,
  }
}