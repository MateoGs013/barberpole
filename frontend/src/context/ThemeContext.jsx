import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({
  tema: 'dark',
  alternarTema: () => {},
  esOscuro: true,
})

const TEMA_KEY = 'barberpole_theme'

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(() => {
    try {
      const guardado = localStorage.getItem(TEMA_KEY)
      return guardado === 'light' ? 'light' : 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    const root = document.documentElement
    if (tema === 'light') {
      root.classList.remove('dark')
      root.classList.add('light')
      root.setAttribute('data-theme', 'light')
      try {
        localStorage.setItem(TEMA_KEY, 'light')
      } catch {}
    } else {
      root.classList.remove('light')
      root.classList.add('dark')
      root.setAttribute('data-theme', 'dark')
      try {
        localStorage.setItem(TEMA_KEY, 'dark')
      } catch {}
    }
  }, [tema])

  const alternarTema = () => {
    setTema((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const esOscuro = tema === 'dark'

  return (
    <ThemeContext.Provider value={{ tema, alternarTema, esOscuro }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    return {
      tema: 'dark',
      alternarTema: () => {},
      esOscuro: true,
    }
  }
  return context
}
