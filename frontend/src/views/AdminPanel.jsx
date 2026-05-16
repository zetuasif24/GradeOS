import { useState, useEffect, useCallback } from 'react'
import { getAdminUsers, deleteAdminUser, resetAdminPassword } from '../api/admin'
import useAppStore from '../store/useAppStore'

/* ── tiny helpers ── */
function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function extractError(e, fallback = 'An error occurred.') {
  if (!e) return fallback
  // Network / no response (CORS, server down, etc.)
  if (!e.response) return e.message || 'Network error — check your connection.'
  const d = e.response.data
  if (!d) return fallback
  // DRF detail string
  if (typeof d.detail === 'string') return d.detail
  // Field-level errors (e.g. new_password: [...])
  for (const key of Object.keys(d)) {
    const val = d[key]
    if (Array.isArray(val) && val.length) return `${key}: ${val[0]}`
    if (typeof val === 'string') return `${key}: ${val}`
  }
  return fallback
}

export default function AdminPanel() {
  const currentUser = useAppStore(s => s.user)

  const [users, setUsers]         = useState([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  // Delete confirm
  const [delTarget, setDelTarget] = useState(null) // { id, email }
  const [deleting, setDeleting]   = useState(false)
  const [delError, setDelError]   = useState('')
  const [delDone, setDelDone]     = useState(false)

  // Reset password modal
  const [resetTarget, setResetTarget] = useState(null) // { id, email }
  const [newPw, setNewPw]             = useState('')
  const [pwError, setPwError]         = useState('')
  const [resetting, setResetting]     = useState(false)
  const [resetDone, setResetDone]     = useState('')

  const fetchUsers = useCallback(async (q = '') => {
    setLoading(true)
    setError('')
    try {
      const data = await getAdminUsers(q)
      setUsers(data)
    } catch (e) {
      setError(extractError(e, 'Failed to load users.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchUsers(search), 350)
    return () => clearTimeout(t)
  }, [search, fetchUsers])

  /* ── stats ── */
  const now = new Date()
  const thisMonth = users.filter(u => {
    const d = new Date(u.created_at)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length
  const adminCount = users.filter(u => u.is_staff).length

  /* ── delete ── */
  const openDelete = (user) => {
    console.log('[AdminPanel] openDelete called for:', user.id, user.email)
    setDelTarget({ id: user.id, email: user.email })
    setDelError('')
    setDelDone(false)
  }

  const closeDelete = () => {
    if (deleting) return          // don't allow closing while request in-flight
    setDelTarget(null)
    setDelError('')
    setDelDone(false)
  }

  const handleDelete = async () => {
    console.log('[AdminPanel] handleDelete called — delTarget:', delTarget, '| deleting:', deleting)
    if (!delTarget || deleting) {
      console.warn('[AdminPanel] handleDelete BLOCKED — delTarget is', delTarget, ', deleting is', deleting)
      return
    }
    setDeleting(true)
    setDelError('')
    try {
      await deleteAdminUser(delTarget.id)
      setUsers(prev => prev.filter(u => u.id !== delTarget.id))
      setDelDone(true)            // show success state inside modal
    } catch (e) {
      console.error('[AdminPanel] DELETE user failed:', {
        status: e?.response?.status,
        data:   e?.response?.data,
        message: e?.message,
      })
      setDelError(extractError(e, 'Failed to delete user.'))
    } finally {
      setDeleting(false)
    }
  }

  /* ── reset password ── */
  const openReset = (user) => {
    console.log('[AdminPanel] openReset called for:', user.id, user.email)
    setResetTarget({ id: user.id, email: user.email })
    setNewPw('')
    setPwError('')
    setResetDone('')
  }

  const closeReset = () => {
    if (resetting) return
    setResetTarget(null)
    setResetDone('')
  }

  const handleReset = async () => {
    console.log('[AdminPanel] handleReset called — resetTarget:', resetTarget, '| resetting:', resetting)
    if (!resetTarget || resetting) {
      console.warn('[AdminPanel] handleReset BLOCKED — resetTarget is', resetTarget, ', resetting is', resetting)
      return
    }
    if (newPw.length < 6) { setPwError('Password must be at least 6 characters.'); return }
    setResetting(true)
    setPwError('')
    try {
      await resetAdminPassword(resetTarget.id, newPw)
      setResetDone(`Password for ${resetTarget.email} has been reset successfully.`)
    } catch (e) {
      console.error('[AdminPanel] RESET password failed:', {
        status: e?.response?.status,
        data:   e?.response?.data,
        message: e?.message,
      })
      setPwError(extractError(e, 'Reset failed.'))
    } finally {
      setResetting(false)
    }
  }

  return (
    <>
      <div className="vhead">
        <h2 className="vtitle admin-vtitle">
          <span className="admin-badge-title">ADMIN</span>
          User Management
        </h2>
        <p className="vsub">Manage all registered user accounts · Search, delete, or reset passwords</p>
      </div>

      {/* Stats row */}
      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <p className="admin-stat-val">{users.length}</p>
            <p className="admin-stat-lbl">Total Users</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon accent-green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
          </div>
          <div>
            <p className="admin-stat-val">{thisMonth}</p>
            <p className="admin-stat-lbl">New This Month</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon accent-amber">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <p className="admin-stat-val">{adminCount}</p>
            <p className="admin-stat-lbl">Admins</p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <svg className="admin-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            id="admin-search"
            className="admin-search"
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="admin-search-clear" onClick={() => setSearch('')} aria-label="Clear search">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
        <button className="admin-refresh-btn" onClick={() => fetchUsers(search)} title="Refresh">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Refresh
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {/* User table */}
      <div className="glass-panel admin-panel">
        {loading ? (
          <div className="admin-loading">
            <div className="admin-spinner" />
            <p>Loading users…</p>
          </div>
        ) : users.length === 0 ? (
          <div className="admin-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
            <p>No users found{search ? ` matching "${search}"` : '.'}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="tbl-scroll admin-tbl-wrap">
              <table className="ctbl admin-tbl">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Registered</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id} className={u.id === currentUser?.id ? 'admin-row-self' : ''}>
                      <td className="td-n">{i + 1}</td>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-avatar-sm">
                            {(u.name || u.email)[0].toUpperCase()}
                          </div>
                          <span className="admin-user-name">{u.name || <em className="admin-no-name">No name</em>}</span>
                        </div>
                      </td>
                      <td className="admin-email-cell">{u.email}</td>
                      <td>
                        {u.is_staff
                          ? <span className="chip chip-outstanding admin-role-chip">Admin</span>
                          : <span className="chip chip-none admin-role-chip">User</span>
                        }
                      </td>
                      <td className="admin-date-cell">{fmt(u.created_at)}</td>
                      <td>
                        <div className="admin-actions">
                          <button
                            className="admin-action-btn admin-reset-btn"
                            onClick={() => openReset(u)}
                            title="Reset Password"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                            Reset PW
                          </button>
                          {u.id !== currentUser?.id && (
                            <button
                              className="admin-action-btn admin-del-btn"
                              onClick={() => openDelete(u)}
                              title="Delete account"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                                <path d="M9 6V4h6v2"/>
                              </svg>
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="mob-courses admin-mob-list">
              {users.map((u, i) => (
                <div key={u.id} className={`mob-card admin-mob-card ${u.id === currentUser?.id ? 'admin-row-self' : ''}`}>
                  <div className="mob-top">
                    <div className="admin-user-cell">
                      <div className="admin-avatar-sm">{(u.name || u.email)[0].toUpperCase()}</div>
                      <div>
                        <p className="admin-user-name">{u.name || <em className="admin-no-name">No name</em>}</p>
                        <p className="admin-mob-email">{u.email}</p>
                      </div>
                    </div>
                    {u.is_staff
                      ? <span className="chip chip-outstanding admin-role-chip">Admin</span>
                      : <span className="chip chip-none admin-role-chip">User</span>
                    }
                  </div>
                  <div className="admin-mob-meta">
                    <span>Registered: <strong>{fmt(u.created_at)}</strong></span>
                    <div className="admin-actions">
                      <button className="admin-action-btn admin-reset-btn" onClick={() => openReset(u)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        Reset PW
                      </button>
                      {u.id !== currentUser?.id && (
                        <button className="admin-action-btn admin-del-btn" onClick={() => openDelete(u)}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/>
                          </svg>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cp-foot">
              <span>{users.length} user{users.length !== 1 ? 's' : ''} found</span>
              {search && <span>Filtered by: <strong>"{search}"</strong></span>}
            </div>
          </>
        )}
      </div>

      {/* ── Delete confirmation modal ── */}
      {delTarget && (
        <div className="modal-overlay open" onClick={closeDelete}>
          <div className={`am-card ${delDone ? 'am-card-success' : 'am-card-danger'}`} onClick={e => e.stopPropagation()}>
            <div className="am-body">
              {delDone ? (<>
                <div className="am-icon am-icon-green"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                <p className="am-title">Account Deleted</p>
                <p className="am-sub">The account has been permanently removed.</p>
                <span className="am-pill am-pill-green"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>{delTarget.email}</span>
              </>) : (<>
                <div className="am-icon am-icon-red"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg></div>
                <p className="am-title">Delete Account?</p>
                <p className="am-sub">You're about to permanently delete</p>
                <span className="am-pill"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>{delTarget.email}</span>
                <div className="am-warn"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>This action is irreversible. All data will be lost.</div>
                {delError && <p className="am-err">{delError}</p>}
              </>)}
            </div>
            <div className="am-divider"/>
            <div className="am-actions">
              {delDone
                ? <button className="am-btn am-ghost" onClick={closeDelete}>Close</button>
                : <><button className="am-btn am-ghost" onClick={closeDelete} disabled={deleting}>Cancel</button>
                    <button className="am-btn am-red" onClick={handleDelete} disabled={deleting}>
                      {deleting ? <><span className="am-spin"/><span>Deleting…</span></> : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg><span>Delete Account</span></>}
                    </button></>
              }
            </div>
          </div>
        </div>
      )}

      {/* ── Reset password modal ── */}
      {resetTarget && (
        <div className="modal-overlay open" onClick={closeReset}>
          <div className={`am-card ${resetDone ? 'am-card-success' : 'am-card-cyan'}`} onClick={e => e.stopPropagation()}>
            <div className="am-body">
              {resetDone ? (<>
                <div className="am-icon am-icon-green"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                <p className="am-title">Password Updated</p>
                <p className="am-sub">New credentials are active immediately.</p>
                <span className="am-pill am-pill-green"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>{resetTarget.email}</span>
              </>) : (<>
                <div className="am-icon am-icon-cyan"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
                <p className="am-title">Reset Password</p>
                <p className="am-sub">Setting a new password for</p>
                <span className="am-pill"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>{resetTarget.email}</span>
                <div className="am-pw-wrap">
                  <label className="am-pw-label">New Password</label>
                  <input id="admin-new-pw" className="am-pw-input" type="password" placeholder="Minimum 6 characters"
                    value={newPw} onChange={e => { setNewPw(e.target.value); setPwError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleReset()} autoFocus/>
                  {pwError && <p className="am-err">{pwError}</p>}
                </div>
              </>)}
            </div>
            <div className="am-divider"/>
            <div className="am-actions">
              {resetDone
                ? <button className="am-btn am-ghost" onClick={closeReset}>Close</button>
                : <><button className="am-btn am-ghost" onClick={closeReset} disabled={resetting}>Cancel</button>
                    <button className="am-btn am-cyan" onClick={handleReset} disabled={resetting}>
                      {resetting ? <><span className="am-spin am-spin-cyan"/><span>Resetting…</span></> : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><span>Reset Password</span></>}
                    </button></>
              }
            </div>
          </div>
        </div>
      )}
    </>
  )
}

