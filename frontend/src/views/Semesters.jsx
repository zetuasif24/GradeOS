import { useEffect, useRef } from 'react'
import useAppStore from '../store/useAppStore'
import { calcCg, ugcStatus, gpOfGrade, weightedPoints } from '../utils'
import { GP, GCOL, SEM_COLORS } from '../constants'
import { openModal } from '../components/Modals'

function animNum(el, val, dec = 2, dur = 700) {
  if (!el) return
  const start = parseFloat(el.dataset.v || '0') || 0
  const end = parseFloat(val)
  const t0 = performance.now()
  el.dataset.v = end
  const ease = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2
  const run = (now) => {
    const p = Math.min((now - t0) / 700, 1)
    el.textContent = (start + (end - start) * ease(p)).toFixed(dec)
    if (p < 1) requestAnimationFrame(run)
    else el.textContent = end.toFixed(dec)
  }
  requestAnimationFrame(run)
}

function GradeSelect({ value, courseId, semId }) {
  const updateCourse = useAppStore(s => s.updateCourse)
  return (
    <select value={value} onChange={e => updateCourse(courseId, 'grade', e.target.value)}>
      {Object.keys(GP).map(g => <option key={g} value={g}>{g}</option>)}
    </select>
  )
}

export default function Semesters() {
  const sems = useAppStore(s => s.sems)
  const activeId = useAppStore(s => s.activeId)
  const switchSem = useAppStore(s => s.switchSem)
  const addCourse = useAppStore(s => s.addCourse)
  const updateCourse = useAppStore(s => s.updateCourse)
  const removeCourse = useAppStore(s => s.removeCourse)

  const sem = sems.find(s => s.id === activeId) || sems[0] || null
  const semCg = sem ? calcCg(sem.courses) : 0
  const semHas = sem ? sem.courses.some(c => (parseFloat(c.credit) || 0) > 0) : false
  const { label: semChipLabel, cls: semChipCls } = ugcStatus(semCg, semHas)

  let totalCr = 0, totalWPts = 0
  sems.forEach(s => s.courses.forEach(c => {
    const x = parseFloat(c.credit) || 0; totalCr += x; totalWPts += weightedPoints(c.grade, x)
  }))

  // Animated refs
  const semDisplayRef = useRef(); const totalCrRef = useRef(); const semCountRef = useRef()
  useEffect(() => {
    if (semDisplayRef.current) { semDisplayRef.current.dataset.v = '0'; animNum(semDisplayRef.current, semCg.toFixed(2), 2) }
    if (totalCrRef.current)   { totalCrRef.current.dataset.v = '0'; animNum(totalCrRef.current, totalCr, 0) }
    if (semCountRef.current)  { semCountRef.current.dataset.v = '0'; animNum(semCountRef.current, sems.length, 0) }
  }, [activeId, sems])

  const semCr = sem ? sem.courses.reduce((s, c) => s + (parseFloat(c.credit) || 0), 0) : 0

  // Ensure a semester exists
  useEffect(() => {
    if (sems.length === 0) openModal('addSem')
  }, [])

  return (
    <>
      <div className="vhead"><h2 className="vtitle">Semesters</h2><p className="vsub">Manage your courses and calculate GPA per semester</p></div>

      <div className="calc-stats">
        <div className="cstat">
          <p className="cstat-label">This Semester CG</p>
          <p className="cstat-val blue" ref={semDisplayRef} id="semDisplay">0.00</p>
          <span className={`chip ${semChipCls}`}>{semChipLabel}</span>
          <p className="cstat-sub">{sem ? sem.courses.length : 0} courses · {semCr} credits</p>
        </div>
        <div className="cstat">
          <p className="cstat-label">Total Credits</p>
          <p className="cstat-val" ref={totalCrRef} id="totalCrDisplay">0</p>
          <p className="cstat-sub">all semesters</p>
        </div>
        <div className="cstat">
          <p className="cstat-label">Semesters</p>
          <p className="cstat-val" ref={semCountRef} id="semCountDisplay">0</p>
          <p className="cstat-sub">logged so far</p>
        </div>
      </div>

      {/* Semester tabs bar */}
      <div className="sem-bar">
        <div className="sem-tabs-scroll">
          <div className="sem-tabs">
            {sems.map(s => (
              <button key={s.id} className={`sem-tab ${s.id === (sem?.id) ? 'active' : ''}`} onClick={() => switchSem(s.id)}>
                <span>{s.name}</span>
                {sems.length > 1 && (
                  <span className="tab-x" onClick={e => { e.stopPropagation(); openModal('delSem', { id: s.id, name: s.name }) }}>✕</span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="sem-bar-actions">
          <button className="sem-act-btn add-sem-btn" onClick={() => openModal('addSem')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Add</span>
          </button>
          <button className="sem-act-btn clear-btn" onClick={() => openModal('clearAll')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Course panel */}
      {sem && (
        <div className="glass-panel">
          <div className="cp-head">
            <div className="cp-head-left">
              <span className="cp-title">{sem.name}</span>
              <div className="sem-cg-pill">
                <span className="scg-lbl">SEM CG</span>
                <span className="scg-val">{semCg.toFixed(2)}</span>
              </div>
            </div>
            <button className="add-course-btn" onClick={addCourse}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Course
            </button>
          </div>

          {/* Desktop table */}
          <div className="tbl-scroll">
            <table className="ctbl">
              <thead>
                <tr>
                  <th className="th-n">#</th>
                  <th className="th-name">Course</th>
                  <th className="th-g">Grade</th>
                  <th className="th-cr">Credits</th>
                  <th className="th-gp">Grade Point</th>
                  <th className="th-bar">Level</th>
                  <th className="th-x"></th>
                </tr>
              </thead>
              <tbody>
                {sem.courses.map((c, i) => {
                  const gp = gpOfGrade(c.grade)
                  const pct = (gp / 4) * 100
                  const col = GCOL[c.grade] || '#6b7280'
                  return (
                    <tr key={c.id}>
                      <td className="td-n">{i + 1}</td>
                      <td><input type="text" placeholder="Course name" defaultValue={c.name}
                        onBlur={e => updateCourse(c.id, 'name', e.target.value)} /></td>
                      <td><GradeSelect value={c.grade} courseId={c.id} semId={sem.id} /></td>
                      <td><input type="number" min="0" max="6" step="1"
                        value={c.credit ?? ''}
                        onChange={e => updateCourse(c.id, 'credit', e.target.value)} /></td>
                      <td className="td-gp">{gp.toFixed(2)}</td>
                      <td>
                        <div className="gbar-wrap">
                          <div className="gbar-track"><div className="gbar-fill" style={{ width: `${pct}%`, background: col }} /></div>
                          <span className="gbar-pct">{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td><button className="xbtn" onClick={() => removeCourse(c.id)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mob-courses">
            {sem.courses.map((c, i) => {
              const gp = gpOfGrade(c.grade)
              return (
                <div key={c.id} className="mob-card">
                  <div className="mob-top">
                    <span className="mob-idx">Course {i + 1}</span>
                    <span className="mob-gp">{gp.toFixed(2)} GP</span>
                    <button className="mob-del" onClick={() => removeCourse(c.id)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  <div className="mob-fields">
                    <div className="mob-field full"><label>Course Name</label>
                      <input type="text" placeholder="e.g. Software Engineering" defaultValue={c.name}
                        onBlur={e => updateCourse(c.id, 'name', e.target.value)} /></div>
                    <div className="mob-field"><label>Grade</label>
                      <GradeSelect value={c.grade} courseId={c.id} semId={sem.id} /></div>
                    <div className="mob-field"><label>Credits</label>
                      <input type="number" min="0" max="6" step="1"
                        value={c.credit ?? ''}
                        onChange={e => updateCourse(c.id, 'credit', e.target.value)} /></div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="cp-foot">
            <span>{sem.courses.length} course{sem.courses.length !== 1 ? 's' : ''} · {semCr} credits</span>
            <span>Sem CG: <strong className="blue-txt">{semCg.toFixed(2)}</strong></span>
          </div>
        </div>
      )}
    </>
  )
}
