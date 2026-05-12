import { useEffect, useRef } from 'react'
import useAppStore from '../store/useAppStore'
import { calcCg, ugcStatus, weightedPoints, gpOfGrade, calcOfficialCgpa, calcEstimatedCgpa } from '../utils'
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
    const p = Math.min((now - t0) / dur, 1)
    el.textContent = (start + (end - start) * ease(p)).toFixed(dec)
    if (p < 1) requestAnimationFrame(run)
    else el.textContent = end.toFixed(dec)
  }
  requestAnimationFrame(run)
}

// Map CGPA value to GPA classification colour (matches Analytics > GPA Classification)
function cgColor(cg, hasData) {
  if (!hasData) return 'var(--text3)'
  if (cg >= 3.75) return '#34d399'  // Outstanding / Excellent
  if (cg >= 3.50) return '#22d3ee'  // Very Good
  if (cg >= 3.25) return '#818cf8'  // Good
  if (cg >= 3.00) return '#a78bfa'  // Satisfactory
  if (cg >= 2.75) return '#fbbf24'  // Above Average
  if (cg >= 2.50) return '#fb923c'  // Average
  if (cg >= 2.00) return '#f87171'  // Pass / Below Average
  return '#94a3b8'                   // Fail
}

export default function Dashboard({ setActiveView }) {
  const sems = useAppStore(s => s.sems)
  const switchSem = useAppStore(s => s.switchSem)

  // Official CGPA — completed sems only
  const { cgpa, totalCr, totalWPts } = calcOfficialCgpa(sems)
  const hasData = totalCr > 0

  // Estimated CGPA — all sems (only relevant when in-progress sems exist)
  const { cgpa: estCgpa, totalCr: estCr } = calcEstimatedCgpa(sems)
  const hasInProgress = sems.some(s => s.status === 'in_progress')
  const hasEstData = estCr > 0

  const completedSems = sems.filter(s => s.status !== 'in_progress')
  const totalCourses = completedSems.reduce((a, s) => a + s.courses.length, 0)
  const completedSemCount = completedSems.length

  const { label: chipLabel, cls: chipCls } = ugcStatus(cgpa, hasData)
  const { label: estChipLabel, cls: estChipCls } = ugcStatus(estCgpa, hasEstData)

  // Animated stat refs
  const cgpaRef = useRef(); const crRef = useRef()
  const courseRef = useRef(); const semRef = useRef()
  const estCgpaRef = useRef()

  useEffect(() => {
    if (cgpaRef.current)   { cgpaRef.current.dataset.v   = '0'; animNum(cgpaRef.current, cgpa.toFixed(2), 2) }
    if (estCgpaRef.current){ estCgpaRef.current.dataset.v = '0'; animNum(estCgpaRef.current, estCgpa.toFixed(2), 2) }
    if (crRef.current)     { crRef.current.dataset.v     = '0'; animNum(crRef.current, totalCr, 0) }
    if (courseRef.current) { courseRef.current.dataset.v  = '0'; animNum(courseRef.current, totalCourses, 0) }
    if (semRef.current)    { semRef.current.dataset.v    = '0'; animNum(semRef.current, completedSemCount, 0) }
  }, [sems])

  // Grade counts — completed sems only
  const counts = {}
  Object.keys(GP).forEach(g => counts[g] = 0)
  completedSems.forEach(s => s.courses.forEach(c => { if (counts[c.grade] !== undefined) counts[c.grade]++ }))
  const allCoursesList = []
  completedSems.forEach(sem => sem.courses.forEach(c => {
    if ((parseFloat(c.credit) || 0) > 0)
      allCoursesList.push({ name: c.name || 'Unnamed', grade: c.grade, gp: gpOfGrade(c.grade), sem: sem.name })
  }))
  allCoursesList.sort((a, b) => b.gp - a.gp)
  const top = allCoursesList.filter(c => c.gp >= 3.75).length
    ? allCoursesList.filter(c => c.gp >= 3.75)
    : allCoursesList.slice(0, 5)
  const worst = [...allCoursesList].sort((a, b) => a.gp - b.gp).filter(c => c.gp < 3.0)

  // Recent activity — all sems (including in-progress, as it's a log)
  const acts = []
  ;[...sems].reverse().forEach(sem => {
    ;[...sem.courses].reverse().forEach(c => {
      if (acts.length >= 6) return
      acts.push({ text: c.name ? `${c.name} — ${c.grade}` : `Course in ${sem.name} — ${c.grade}`, meta: sem.name, col: GCOL[c.grade] || '#6b7280' })
    })
  })

  // Quick insights — use official CGPA
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  const aRange = (counts['A+'] || 0) + (counts['A'] || 0) + (counts['A-'] || 0)
  const fails = counts['F'] || 0
  const bRange = (counts['B+'] || 0) + (counts['B'] || 0) + (counts['B-'] || 0)
  const cOrBelow = (counts['C+'] || 0) + (counts['C'] || 0) + (counts['D'] || 0)
  const semCgs = completedSems.map(s => calcCg(s.courses)).filter(v => v > 0)
  let consistency = '—'
  if (semCgs.length >= 2) {
    const mean = semCgs.reduce((a, b) => a + b, 0) / semCgs.length
    const sd = Math.sqrt(semCgs.map(v => (v - mean) ** 2).reduce((a, b) => a + b, 0) / semCgs.length)
    consistency = sd < 0.15 ? '🟢 Very Consistent' : sd < 0.35 ? '🟡 Moderate' : '🔴 High Variance'
  }
  const sortedSems = completedSems.filter(s => s.courses.some(c => (parseFloat(c.credit) || 0) > 0))
    .sort((a, b) => calcCg(b.courses) - calcCg(a.courses))
  const bestSemLabel = sortedSems.length ? `${sortedSems[0].name} (${calcCg(sortedSems[0].courses).toFixed(2)})` : '—'
  const { label: statusLabel } = ugcStatus(cgpa, hasData)
  const milestones = [{ t: 4.00, l: 'Outstanding' }, { t: 3.75, l: 'Excellent' }, { t: 3.50, l: 'Very Good' }, { t: 3.25, l: 'Good' }, { t: 3.00, l: 'Satisfactory' }]
  const nextMs = milestones.find(m => cgpa < m.t)
  const gapStr = nextMs ? `+${(nextMs.t - cgpa).toFixed(2)} to ${nextMs.l}` : 'Peak — 4.00!'

  const qiRows = [
    { l: 'Status', v: statusLabel || '—', c: cgpa >= 3.75 ? '#10b981' : cgpa >= 3.0 ? 'var(--cyan)' : '#f59e0b' },
    { l: 'GPA Completion', v: ((cgpa / 4) * 100).toFixed(1) + '%', c: 'var(--text)' },
    { l: 'Next Milestone', v: gapStr, c: 'var(--violet)' },
    { l: 'A-range Rate', v: total ? Math.round((aRange / total) * 100) + '%' : '—', c: '#10b981' },
    { l: 'B-range Rate', v: total ? Math.round((bRange / total) * 100) + '%' : '—', c: '#818cf8' },
    { l: 'Needs Attention', v: cOrBelow > 0 ? `${cOrBelow} course${cOrBelow > 1 ? 's' : ''}` : 'None', c: cOrBelow > 0 ? '#f97316' : '#10b981' },
    { l: 'Failed Courses', v: fails > 0 ? fails : 'None', c: fails > 0 ? '#ef4444' : '#10b981' },
    { l: 'Consistency', v: consistency, c: 'var(--text2)' },
    { l: 'Best Semester', v: bestSemLabel, c: '#f59e0b' },
    { l: 'Avg Credits/Sem', v: completedSemCount ? (totalCr / completedSemCount).toFixed(1) : '—', c: 'var(--text2)' },
  ]

  // Grade dist for dashboard
  const maxGd = Math.max(1, ...Object.values(counts))

  return (
    <>
      <div className="vhead"><h2 className="vtitle">Dashboard</h2><p className="vsub">Your academic performance at a glance</p></div>

      {/* Stat cards */}
      <div className="stats-grid">
        <div className="scard primary">
          <div className="scard-glow" />
          <p className="scard-label">Cumulative GPA</p>
          <p className="scard-val cstat-val-gradient" ref={cgpaRef} id="d_cgpa">0.00</p>
          <div className="scard-bar"><div className="scard-bar-fill" style={{ width: `${(cgpa / 4) * 100}%` }} /></div>
          <span className={`chip ${chipCls}`}>{chipLabel}</span>
          <p className="scard-sub">completed semesters only</p>
        </div>

        {/* Estimated CGPA — only shown when there are in-progress semesters */}
        {hasInProgress && (
          <div className="scard estimated-cgpa-card">
            <div className="scard-glow est-glow" />
            <div className="scard-label-row">
              <p className="scard-label">Estimated CGPA</p>
              <span className="est-ip-dot" title="In Progress" />
            </div>
            <p className="scard-val cstat-val-amber" ref={estCgpaRef} id="d_estCgpa">0.00</p>
            <div className="scard-bar">
              <div className="scard-bar-fill est-bar-fill" style={{ width: `${(estCgpa / 4) * 100}%` }} />
            </div>
            <span className={`chip ${estChipCls}`}>{estChipLabel}</span>
            <p className="scard-sub">Includes ongoing semesters</p>
          </div>
        )}

        <div className="scard">
          <p className="scard-label">Total Credits</p>
          <p className="scard-val" ref={crRef} id="d_totalCr">0</p>
          <p className="scard-sub">completed semesters</p>
        </div>
        <div className="scard">
          <p className="scard-label">Total Courses</p>
          <p className="scard-val" ref={courseRef} id="d_totalCourses">0</p>
          <p className="scard-sub">completed semesters</p>
        </div>
        <div className="scard">
          <p className="scard-label">Semesters</p>
          <p className="scard-val" ref={semRef} id="d_semCount">0</p>
          <p className="scard-sub">completed</p>
        </div>
      </div>

      {/* Semester overview */}
      <p className="section-title">Semester Performance</p>
      <div className="sem-overview">
        {sems.length === 0 && <p style={{ fontSize: 12, color: 'var(--text3)' }}>No semesters yet. Head to Semesters to add one.</p>}
        {sems.map((sem, i) => {
          const cg = calcCg(sem.courses)
          const cr = sem.courses.reduce((s, c) => s + (parseFloat(c.credit) || 0), 0)
          const has = sem.courses.some(c => (parseFloat(c.credit) || 0) > 0)
          const { label, cls } = ugcStatus(cg, has)
          const col = cgColor(cg, has)
          const isIP = sem.status === 'in_progress'
          return (
            <div key={sem.id} className={`sov-card ${isIP ? 'sov-card-inprogress' : ''}`}
                 onClick={() => { setActiveView('calculator'); switchSem(sem.id) }}>
              <div className="sov-card-top">
                <p className="sov-name">{sem.name}</p>
                {isIP && <span className="sem-ip-badge">In Progress</span>}
              </div>
              <p className="sov-cg" style={{ color: col }}>{cg.toFixed(2)}</p>
              <p className="sov-info">{sem.courses.length} courses · {cr} credits</p>
              <span className={`chip ${cls} sov-chip`}>{label}</span>
            </div>
          )
        })}
      </div>

      {/* Best/Worst/GradeDist */}
      <div className="three-col">
        <div className="glass-panel mini-panel">
          <p className="an-label">🏆 Best Performing Courses</p>
          <div className="scroll-panel">
            {top.length === 0 ? <p style={{ fontSize: 12, color: 'var(--text3)', padding: '8px 0' }}>No courses with credits yet.</p>
              : top.map((c, i) => (
                <div key={i} className="course-row-item">
                  <span className="cri-name">{c.name}</span>
                  <span className="cri-grade" style={{ color: GCOL[c.grade] || '#6b7280' }}>{c.grade}</span>
                  <span className="cri-sem">{c.sem}</span>
                </div>
              ))}
          </div>
        </div>
        <div className="glass-panel mini-panel">
          <p className="an-label">⚠️ Needs Improvement</p>
          <div className="scroll-panel">
            {worst.length === 0 ? <p style={{ fontSize: 12, color: 'var(--text3)', padding: '8px 0' }}>All courses at 3.00+ — great job!</p>
              : worst.map((c, i) => (
                <div key={i} className="course-row-item">
                  <span className="cri-name">{c.name}</span>
                  <span className="cri-grade" style={{ color: GCOL[c.grade] || '#6b7280' }}>{c.grade}</span>
                  <span className="cri-sem">{c.sem}</span>
                </div>
              ))}
          </div>
        </div>
        <div className="glass-panel mini-panel">
          <p className="an-label">📊 Grade Distribution</p>
          <div className="dash-grade-dist scroll-panel">
            {Object.entries(counts).filter(([, n]) => n > 0).map(([g, n]) => (
              <div key={g} className="dg-row">
                <span className="dg-g" style={{ color: GCOL[g] }}>{g}</span>
                <div className="dg-track"><div className="dg-fill" style={{ width: `${(n / maxGd) * 100}%`, background: GCOL[g] }} /></div>
                <span className="dg-cnt">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity + Quick insights */}
      <div className="two-col">
        <div className="glass-panel mini-panel">
          <p className="an-label">🕐 Recent Activity</p>
          {acts.length === 0
            ? <p style={{ fontSize: 12, color: 'var(--text3)', padding: '8px 0' }}>No activity yet. Add courses in Semesters.</p>
            : acts.map((a, i) => (
              <div key={i} className="activity-item">
                <div className="act-dot" style={{ background: a.col }} />
                <div><div className="act-text">{a.text}</div><div className="act-meta">{a.meta}</div></div>
              </div>
            ))}
        </div>
        <div className="glass-panel mini-panel">
          <p className="an-label">⚡ Quick Insights</p>
          {total === 0
            ? <div className="qi-item"><span className="qi-label">Status</span><span className="qi-val" style={{ color: 'var(--text3)' }}>No data yet</span></div>
            : qiRows.map((r, i) => (
              <div key={i} className="qi-item">
                <span className="qi-label">{r.l}</span>
                <span className="qi-val" style={{ color: r.c }}>{r.v}</span>
              </div>
            ))}
        </div>
      </div>
    </>
  )
}
