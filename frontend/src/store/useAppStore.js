import { create } from 'zustand'
import { getSemesters, createSemester, deleteSemester as apiDeleteSem,
         createCourse, updateCourse as apiUpdateCourse, deleteCourse as apiDeleteCourse,
         clearAll as apiClearAll, getPerformance, upsertPerformance } from '../api/grades'
import { updateProfile as apiUpdateProfile } from '../api/auth'
import { sortSems, uid } from '../utils'

const useAppStore = create((set, get) => ({
  // ── Auth ──
  user: null,
  setUser: (user) => set({ user }),
  updateUser: async ({ name, email }) => {
    const updated = await apiUpdateProfile({ name, email })
    set({ user: updated })
    return updated
  },

  // ── Grade state ──
  sems: [],
  activeId: null,
  loading: false,
  syncing: false,

  getActive: () => {
    const { sems, activeId } = get()
    return sems.find(s => s.id === activeId) || sems[0] || null
  },

  // ── Load all semesters from API ──
  loadSemesters: async () => {
    set({ loading: true })
    try {
      const data = await getSemesters()
      const sorted = sortSems(data)
      set({
        sems: sorted,
        activeId: sorted.length ? sorted[sorted.length - 1].id : null,
        loading: false,
      })
    } catch {
      set({ loading: false })
    }
  },

  // ── Add semester ──
  addSemester: async (name) => {
    const { sems } = get()
    const data = await createSemester(name, sems.length)
    const newSem = { ...data, courses: data.courses || [] }
    const sorted = sortSems([...sems, newSem])
    set({ sems: sorted, activeId: newSem.id })
  },

  // ── Delete semester ──
  deleteSemester: async (id) => {
    await apiDeleteSem(id)
    const { sems, activeId } = get()
    const remaining = sems.filter(s => s.id !== id)
    const newActive = activeId === id
      ? (remaining.length ? remaining[remaining.length - 1].id : null)
      : activeId
    set({ sems: remaining, activeId: newActive })
  },

  switchSem: (id) => set({ activeId: id }),

  // ── Add course to active semester ──
  addCourse: async () => {
    const sem = get().getActive()
    if (!sem) return
    const newCourse = await createCourse(sem.id, { name: '', grade: 'A+', credit: 3 })
    set(state => ({
      sems: state.sems.map(s =>
        s.id === sem.id ? { ...s, courses: [...s.courses, newCourse] } : s
      )
    }))
    return newCourse
  },

  // ── Add course to a specific semester (used by CourseTracker) ──
  addCourseToSem: async (semId) => {
    const newCourse = await createCourse(semId, { name: '', grade: 'A+', credit: 3 })
    set(state => ({
      sems: state.sems.map(s =>
        s.id === semId ? { ...s, courses: [...s.courses, newCourse] } : s
      )
    }))
    return newCourse
  },

  // ── Update course (optimistic) ──
  updateCourse: async (courseId, field, value) => {
    const { sems } = get()
    // Find which sem owns this course
    const sem = sems.find(s => s.courses.some(c => c.id === courseId))
    if (!sem) return
    // Optimistic update
    set(state => ({
      sems: state.sems.map(s =>
        s.id === sem.id
          ? { ...s, courses: s.courses.map(c => c.id === courseId ? { ...c, [field]: value } : c) }
          : s
      )
    }))
    clearTimeout(window._courseSync?.[courseId])
    if (!window._courseSync) window._courseSync = {}
    window._courseSync[courseId] = setTimeout(async () => {
      try {
        await apiUpdateCourse(sem.id, courseId, { [field]: value })
      } catch {
        get().loadSemesters()
      }
    }, 600)
  },

  // ── Remove course ──
  removeCourse: async (courseId) => {
    const { sems } = get()
    const sem = sems.find(s => s.courses.some(c => c.id === courseId))
    if (!sem) return
    set(state => ({
      sems: state.sems.map(s =>
        s.id === sem.id
          ? { ...s, courses: s.courses.filter(c => c.id !== courseId) }
          : s
      )
    }))
    await apiDeleteCourse(sem.id, courseId)
  },

  // ── Clear all courses in a semester ──
  clearSemCourses: async (semId) => {
    const { sems } = get()
    const sem = sems.find(s => s.id === semId)
    if (!sem || !sem.courses.length) return
    set(state => ({
      sems: state.sems.map(s => s.id === semId ? { ...s, courses: [] } : s)
    }))
    await Promise.all(sem.courses.map(c => apiDeleteCourse(semId, c.id)))
  },

  // ── Clear all ──
  clearAll: async () => {
    await apiClearAll()
    set({ sems: [], activeId: null })
  },

  // ── Course Performance ──
  // coursePerf: { [courseId]: { quiz1, quiz2, ... } }
  coursePerf: {},

  loadPerformance: async (semId, courseId) => {
    try {
      const data = await getPerformance(semId, courseId)
      set(state => ({ coursePerf: { ...state.coursePerf, [courseId]: data } }))
      return data
    } catch {
      // Return empty if not found
      const empty = { quiz1: '', quiz2: '', quiz3: '', makeup_quiz: '',
                       midterm: '', assignment: '', presentation: '',
                       attendance_pct: '', final_exam: '' }
      set(state => ({ coursePerf: { ...state.coursePerf, [courseId]: empty } }))
      return empty
    }
  },

  savePerformance: async (semId, courseId, data) => {
    // Optimistic update
    set(state => ({
      coursePerf: { ...state.coursePerf, [courseId]: { ...state.coursePerf[courseId], ...data } }
    }))
    clearTimeout(window._perfSync?.[courseId])
    if (!window._perfSync) window._perfSync = {}
    window._perfSync[courseId] = setTimeout(async () => {
      try {
        await upsertPerformance(semId, courseId, data)
      } catch {
        // silently fail — data stays in memory
      }
    }, 800)
  },

  // ── Theme (stored locally — not user data) ──
  theme: localStorage.getItem('gradeos_theme') || 'light',
  setTheme: (t) => {
    localStorage.setItem('gradeos_theme', t)
    document.documentElement.setAttribute('data-theme', t)
    set({ theme: t })
  },
}))

export default useAppStore
