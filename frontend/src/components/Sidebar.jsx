import useAppStore from '../store/useAppStore'
import { useAuth } from '../hooks/useAuth'

export default function Sidebar({ activeView, setActiveView, theme, toggleTheme }) {
  const user = useAppStore(s => s.user)
  const { logout } = useAuth()

  const navItems = [
    {
      view: 'dashboard', label: 'Dashboard',
      icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>
    },
    {
      view: 'calculator', label: 'Semesters',
      icon: <><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>
    },
    {
      view: 'analytics', label: 'Analytics',
      icon: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>
    },
    {
      view: 'target', label: 'Target',
      icon: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>
    },
    {
      view: 'grading', label: 'Grading',
      icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></>
    },
  ]

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="sb-glyph">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>
        <div>
          <p className="sb-name">GradeOS</p>
          <p className="sb-sub">Track · Analyze · Improve</p>
        </div>
      </div>

      <nav className="sb-nav">
        {navItems.map(({ view, label, icon }) => (
          <button
            key={view}
            className={`snav ${activeView === view ? 'active' : ''}`}
            data-view={view}
            onClick={() => setActiveView(view)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {icon}
            </svg>
            {label}
          </button>
        ))}
      </nav>

      <div className="sb-foot">
        {/* User info */}
        {user && (
          <div className="sb-user">
            <div className="sb-avatar">{(user.name || user.email)[0].toUpperCase()}</div>
            <div className="sb-user-info">
              <p className="sb-user-name">{user.name || 'User'}</p>
              <p className="sb-user-email">{user.email}</p>
            </div>
          </div>
        )}
        <button className="sb-btn" onClick={() => window._openProfileModal?.()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
          <span>Profile</span>
        </button>
        <button className="sb-btn theme-btn" onClick={toggleTheme}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {theme === 'light'
              ? <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>
              : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            }
          </svg>
          <span>Theme</span>
        </button>
        <button className="sb-btn" onClick={() => window.print()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>Export PDF</span>
        </button>
        <button className="sb-btn sb-logout-btn" onClick={logout}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
