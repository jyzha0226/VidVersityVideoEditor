/**
 * @file ThemeProvider.tsx
 * @description Lightweight color theme context with light/dark switching using Tailwind's `dark` mode.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

/**
 * @description Supported visual themes.
 */
type Theme = 'light' | 'dark'

/**
 * @description Exposed value from the ThemeContext.
 */
interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

/**
 * @description Internal React context storing the current theme.
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

/**
 * @description Provider component that wires theme state to the DOM and children.
 */
export function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  const [theme, setThemeState] = useState<Theme>('dark')

  /**
   * @description Initialize theme from localStorage or media query.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = window.localStorage.getItem('theme') as Theme | null
    if (stored === 'light' || stored === 'dark') {
      setThemeState(stored)
      return
    }

    const prefersDark = window.matchMedia?.(
      '(prefers-color-scheme: dark)',
    ).matches
    setThemeState(prefersDark ? 'dark' : 'light')
  }, [])

  /**
   * @description Reflect theme changes to the <html> class and persist.
   */
  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement

    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', theme)
    }
  }, [theme])

  /**
   * @description Update theme to a specific value.
   * @param next - Target theme.
   */
  const setTheme = (next: Theme): void => {
    setThemeState(next)
  }

  /**
   * @description Flip between light and dark themes.
   */
  const toggleTheme = (): void => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/**
 * @description Hook to access the current theme context.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return ctx
}
