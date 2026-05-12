import { useState, useEffect, useCallback } from 'react'
import useAppStore from '../store/useAppStore'
import { GCOL } from '../constants'
import { openModal } from '../components/Modals'

const THRESHOLDS = [
  { grade: 'A+', min: 80 }, { grade: 'A',  min: 75 }, { grade: 'A-', min: 70 },
  { grade: 'B+', min: 65 }, { grade: 'B',  min: 60 }, { grade: 'B-', min: 55 },
  { grade: 'C+', min: 50 }, { grade: 'C',  min: 45 }, { grade: 'D',  min: 40 },
  { grade: 'F',  min: 0  },
]
const FINAL_MAX = 40

function num(v)    { return parseFloat(v) || 0 }
function hasVal(v) { return v !== null && v !== undefined && v !== '' }

// Always divide by 3 — partial quizzes still count out of 3-quiz quota
function calcQuizMarks(q1, q2, q3, q4) {
  const entered = [q1, q2, q3, q4].filter(hasVal).map(num)
  if (!entered.length) return { marks: 0, entered: false }
  const best = [...entered].sort((a, b) => b - a).slice(0, 3)
  return { marks: best.reduce((a, b) => a + b, 0) / 3, entered: true }
}

function calcAttendance(pct) {
  if (!hasVal(pct)) return { marks: 0, entered: false }
  return { marks: Math.min((num(pct) / 100) * 7, 7), entered: true }
}

function calcObtained(perf) {
  const quiz = calcQuizMarks(perf.quiz1, perf.quiz2, perf.quiz3, perf.makeup_quiz)
  const att  = calcAttendance(perf.attendance_pct)
  const mid  = hasVal(perf.midterm)      ? num(perf.midterm)      : 0
  const asgn = hasVal(perf.assignment)   ? num(perf.assignment)   : 0
  const pres = hasVal(perf.presentation) ? num(perf.presentation) : 0
  let maxSoFar = 0
  if (quiz.entered)              maxSoFar += 15
  if (hasVal(perf.midterm))      maxSoFar += 25
  if (hasVal(perf.assignment))   maxSoFar += 5
  if (hasVal(perf.presentation)) maxSoFar += 8
  if (att.entered)               maxSoFar += 7
  return { total: quiz.marks + mid + asgn + pres + att.marks, maxSoFar }
}

function marksToGrade(t) {
  for (const g of THRESHOLDS) if (t >= g.min) return g.grade
  return 'F'
}
function needed(obtained, grade) {
  const g = THRESHOLDS.find(x => x.grade === grade)
  return g ? Math.max(0, g.min - obtained) : null
}

function MarkInput({ label, value, onChange, max, unit, hint }) {
  return (
    <div className="ct-mark-row">
      <div className="ct-mark-info">
        <span className="ct-mark-label">{label}</span>
        {hint && <span className="ct-mark-hint">{hint}</span>}
      </div>
      <div className="ct-mark-right">
        <input type="number" className="ct-mark-input" placeholder="—"
          min={0} max={max} step={0.5} value={value}
          onChange={e => onChange(e.target.value)} />
        <span className="ct-weight-badge">/{max}{unit||''}</span>
      </div>
    </div>
  )
}

export default function CourseTracker() {
  const sems            = useAppStore(s => s.sems)
  const coursePerf      = useAppStore(s => s.coursePerf)
  const loadPerformance = useAppStore(s => s.loadPerformance)
  const savePerformance = useAppStore(s => s.savePerformance)
  const updateCourse    = useAppStore(s => s.updateCourse)
  const addCourseToSem  = useAppStore(s => s.addCourseToSem)
  const removeCourse    = useAppStore(s => s.removeCourse)

  const [selSemId,     setSelSemId]     = useState(sems[0]?.id || null)
  const [selCourseId,  setSelCourseId]  = useState(null)
  const [targetGrade,  setTargetGrade]  = useState('A+')
  const [localPerf,    setLocalPerf]    = useState({})
  const [courseName,   setCourseName]   = useState('')
  const [courseCredit, setCourseCredit] = useState('')
  const [adding,       setAdding]       = useState(false)
  const [search,       setSearch]       = useState('')

  const selSem    = sems.find(s => s.id === selSemId) || sems[0] || null
  const selCourse = selSem?.courses.find(c => c.id === selCourseId) || null

  // Auto-select new semester when sems list changes (e.g. after addSemester)
  useEffect(() => {
    if (!selSemId && sems.length > 0) {
      setSelSemId(sems[sems.length - 1].id)
      return
    }
    // If current sem no longer exists, pick the last one
    if (selSemId && !sems.find(s => s.id === selSemId) && sems.length > 0) {
      setSelSemId(sems[sems.length - 1].id)
      return
    }
    // If a brand-new semester was just added (store activeId points to it), follow it
    const storeActiveId = useAppStore.getState().activeId
    if (storeActiveId && storeActiveId !== selSemId && sems.find(s => s.id === storeActiveId)) {
      setSelSemId(storeActiveId)
    }
  }, [sems.length])

  useEffect(() => { setSelCourseId(null); setLocalPerf({}); setSearch('') }, [selSemId])

  useEffect(() => {
    if (!selCourseId || !selSemId) return
    const cached = coursePerf[selCourseId]
    if (cached) setLocalPerf(cached)
    else loadPerformance(selSemId, selCourseId).then(d => setLocalPerf(d))
    setCourseName(selCourse?.name || '')
    setCourseCredit(selCourse?.credit ?? '')
  }, [selCourseId])

  useEffect(() => {
    if (selCourseId && coursePerf[selCourseId])
      setLocalPerf(prev => ({ ...prev, ...coursePerf[selCourseId] }))
  }, [coursePerf, selCourseId])

  const handleMark = useCallback((field, value) => {
    setLocalPerf(prev => {
      const next = { ...prev, [field]: value }
      if (selSemId && selCourseId) {
        savePerformance(selSemId, selCourseId, { [field]: value === '' ? null : parseFloat(value) })
        if (hasVal(next.final_exam)) {
          const { total } = calcObtained(next)
          updateCourse(selCourseId, 'grade', marksToGrade(total + num(next.final_exam)))
        }
      }
      return next
    })
  }, [selSemId, selCourseId, savePerformance, updateCourse])

  const handleAddCourse = async () => {
    if (!selSemId) { openModal('addSem'); return }
    setAdding(true)
    try { const nc = await addCourseToSem(selSemId); setSelCourseId(nc.id) }
    finally { setAdding(false) }
  }

  const p          = localPerf
  const quiz       = calcQuizMarks(p.quiz1, p.quiz2, p.quiz3, p.makeup_quiz)
  const att        = calcAttendance(p.attendance_pct)
  const { total: obtained, maxSoFar } = calcObtained(p)
  const pct        = maxSoFar > 0 ? Math.min((obtained / maxSoFar) * 100, 100) : 0
  const reqMarks   = needed(obtained, targetGrade)
  const impossible = reqMarks > FINAL_MAX
  const secured    = reqMarks <= 0
  const barColor   = GCOL[marksToGrade((obtained / (maxSoFar || 60)) * 100)] || '#818cf8'

  const quizBreakdown = (() => {
    const slots = [
      { key: 'Q1', v: p.quiz1 }, { key: 'Q2', v: p.quiz2 },
      { key: 'Q3', v: p.quiz3 }, { key: 'Q4', v: p.makeup_quiz },
    ].filter(q => hasVal(q.v)).map(q => ({ ...q, n: num(q.v) }))
    if (!slots.length) return []
    const bestKeys = new Set([...slots].sort((a,b)=>b.n-a.n).slice(0,3).map(q=>q.key))
    return slots.map(q => ({ ...q, best: bestKeys.has(q.key) }))
  })()

  const filteredCourses = selSem?.courses.filter(c =>
    (c.name||'Unnamed').toLowerCase().includes(search.toLowerCase())
  ) ?? []

  return (
    <div className="ct-root">
      <div className="vhead">
        <h2 className="vtitle">Course Tracker</h2>
        <p className="vsub">Track assessment marks · Predict your final exam requirement · Synced with Semester CGPA</p>
      </div>

      {/* ── Semester tabs bar ── */}
      <div className="ct-sem-bar glass-panel">
        <div className="ct-sem-tabs-scroll">
          <div className="ct-sem-tabs">
            {sems.length === 0 ? (
              <span className="ct-sem-empty">No semesters — add one →</span>
            ) : sems.map(s => (
              <button key={s.id}
                className={`ct-sem-tab ${s.id === selSemId ? 'active' : ''} ${s.status === 'in_progress' ? 'ct-sem-tab-ip' : ''}`}
                onClick={() => setSelSemId(s.id)}>
                <span>{s.name}</span>
                {s.status === 'in_progress' && <span className="sem-tab-ip-dot" title="In Progress" />}
                {sems.length > 1 && (
                  <span className="ct-sem-tab-x" onClick={e => { e.stopPropagation(); openModal('delSem', { id: s.id, name: s.name }) }}>✕</span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="ct-sem-bar-actions">
          <button className="ct-sem-add-tab-btn" onClick={() => openModal('addSem')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>Add Semester</span>
          </button>
        </div>
      </div>

      {/* ── Course tabs bar (search + add + chips) ── */}
      {selSem && (
        <div className="ct-tabs-bar glass-panel">
          <div className="ct-tabs-top">
            <span className="ct-tabs-bar-title">Your Courses</span>
            <div className="ct-search-wrap">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input className="ct-search-input" placeholder="Search courses…"
                value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button className="ct-search-clear" onClick={() => setSearch('')}>✕</button>}
            </div>
            <button className="ct-add-course-btn" onClick={handleAddCourse} disabled={adding}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              {adding ? 'Adding…' : 'Add Course'}
            </button>
            {selSem.courses.length > 0 && (
              <button className="ct-del-all-btn"
                onClick={() => openModal('clearSemCourses', { semId: selSemId, semName: selSem.name })}
                title="Delete all courses in this semester">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/>
                </svg>
                Delete All
              </button>
            )}
          </div>
          {selSem.courses.length > 0 && (
            <div className="ct-tabs-scroll">
              <div className="ct-tabs">
                {filteredCourses.map(c => {
                  const gc = GCOL[c.grade] || '#6b7280'
                  const active = selCourseId === c.id
                  return (
                    <button key={c.id}
                      className={`ct-course-tab ${active ? 'active' : ''}`}
                      style={active ? { borderColor: gc+'55', background: gc+'14' } : {}}
                      onClick={() => setSelCourseId(c.id)}
                    >
                      <span className="ct-tab-dot" style={{ background: gc }} />
                      <span className="ct-tab-name">{c.name || 'Unnamed'}</span>
                      <span className="ct-tab-grade" style={{ color: gc }}>{c.grade}</span>
                      {active && (
                        <span className="ct-tab-del" title="Delete course"
                          onClick={e => { e.stopPropagation(); openModal('delCourse', { id: c.id, name: c.name || 'Unnamed' }) }}>
                          ✕
                        </span>
                      )}
                    </button>
                  )
                })}
                {filteredCourses.length === 0 && search && (
                  <span className="ct-tabs-empty">No match for "{search}"</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Body ── */}
      {!selSem ? (
        <div className="ct-empty-state glass-panel">
          <div className="ct-empty-ico">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <p className="ct-empty-title">Create a semester to get started</p>
          <p className="ct-empty-sub">Tap the semester selector above and add your first semester.</p>
        </div>
      ) : !selCourse ? (
        <div className="ct-empty-state glass-panel">
          <div className="ct-empty-ico">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="13" x2="12" y2="17"/><line x1="10" y1="15" x2="14" y2="15"/>
            </svg>
          </div>
          <p className="ct-empty-title">{selSem.courses.length === 0 ? 'No courses yet' : 'Select a course above'}</p>
          <p className="ct-empty-sub">
            {selSem.courses.length === 0
              ? 'Click "Add Course" to create your first course for this semester. Grades sync to Semester CGPA automatically.'
              : 'Click any course tab above to view and update assessment marks and see grade predictions.'}
          </p>
          {selSem.courses.length === 0 && (
            <button className="ct-empty-cta" onClick={handleAddCourse} disabled={adding}>
              {adding ? 'Adding…' : '+ Add First Course'}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Course header */}
          <div className="ct-course-header glass-panel">
            <div className="ct-ch-left">
              <input className="ct-course-name-input" type="text"
                placeholder="Course name…" value={courseName}
                onChange={e => setCourseName(e.target.value)}
                onBlur={() => { if (selCourseId && courseName !== selCourse?.name) updateCourse(selCourseId, 'name', courseName) }}
              />
              <div className="ct-ch-meta" style={{ marginTop: '8px' }}>
                <span className="ct-ch-sem-tag">{selSem.name}</span>

                <div className="ct-ch-cr-wrap">
                  <input className="ct-fh-cr-input" type="number" min="0" max="6" step="0.5"
                    value={courseCredit} title="Edit credits"
                    onChange={e => setCourseCredit(e.target.value)}
                    onBlur={() => {
                      const v = parseFloat(courseCredit)
                      if (selCourseId && !isNaN(v) && v !== parseFloat(selCourse?.credit))
                        updateCourse(selCourseId, 'credit', v)
                    }}
                  />
                  <span className="ct-fh-cr-label">credits</span>
                </div>
              </div>
            </div>
            <div className="ct-ch-right">
              <div className="ct-ch-obtained">
                <div className="ct-ch-obt-row">
                  <span className="ct-ch-obt-num" style={{ color: barColor }}>{obtained.toFixed(2)}</span>
                  <span className="ct-ch-obt-max">/ {maxSoFar||60} pre-final</span>
                  <span className="ct-ob-pct-pill" style={{ borderColor: barColor+'55', color: barColor }}>
                    {maxSoFar > 0 ? `${((obtained/maxSoFar)*100).toFixed(1)}%` : '—'}
                  </span>
                </div>
                <div className="ct-ob-track">
                  <div className="ct-ob-fill" style={{ width:`${pct}%`, background:`linear-gradient(90deg,${barColor}99,${barColor})` }} />
                </div>
              </div>
              <div className="ct-ch-grade" style={{ color: GCOL[selCourse.grade] }}>
                <span className="ct-ch-grade-val">{selCourse.grade}</span>
                <span className="ct-ch-grade-lbl">current grade</span>
              </div>
            </div>
          </div>

          {/* Two-column body */}
          <div className="ct-body-grid">

            {/* LEFT — Assessments */}
            <div className="ct-form-panel glass-panel">

              <div className="ct-section">
                <div className="ct-section-header">
                  <div className="ct-section-dot" style={{ background:'#818cf8' }}/>
                  <span>Quizzes</span>
                  <span className="ct-section-badge">Best 3 of 4 · /15 each</span>
                  <span className="ct-section-weight">15 marks</span>
                </div>
                <div className="ct-marks-grid">
                  <MarkInput label="Quiz 1" max={15} value={p.quiz1??''} onChange={v=>handleMark('quiz1',v)}/>
                  <MarkInput label="Quiz 2" max={15} value={p.quiz2??''} onChange={v=>handleMark('quiz2',v)}/>
                  <MarkInput label="Quiz 3" max={15} value={p.quiz3??''} onChange={v=>handleMark('quiz3',v)}/>
                  <MarkInput label="Quiz 4 / Makeup" max={15} value={p.makeup_quiz??''} onChange={v=>handleMark('makeup_quiz',v)}
                    hint="Optional — best 3 of all taken counted, avg ÷ 3"/>
                </div>
                {quizBreakdown.length > 0 && (
                  <div className="ct-quiz-breakdown">
                    <span className="ct-qb-label">Best 3:</span>
                    {quizBreakdown.map(q => (
                      <span key={q.key} className={`ct-qb-score ${q.best?'':'ct-qb-dropped'}`}>
                        {q.key}:{q.n.toFixed(1)}{!q.best && <span className="ct-qb-drop-x">✕</span>}
                      </span>
                    ))}
                    <span className="ct-qb-result">→ {quiz.marks.toFixed(2)}/15</span>
                  </div>
                )}
              </div>

              <div className="ct-section-divider"/>

              <div className="ct-section">
                <div className="ct-section-header">
                  <div className="ct-section-dot" style={{ background:'#22d3ee' }}/>
                  <span>Core Assessments</span>
                  <span className="ct-section-weight">45 marks</span>
                </div>
                <div className="ct-marks-grid">
                  <MarkInput label="Midterm Exam" max={25} value={p.midterm??''} onChange={v=>handleMark('midterm',v)}/>
                  <MarkInput label="Assignment"   max={5}  value={p.assignment??''} onChange={v=>handleMark('assignment',v)}/>
                  <MarkInput label="Presentation" max={8}  value={p.presentation??''} onChange={v=>handleMark('presentation',v)}/>
                  <MarkInput label="Attendance" max={100} unit="%" value={p.attendance_pct??''} onChange={v=>handleMark('attendance_pct',v)}
                    hint={att.entered ? `= ${att.marks.toFixed(2)} / 7 marks` : 'Enter % → auto-converts to /7'}/>
                </div>
              </div>

              <div className="ct-section-divider"/>

              <div className="ct-final-section">
                <div className="ct-section-header">
                  <div className="ct-section-dot" style={{ background:'#f472b6' }}/>
                  <span>Final Exam</span>
                  <span className="ct-section-weight">40 marks</span>
                </div>
                <MarkInput label="Final Exam Score" max={40} value={p.final_exam??''} onChange={v=>handleMark('final_exam',v)}
                  hint={hasVal(p.final_exam)
                    ? `Total: ${(obtained+num(p.final_exam)).toFixed(2)}/100 → ${marksToGrade(obtained+num(p.final_exam))}`
                    : 'Enter after exam to lock in grade'}/>
              </div>
            </div>

            {/* RIGHT — Grade Prediction */}
            <div className="ct-prediction-panel glass-panel">
              <div className="ct-pred-header">
                <div className="ct-pred-title-row">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                  </svg>
                  <span className="ct-pred-title">Grade Prediction</span>
                </div>
                <p className="ct-pred-sub">Tap a target grade to see required final exam marks</p>
              </div>

              <div className="ct-target-grades">
                {THRESHOLDS.map(({ grade }) => {
                  const n = needed(obtained, grade)
                  const imp = n > FINAL_MAX, done = n <= 0
                  return (
                    <button key={grade}
                      className={`ct-tg-btn ${targetGrade===grade?'active':''} ${imp?'impossible':done?'done':''}`}
                      style={targetGrade===grade ? { borderColor:GCOL[grade], color:GCOL[grade], background:GCOL[grade]+'18' } : {}}
                      onClick={() => setTargetGrade(grade)}
                    >{grade}</button>
                  )
                })}
              </div>

              <div className={`ct-result ${impossible?'ct-result-impossible':secured?'ct-result-done':'ct-result-possible'}`}>
                {secured ? (
                  <>
                    <div className="ct-result-ico ct-ico-done">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    </div>
                    <div>
                      <p className="ct-result-headline">Target Secured!</p>
                      <p className="ct-result-note">You've locked in <strong>{targetGrade}</strong> — even scoring 0 in the final.</p>
                    </div>
                  </>
                ) : impossible ? (
                  <>
                    <div className="ct-result-ico ct-ico-impossible">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                    </div>
                    <div>
                      <p className="ct-result-headline">Not Achievable</p>
                      <p className="ct-result-note">Need <strong>{reqMarks.toFixed(1)}</strong>/{FINAL_MAX} — exceeds max. Try lower target.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="ct-result-main">
                      <p className="ct-result-label">Marks needed in Final Exam</p>
                      <p className="ct-result-needed" style={{ color: GCOL[targetGrade] }}>
                        {reqMarks.toFixed(1)}<span className="ct-result-outof">/{FINAL_MAX}</span>
                      </p>
                      <p className="ct-result-note">Score <strong>{reqMarks.toFixed(1)}+</strong> to achieve <strong>{targetGrade}</strong>.</p>
                    </div>
                    <div className="ct-result-bar-wrap">
                      <div className="ct-result-track">
                        <div className="ct-result-fill" style={{
                          width:`${Math.min((reqMarks/FINAL_MAX)*100,100)}%`,
                          background:`linear-gradient(90deg,${GCOL[targetGrade]}88,${GCOL[targetGrade]})`
                        }}/>
                      </div>
                      <span className="ct-result-pct">{((reqMarks/FINAL_MAX)*100).toFixed(0)}% of final</span>
                    </div>
                  </>
                )}
              </div>

              <div className="ct-scenarios">
                <p className="ct-sc-title">All Grade Scenarios</p>
                <div className="ct-sc-table">
                  {THRESHOLDS.map(({ grade, min }) => {
                    const n = needed(obtained, grade)
                    const imp = n > FINAL_MAX, done = n <= 0
                    const gc = GCOL[grade]||'#6b7280'
                    return (
                      <div key={grade} className={`ct-sc-row ${targetGrade===grade?'active':''}`} onClick={() => setTargetGrade(grade)}>
                        <span className="ct-sc-grade" style={{ color:gc }}>{grade}</span>
                        <span className="ct-sc-threshold">≥{min}%</span>
                        <div className="ct-sc-bar-wrap">
                          <div className="ct-sc-track">
                            {!imp&&!done&&<div className="ct-sc-fill" style={{ width:`${Math.min((n/FINAL_MAX)*100,100)}%`,background:gc+'aa' }}/>}
                            {done&&<div className="ct-sc-fill" style={{ width:'100%',background:'#4ade80aa' }}/>}
                          </div>
                        </div>
                        <span className={`ct-sc-badge ${imp?'badge-red':done?'badge-green':'badge-blue'}`}>
                          {done?'Secured':imp?'N/A':`${n.toFixed(1)}/${FINAL_MAX}`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
