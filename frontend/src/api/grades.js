import api from './client'

export const getSemesters = () => api.get('/semesters/').then(r => r.data)

export const createSemester = (name, order) =>
  api.post('/semesters/', { name, order }).then(r => r.data)

export const updateSemester = (id, data) =>
  api.patch(`/semesters/${id}/`, data).then(r => r.data)

export const deleteSemester = (id) =>
  api.delete(`/semesters/${id}/`)

export const createCourse = (semId, courseData) =>
  api.post(`/semesters/${semId}/courses/`, courseData).then(r => r.data)

export const updateCourse = (semId, courseId, data) =>
  api.patch(`/semesters/${semId}/courses/${courseId}/`, data).then(r => r.data)

export const deleteCourse = (semId, courseId) =>
  api.delete(`/semesters/${semId}/courses/${courseId}/`)

export const bulkSync = (sems) =>
  api.post('/semesters/bulk-sync/', { sems }).then(r => r.data)

export const clearAll = () =>
  api.delete('/semesters/clear-all/')

// ── Course Performance ──
export const getPerformance = (semId, courseId) =>
  api.get(`/semesters/${semId}/courses/${courseId}/performance/`).then(r => r.data)

export const upsertPerformance = (semId, courseId, data) =>
  api.patch(`/semesters/${semId}/courses/${courseId}/performance/`, data).then(r => r.data)
