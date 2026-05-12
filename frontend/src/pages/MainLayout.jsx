import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import StarCanvas from '../components/StarCanvas'
import Modals from '../components/Modals'
import Dashboard from '../views/Dashboard'
import Semesters from '../views/Semesters'
import Analytics from '../views/Analytics'
import Target from '../views/Target'
import Grading from '../views/Grading'
import CourseTracker from '../views/CourseTracker'
import AdminPanel from '../views/AdminPanel'
import useAppStore from '../store/useAppStore'
import { useAuth } from '../hooks/useAuth'

const VIEWS = ['dashboard', 'calculator', 'courses', 'analytics', 'target', 'grading', 'admin']

export default function MainLayout() {
  const [activeView, setActiveView] = useState('dashboard')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const theme = useAppStore(s => s.theme)
  const setTheme = useAppStore(s => s.setTheme)
  const user = useAppStore(s => s.user)
  const { logout } = useAuth()

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light')

  // Scroll content to top on view change
  useEffect(() => {
    const el = document.querySelector('.content')
    if (el) el.scrollTop = 0
    setDrawerOpen(false)
  }, [activeView])

  // Close drawer on outside scroll
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  const viewProps = { setActiveView }

  const navItems = [
    { view: 'dashboard', label: 'Dashboard', icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></> },
    { view: 'calculator', label: 'Semester CGPA', icon: <><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></> },
    { view: 'courses', label: 'Course Tracker', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></> },
    { view: 'analytics', label: 'Analytics', icon: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></> },
    { view: 'target', label: 'Target', icon: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></> },
    { view: 'grading', label: 'Grading', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></> },
    ...(user?.is_staff ? [{ view: 'admin', label: 'Admin Panel', isAdmin: true, icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/> }] : []),
  ]

  return (
    <>
      <StarCanvas />
      <div className="layout">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        <div className="main-wrap">
          {/* Mobile topbar */}
          <header className="mob-topbar">
            <div className="sb-brand">
              <div className="sb-glyph sm">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              </div>
              <p className="sb-name">GradeOS</p>
            </div>
            <button
              className="mob-hamburger"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </header>

          <div className="content">
            <section className={`view ${activeView === 'dashboard'  ? 'active' : ''}`} id="view-dashboard">
              {activeView === 'dashboard'  && <Dashboard {...viewProps} />}
            </section>
            <section className={`view ${activeView === 'calculator' ? 'active' : ''}`} id="view-calculator">
              {activeView === 'calculator' && <Semesters />}
            </section>
            <section className={`view ${activeView === 'courses'    ? 'active' : ''}`} id="view-courses">
              {activeView === 'courses'    && <CourseTracker />}
            </section>
            <section className={`view ${activeView === 'analytics'  ? 'active' : ''}`} id="view-analytics">
              {activeView === 'analytics'  && <Analytics />}
            </section>
            <section className={`view ${activeView === 'target'     ? 'active' : ''}`} id="view-target">
              {activeView === 'target'     && <Target />}
            </section>
            <section className={`view ${activeView === 'grading'    ? 'active' : ''}`} id="view-grading">
              {activeView === 'grading'    && <Grading />}
            </section>
            {user?.is_staff && (
              <section className={`view ${activeView === 'admin' ? 'active' : ''}`} id="view-admin">
                {activeView === 'admin' && <AdminPanel />}
              </section>
            )}

            <footer className="footer">
              <span>GradeOS · <strong>Asif Zetu</strong> · DIU Software Engineering</span>
              <span>© 2026</span>
            </footer>
          </div>
        </div>

        {/* ── Mobile Drawer ── */}
        <div
          className={`mob-drawer-overlay ${drawerOpen ? 'open' : ''}`}
          onClick={() => setDrawerOpen(false)}
        />
        <aside className={`mob-drawer ${drawerOpen ? 'open' : ''}`}>
          {/* Drawer header */}
          <div className="mob-drawer-header">
            <div className="sb-brand">
              <div className="sb-glyph sm">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              </div>
              <div>
                <p className="sb-name">GradeOS</p>
                <p className="sb-sub">Track · Analyze · Improve</p>
              </div>
            </div>
            <button className="mob-drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* User info */}
          {user && (
            <div className="mob-drawer-user">
              <div className="sb-avatar">{(user.name || user.email)[0].toUpperCase()}</div>
              <div className="sb-user-info">
                <p className="sb-user-name">{user.name || 'User'}</p>
                <p className="sb-user-email">{user.email}</p>
              </div>
            </div>
          )}

          {/* Nav items */}
          <nav className="mob-drawer-nav">
            {navItems.map(({ view, label, icon, isAdmin }) => (
              <button
                key={view}
                className={`mob-drawer-item ${activeView === view ? 'active' : ''} ${isAdmin ? 'mob-drawer-admin' : ''}`}
                onClick={() => { setActiveView(view); setDrawerOpen(false) }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {icon}
                </svg>
                <span>{label}</span>
                {activeView === view && <div className="mob-drawer-active-dot" />}
              </button>
            ))}
          </nav>

          {/* Footer actions */}
          <div className="mob-drawer-foot">
            <button className="mob-drawer-action" onClick={() => { window._openProfileModal?.(); setDrawerOpen(false) }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              <span>Profile</span>
            </button>
            <button className="mob-drawer-action" onClick={toggleTheme}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {theme === 'light'
                  ? <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>
                  : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                }
              </svg>
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
            <button className="mob-drawer-action" onClick={() => { window.print(); setDrawerOpen(false) }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>Export PDF</span>
            </button>
            <button className="mob-drawer-action danger" onClick={logout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </aside>
      </div>

      <Modals />
    </>
  )
}
