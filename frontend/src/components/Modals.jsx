import { useState } from 'react'
import useAppStore from '../store/useAppStore'
import { changePassword } from '../api/auth'

// Global modal state — simple module-level singleton
let _openModal = null
export const openModal = (name, payload) => _openModal && _openModal(name, payload)

export default function Modals() {
  const [modal, setModal] = useState(null) // { name, payload }
  const addSemester    = useAppStore(s => s.addSemester)
  const deleteSemester = useAppStore(s => s.deleteSemester)
  const clearAll       = useAppStore(s => s.clearAll)
  const user           = useAppStore(s => s.user)
  const updateUser     = useAppStore(s => s.updateUser)

  _openModal = (name, payload) => setModal({ name, payload })
  const close = () => setModal(null)

  // ── Add Semester ──
  const [selType, setSelType] = useState('Spring')
  const [semYear, setSemYear] = useState(new Date().getFullYear())
  const preview = `${selType} ${semYear}`

  const confirmAdd = async () => {
    await addSemester(preview)
    close()
  }

  // ── Delete Semester ──
  const confirmDel = async () => {
    await deleteSemester(modal?.payload?.id)
    close()
  }

  // ── Clear All ──
  const confirmClear = async () => {
    await clearAll()
    close()
  }

  // ── Delete Course ──
  const removeCourse = useAppStore(s => s.removeCourse)
  const confirmDelCourse = async () => {
    await removeCourse(modal?.payload?.id)
    close()
  }

  // ── Clear Semester Courses ──
  const clearSemCourses = useAppStore(s => s.clearSemCourses)
  const confirmClearSemCourses = async () => {
    await clearSemCourses(modal?.payload?.semId)
    close()
  }

  // ── Profile modal ──
  const [profileTab, setProfileTab] = useState('info') // 'info' | 'password'
  // Info tab
  const [profName,  setProfName]  = useState('')
  const [profEmail, setProfEmail] = useState('')
  const [profErr,   setProfErr]   = useState('')
  const [profOk,    setProfOk]    = useState('')
  const [profLoading, setProfLoading] = useState(false)
  // Password tab
  const [pwCur,  setPwCur]  = useState('')
  const [pwNew,  setPwNew]  = useState('')
  const [pwNew2, setPwNew2] = useState('')
  const [pwErr,  setPwErr]  = useState('')
  const [pwOk,   setPwOk]   = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  const openProfile = () => {
    setProfName(user?.name || '')
    setProfEmail(user?.email || '')
    setProfErr(''); setProfOk('')
    setPwCur(''); setPwNew(''); setPwNew2('')
    setPwErr(''); setPwOk('')
    setProfileTab('info')
    setModal({ name: 'profile' })
  }
  // Expose helper so Sidebar can call it
  if (typeof window !== 'undefined') window._openProfileModal = openProfile

  const saveProfile = async () => {
    setProfErr(''); setProfOk(''); setProfLoading(true)
    try {
      await updateUser({ name: profName, email: profEmail })
      setProfOk('Profile updated successfully!')
    } catch (e) {
      const d = e?.response?.data
      if (d?.name)  setProfErr(d.name[0])
      else if (d?.email) setProfErr(d.email[0])
      else if (d?.detail) setProfErr(d.detail)
      else setProfErr('Update failed. Please try again.')
    } finally {
      setProfLoading(false)
    }
  }

  const savePassword = async () => {
    setPwErr(''); setPwOk(''); setPwLoading(true)
    if (pwNew !== pwNew2) { setPwErr('New passwords do not match.'); setPwLoading(false); return }
    try {
      await changePassword({ current_password: pwCur, new_password: pwNew, new_password2: pwNew2 })
      setPwOk('Password changed successfully!')
      setPwCur(''); setPwNew(''); setPwNew2('')
    } catch (e) {
      const d = e?.response?.data
      if (d?.current_password) setPwErr(d.current_password[0])
      else if (d?.new_password)  setPwErr(d.new_password[0])
      else if (d?.new_password2) setPwErr(d.new_password2[0])
      else if (d?.detail)        setPwErr(d.detail)
      else setPwErr('Password change failed. Try again.')
    } finally {
      setPwLoading(false)
    }
  }

  const isOpen = (name) => modal?.name === name

  return (
    <>
      {/* ADD SEMESTER */}
      <div className={`modal-overlay ${isOpen('addSem') ? 'open' : ''}`}
           onClick={e => e.target === e.currentTarget && close()}>
        <div className="modal-box">
          <div className="modal-ico cyan-ico">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <h3>New Semester</h3><p>Choose semester type and year</p>
          <div className="sem-picker">
            <div className="stype-row">
              {['Spring', 'Summer', 'Fall'].map(t => (
                <button key={t} className={`stype-btn ${selType === t ? 'active' : ''}`}
                        onClick={() => setSelType(t)}>
                  {t === 'Spring' ? '🌸' : t === 'Summer' ? '☀️' : '🍂'} {t}
                </button>
              ))}
            </div>
            <input className="sem-year-inp" type="number" value={semYear} min="2000" max="2099"
                   onChange={e => setSemYear(e.target.value)} />
            <div className="sem-preview">
              <span className="sp-label">Preview:</span>
              <span className="sp-val">{preview}</span>
            </div>
          </div>
          <div className="modal-actions">
            <button className="mbtn cancel" onClick={close}>Cancel</button>
            <button className="mbtn ok" onClick={confirmAdd}>Add Semester</button>
          </div>
        </div>
      </div>

      {/* DELETE SEMESTER */}
      <div className={`modal-overlay ${isOpen('delSem') ? 'open' : ''}`}
           onClick={e => e.target === e.currentTarget && close()}>
        <div className="modal-box">
          <div className="modal-ico warn-ico">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h3>Delete Semester?</h3>
          <p>"{modal?.payload?.name}" and all its courses will be permanently removed.</p>
          <div className="modal-actions">
            <button className="mbtn cancel" onClick={close}>Keep It</button>
            <button className="mbtn danger" onClick={confirmDel}>Delete</button>
          </div>
        </div>
      </div>

      {/* DELETE COURSE */}
      <div className={`modal-overlay ${isOpen('delCourse') ? 'open' : ''}`}
           onClick={e => e.target === e.currentTarget && close()}>
        <div className="modal-box">
          <div className="modal-ico danger-ico">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/>
            </svg>
          </div>
          <h3>Delete Course?</h3>
          <p>"{modal?.payload?.name}" and all its assessment marks will be permanently removed.</p>
          <div className="modal-actions">
            <button className="mbtn cancel" onClick={close}>Keep It</button>
            <button className="mbtn danger" onClick={confirmDelCourse}>Delete</button>
          </div>
        </div>
      </div>

      {/* CLEAR SEM COURSES */}
      <div className={`modal-overlay ${isOpen('clearSemCourses') ? 'open' : ''}`}
           onClick={e => e.target === e.currentTarget && close()}>
        <div className="modal-box">
          <div className="modal-ico danger-ico">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h3>Delete All Courses?</h3>
          <p>All courses in <strong>"{modal?.payload?.semName}"</strong> and their assessment marks will be permanently removed. This cannot be undone.</p>
          <div className="modal-actions">
            <button className="mbtn cancel" onClick={close}>Keep Them</button>
            <button className="mbtn danger" onClick={confirmClearSemCourses}>Delete All</button>
          </div>
        </div>
      </div>

      {/* CLEAR ALL */}
      <div className={`modal-overlay ${isOpen('clearAll') ? 'open' : ''}`}
           onClick={e => e.target === e.currentTarget && close()}>
        <div className="modal-box">
          <div className="modal-ico danger-ico">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/>
            </svg>
          </div>
          <h3>Clear Everything?</h3>
          <p>All semesters and courses will be permanently deleted. This cannot be undone.</p>
          <div className="modal-actions">
            <button className="mbtn cancel" onClick={close}>Cancel</button>
            <button className="mbtn danger" onClick={confirmClear}>Clear All</button>
          </div>
        </div>
      </div>

      {/* PROFILE */}
      <div className={`modal-overlay ${isOpen('profile') ? 'open' : ''}`}
           onClick={e => e.target === e.currentTarget && close()}>
        <div className="modal-box prof-modal-box">
          {/* Header */}
          <div className="prof-header">
            <div className="prof-avatar">{(user?.name || user?.email || 'U')[0].toUpperCase()}</div>
            <div>
              <h3 style={{margin:0}}>{user?.name || 'Your Profile'}</h3>
              <p style={{margin:0,fontSize:12,color:'var(--text3)'}}>{user?.email}</p>
            </div>
            <button className="prof-close-btn" onClick={close}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="prof-tabs">
            <button className={`prof-tab ${profileTab==='info'?'active':''}`} onClick={()=>{setProfileTab('info');setProfErr('');setProfOk('')}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              Profile Info
            </button>
            <button className={`prof-tab ${profileTab==='password'?'active':''}`} onClick={()=>{setProfileTab('password');setPwErr('');setPwOk('')}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Password
            </button>
          </div>

          {/* Profile Info tab */}
          {profileTab === 'info' && (
            <div className="prof-form">
              <div className="prof-field">
                <label className="prof-label">Full Name</label>
                <input className="prof-input" type="text" value={profName}
                  placeholder="Your name"
                  onChange={e => { setProfName(e.target.value); setProfErr(''); setProfOk('') }} />
              </div>
              <div className="prof-field">
                <label className="prof-label">Email Address</label>
                <input className="prof-input" type="email" value={profEmail}
                  placeholder="you@example.com"
                  onChange={e => { setProfEmail(e.target.value); setProfErr(''); setProfOk('') }} />
              </div>
              {profErr && <div className="prof-msg prof-err">{profErr}</div>}
              {profOk  && <div className="prof-msg prof-ok">{profOk}</div>}
              <button className="mbtn ok prof-save-btn" onClick={saveProfile} disabled={profLoading}>
                {profLoading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* Password tab */}
          {profileTab === 'password' && (
            <div className="prof-form">
              <div className="prof-field">
                <label className="prof-label">Current Password</label>
                <input className="prof-input" type="password" value={pwCur}
                  placeholder="Enter current password"
                  onChange={e => { setPwCur(e.target.value); setPwErr(''); setPwOk('') }} />
              </div>
              <div className="prof-field">
                <label className="prof-label">New Password</label>
                <input className="prof-input" type="password" value={pwNew}
                  placeholder="At least 8 characters"
                  onChange={e => { setPwNew(e.target.value); setPwErr(''); setPwOk('') }} />
              </div>
              <div className="prof-field">
                <label className="prof-label">Confirm New Password</label>
                <input className="prof-input" type="password" value={pwNew2}
                  placeholder="Repeat new password"
                  onChange={e => { setPwNew2(e.target.value); setPwErr(''); setPwOk('') }} />
              </div>
              {pwErr && <div className="prof-msg prof-err">{pwErr}</div>}
              {pwOk  && <div className="prof-msg prof-ok">{pwOk}</div>}
              <button className="mbtn ok prof-save-btn" onClick={savePassword} disabled={pwLoading}>
                {pwLoading ? 'Changing…' : 'Change Password'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
