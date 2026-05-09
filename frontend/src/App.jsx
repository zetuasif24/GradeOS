import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAppStore from './store/useAppStore'
import MainLayout from './pages/MainLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import api from './api/client'

function App() {
  const setUser = useAppStore(s => s.setUser)
  const user = useAppStore(s => s.user)
  const loadSemesters = useAppStore(s => s.loadSemesters)
  const setTheme = useAppStore(s => s.setTheme)
  const theme = useAppStore(s => s.theme)
  const [booting, setBooting] = useState(true)

  // Restore session on page load
  useEffect(() => {
    const restoreSession = async () => {
      const access = sessionStorage.getItem('access_token')
      const refresh = localStorage.getItem('refresh_token')
      if (access || refresh) {
        try {
          const { data } = await api.get('/auth/me/')
          setUser(data)
          await loadSemesters()
        } catch {
          sessionStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      }
      setBooting(false)
    }
    restoreSession()
  }, [])

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  if (booting) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div className="boot-spinner" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/*"        element={user ? <MainLayout /> : <Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
