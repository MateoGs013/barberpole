import { MotionConfig } from 'framer-motion'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AppRouter } from './router/AppRouter.jsx'

function App() {
  return (
    // reducedMotion="user" hace que todos los motion.* de Framer respeten
    // prefers-reduced-motion automáticamente (sin tocar cada animación).
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRouter />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </MotionConfig>
  )
}

export default App
