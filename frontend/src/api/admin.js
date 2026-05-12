import api from './client'

/** GET /api/auth/admin/users/?search= — list all users */
export async function getAdminUsers(search = '') {
  const params = search ? { search } : {}
  const { data } = await api.get('/auth/admin/users/', { params })
  return data
}

/** DELETE /api/auth/admin/users/<id>/ — delete a user account */
export async function deleteAdminUser(id) {
  await api.delete(`/auth/admin/users/${id}/`)
}

/** POST /api/auth/admin/users/<id>/reset-password/ — admin sets new password */
export async function resetAdminPassword(id, new_password) {
  const { data } = await api.post(`/auth/admin/users/${id}/reset-password/`, { new_password })
  return data
}
