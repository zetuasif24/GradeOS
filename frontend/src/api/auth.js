import axios from 'axios'
import api from './client'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export async function register(email, name, password, password2) {
  const { data } = await axios.post(`${BASE_URL}/auth/register/`, {
    email, name, password, password2,
  })
  return data // { access, refresh, user }
}

export async function login(email, password) {
  const { data } = await axios.post(`${BASE_URL}/auth/login/`, { email, password })
  return data // { access, refresh, user }
}

export async function logout(refreshToken) {
  try {
    await axios.post(
      `${BASE_URL}/auth/logout/`,
      { refresh: refreshToken },
      { headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` } }
    )
  } catch {
    // Ignore errors — clear tokens regardless
  }
}

export async function updateProfile({ name, email }) {
  const { data } = await api.patch('/auth/profile/', { name, email })
  return data // { id, email, name }
}

export async function changePassword({ current_password, new_password, new_password2 }) {
  const { data } = await api.post('/auth/change-password/', {
    current_password, new_password, new_password2,
  })
  return data // { detail }
}

