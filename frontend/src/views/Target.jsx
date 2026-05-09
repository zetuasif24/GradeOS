import { useState } from 'react'
import useAppStore from '../store/useAppStore'
import { weightedPoints } from '../utils'

export default function Target() {
  const sems = useAppStore(s => s.sems)
  const [targetCgpa, setTargetCgpa] = useState('')
  const [targetCredits, setTargetCredits] = useState('')
  const [targetRemSems, setTargetRemSems] = useState('')
  const [gradMode, setGradMode] = useState(false)

  let curCr = 0, curWPts = 0
  sems.forEach(s => s.courses.forEach(c => {
    const x = parseFloat(c.credit) || 0; curCr += x; curWPts += weightedPoints(c.grade, x)
  }))
  const curCgpa = curCr ? curWPts / curCr : 0

  const tgt = parseFloat(targetCgpa)
  const planned = parseFloat(targetCredits)
  const remSems = Math.max(1, parseFloat(targetRemSems) || 1)

  let needed = null, neededStr = '—', noteStr = 'Enter your target CGPA and planned credits above.'
  if (tgt && planned) {
    needed = ((tgt * (curCr + planned)) - curWPts) / planned
    if (needed <= 0) { neededStr = 'Already achieved!'; noteStr = '🎉 You\'ve already exceeded your target!' }
    else if (needed > 4) { neededStr = 'Not achievable'; noteStr = '⚠️ Target not achievable with planned credits.' }
    else {
      neededStr = needed.toFixed(2)
      noteStr = gradMode
        ? `Avg GPA of ${needed.toFixed(2)} per semester across ${remSems} semester${remSems!==1?'s':''} (${planned} cr total) → CGPA ${tgt.toFixed(2)}.`
        : `You need ${needed.toFixed(2)} GPA this semester to reach CGPA ${tgt.toFixed(2)}.`
    }
  }

  const scenarios = [
    { l: 'All A+', gpa: 4.00 }, { l: 'All A', gpa: 3.75 }, { l: 'All B+', gpa: 3.25 },
    { l: 'All B', gpa: 3.00 }, { l: 'All C+', gpa: 2.50 }, { l: 'All D', gpa: 2.00 },
  ]

  return (
    <>
      <div className="vhead"><h2 className="vtitle">Target Calculator</h2><p className="vsub">Find out what you need to reach your goal</p></div>
      <div className="target-layout">
        <div className="glass-panel target-panel">
          <div className="ti-group">
            <label className="ti-label">Target CGPA</label>
            <input className="ti-input" type="number" id="targetCgpa" min="0" max="4" step="0.01"
              placeholder="e.g. 3.75" value={targetCgpa} onChange={e => setTargetCgpa(e.target.value)} />
          </div>

          <div className="ti-toggle-row">
            <label className="ti-toggle-label">
              <input type="checkbox" id="gradToggle" checked={gradMode} onChange={e => setGradMode(e.target.checked)} />
              <span className="ti-toggle-track"><span className="ti-toggle-thumb" /></span>
              <span className="ti-toggle-text">Total Graduation Mode</span>
            </label>
            <span className="ti-toggle-sub">
              {gradMode ? 'Avg GPA per future semester to hit your CGPA target' : 'Uses remaining degree credits & future semesters'}
            </span>
          </div>

          <div className="ti-group">
            <label className="ti-label">{gradMode ? 'Total Remaining Credits (Degree)' : 'Planned Credits (Next Semester)'}</label>
            <input className="ti-input" type="number" id="targetCredits" min="1" max="500" step="0.5"
              placeholder="e.g. 15" value={targetCredits} onChange={e => setTargetCredits(e.target.value)} />
          </div>

          {gradMode && (
            <div className="ti-group">
              <label className="ti-label">Remaining Semesters</label>
              <input className="ti-input" type="number" id="targetRemSems" min="1" max="20" step="1"
                placeholder="e.g. 4" value={targetRemSems} onChange={e => setTargetRemSems(e.target.value)} />
            </div>
          )}

          <div className="ti-divider" />
          <div className="ti-result">
            <p className="tr-label">{gradMode ? 'Required Avg GPA Per Future Semester' : 'Required GPA This Semester'}</p>
            <p className="tr-val">{neededStr}</p>
            <p className="tr-note">{noteStr}</p>
          </div>
        </div>

        <div className="glass-panel target-vis-panel">
          <p className="an-label">Progress Comparison</p>
          <div className="tbar-list">
            <div className="tbar-row">
              <span className="tbar-lbl">Current</span>
              <div className="tbar-track"><div className="tbar-fill tbar-current" style={{ width: `${(curCgpa / 4) * 100}%` }} /></div>
              <span className="tbar-num">{curCgpa.toFixed(2)}</span>
            </div>
            <div className="tbar-row">
              <span className="tbar-lbl">Target</span>
              <div className="tbar-track"><div className="tbar-fill tbar-target" style={{ width: tgt ? `${(tgt / 4) * 100}%` : '0%' }} /></div>
              <span className="tbar-num">{tgt ? tgt.toFixed(2) : '—'}</span>
            </div>
            <div className="tbar-row">
              <span className="tbar-lbl">Needed</span>
              <div className="tbar-track"><div className="tbar-fill tbar-needed" style={{ width: needed && needed > 0 && needed <= 4 ? `${(needed / 4) * 100}%` : '0%' }} /></div>
              <span className="tbar-num">{needed && needed > 0 && needed <= 4 ? needed.toFixed(2) : '—'}</span>
            </div>
          </div>

          {tgt && planned && (
            <div className="scenarios">
              {scenarios.map(({ l, gpa }) => {
                const newCgpa = ((curWPts + gpa * planned) / (curCr + planned)).toFixed(2)
                return (
                  <div key={l} className="sc-row">
                    <span>{l} {gradMode ? `(~${(planned / remSems).toFixed(1)} cr/sem)` : 'this semester'}</span>
                    <span className="sc-val">CGPA → {newCgpa}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
