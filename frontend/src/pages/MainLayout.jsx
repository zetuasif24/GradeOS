import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import StarCanvas from '../components/StarCanvas'
import Modals from '../components/Modals'
import Dashboard from '../views/Dashboard'
import Semesters from '../views/Semesters'
import Analytics from '../views/Analytics'
import Target from '../views/Target'
import Grading from '../views/Grading'
import useAppStore from '../store/useAppStore'

const VIEWS = ['dashboard', 'calculator', 'analytics', 'target', 'grading']

export default function MainLayout() {
  const [activeView, setActiveView] = useState('dashboard')
  const theme = useAppStore(s => s.theme)
  const setTheme = useAppStore(s => s.setTheme)

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light')

  // Scroll content to top on view change
  useEffect(() => {
    const el = document.querySelector('.content')
    if (el) el.scrollTop = 0
  }, [activeView])

  const viewProps = { setActiveView }

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
            <button className="sb-btn theme-btn" onClick={toggleTheme} style={{ padding: '7px 10px' }}>
              <svg className={theme === 'light' ? 'ico-sun2' : 'ico-moon2'}
                   width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {theme === 'light'
                  ? <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>
                  : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                }
              </svg>
            </button>
          </header>

          <div className="content">
            <section className={`view ${activeView === 'dashboard' ? 'active' : ''}`} id="view-dashboard">
              {activeView === 'dashboard' && <Dashboard {...viewProps} />}
            </section>
            <section className={`view ${activeView === 'calculator' ? 'active' : ''}`} id="view-calculator">
              {activeView === 'calculator' && <Semesters />}
            </section>
            <section className={`view ${activeView === 'analytics' ? 'active' : ''}`} id="view-analytics">
              {activeView === 'analytics' && <Analytics />}
            </section>
            <section className={`view ${activeView === 'target' ? 'active' : ''}`} id="view-target">
              {activeView === 'target' && <Target />}
            </section>
            <section className={`view ${activeView === 'grading' ? 'active' : ''}`} id="view-grading">
              {activeView === 'grading' && <Grading />}
            </section>

            <footer className="footer">
              <span>GradeOS · <strong>Asif Zetu</strong> · DIU Software Engineering</span>
              <span>© 2026</span>
            </footer>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <nav className="mob-nav">
          {[
            { view: 'dashboard', label: 'Dash', icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></> },
            { view: 'calculator', label: 'Sems', icon: <><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></> },
            { view: 'analytics', label: 'Stats', icon: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></> },
            { view: 'target', label: 'Target', icon: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></> },
            { view: 'grading', label: 'Grades', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></> },
          ].map(({ view, label, icon }) => (
            <button
              key={view}
              className={`mob-btn ${activeView === view ? 'active' : ''}`}
              data-view={view}
              onClick={() => setActiveView(view)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      <Modals />
    </>
  )
}
