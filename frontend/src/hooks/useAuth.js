import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { register as apiRegister, login as apiLogin, logout as apiLogout } from '../api/auth'
import useAppStore from '../store/useAppStore'

export function useAuth() {
  const setUser = useAppStore(s => s.setUser)
  const loadSemesters = useAppStore(s => s.loadSemesters)
  const navigate = useNavigate()

  const saveTokens = (access, refresh) => {
    sessionStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
  }

  const register = useCallback(async (email, name, password, password2) => {
    const data = await apiRegister(email, name, password, password2)
    saveTokens(data.access, data.refresh)
    setUser(data.user)
    await loadSemesters()
    navigate('/')
    return data
  }, [setUser, loadSemesters, navigate])

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password)
    saveTokens(data.access, data.refresh)
    setUser(data.user)
    await loadSemesters()
    navigate('/')
    return data
  }, [setUser, loadSemesters, navigate])

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem('refresh_token')
    await apiLogout(refresh)
    sessionStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    navigate('/login')
  }, [setUser, navigate])

  return { register, login, logout }
}
