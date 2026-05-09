import { create } from 'zustand'
import { getSemesters, createSemester, deleteSemester as apiDeleteSem,
         createCourse, updateCourse as apiUpdateCourse, deleteCourse as apiDeleteCourse,
         clearAll as apiClearAll } from '../api/grades'
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
    // The API returns the new sem without courses yet — add empty array
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

  // ── Add course ──
  addCourse: async () => {
    const sem = get().getActive()
    if (!sem) return
    const newCourse = await createCourse(sem.id, { name: '', grade: 'A+', credit: 3 })
    set(state => ({
      sems: state.sems.map(s =>
        s.id === sem.id ? { ...s, courses: [...s.courses, newCourse] } : s
      )
    }))
  },

  // ── Update course (optimistic) ──
  updateCourse: async (courseId, field, value) => {
    const sem = get().getActive()
    if (!sem) return
    // Optimistic update
    set(state => ({
      sems: state.sems.map(s =>
        s.id === sem.id
          ? { ...s, courses: s.courses.map(c => c.id === courseId ? { ...c, [field]: value } : c) }
          : s
      )
    }))
    // Debounced API sync — store a pending timeout per courseId
    clearTimeout(window._courseSync?.[courseId])
    if (!window._courseSync) window._courseSync = {}
    window._courseSync[courseId] = setTimeout(async () => {
      try {
        await apiUpdateCourse(sem.id, courseId, { [field]: value })
      } catch {
        // On failure re-load from API
        get().loadSemesters()
      }
    }, 600)
  },

  // ── Remove course ──
  removeCourse: async (courseId) => {
    const sem = get().getActive()
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

  // ── Clear all ──
  clearAll: async () => {
    await apiClearAll()
    set({ sems: [], activeId: null })
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
