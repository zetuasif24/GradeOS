import React, { useEffect, useRef, useState } from 'react'
import useAppStore from '../store/useAppStore'
import { calcCg, ugcStatus, gpOfGrade, weightedPoints } from '../utils'
import { GP, GCOL, SEM_COLORS } from '../constants'

export default function Analytics() {
  const sems = useAppStore(s => s.sems)
  const theme = useAppStore(s => s.theme)
  const donutRef = useRef()

  let totalCr = 0, totalWPts = 0
  sems.forEach(s => s.courses.forEach(c => {
    const x = parseFloat(c.credit) || 0; totalCr += x; totalWPts += weightedPoints(c.grade, x)
  }))
  const cgpa = totalCr ? totalWPts / totalCr : 0
  const isDark = theme !== 'light'

  // Trend SVG coords
  const trendPts = sems.map(s => calcCg(s.courses))
  const getTrendCoords = () => {
    if (sems.length < 2) return null
    const W = 700, H = 160, P = 28
    const mn = Math.max(0, Math.min(...trendPts) - 0.3)
    const mx = Math.min(4, Math.max(...trendPts) + 0.3)
    return trendPts.map((cg, i) => [P + i * (W - 2*P) / (sems.length-1), H - P - ((cg-mn)/(mx-mn))*(H-2*P)])
  }
  const tc = getTrendCoords()

  // Cumulative coords
  let cumCr = 0, cumW = 0
  const cumulPts = sems.map((sem, i) => {
    sem.courses.forEach(c => { const x = parseFloat(c.credit)||0; cumCr+=x; cumW+=weightedPoints(c.grade,x) })
    return { cg: cumCr ? cumW/cumCr : 0, label: sem.name }
  })
  const getCumulCoords = () => {
    if (cumulPts.length < 2) return null
    const W=700,H=140,P=20
    const mn=Math.max(0,Math.min(...cumulPts.map(p=>p.cg))-0.2)
    const mx=Math.min(4,Math.max(...cumulPts.map(p=>p.cg))+0.2)
    return cumulPts.map((p,i)=>[P+i*(W-2*P)/(cumulPts.length-1),H-P-((p.cg-mn)/(mx-mn))*(H-2*P)])
  }
  const cc = getCumulCoords()

  // Donut canvas
  useEffect(() => {
    const canvas = donutRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W=canvas.width,H=canvas.height,cx=W/2,cy=H/2,R=70,r=42
    let tot=0; const data=[]
    sems.forEach((sem,i)=>{
      const cr=sem.courses.reduce((s,c)=>s+(parseFloat(c.credit)||0),0); tot+=cr
      if(cr>0) data.push({label:sem.name,cr,color:SEM_COLORS[i%SEM_COLORS.length]})
    })
    ctx.clearRect(0,0,W,H)
    if(!data.length){ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.strokeStyle='rgba(255,255,255,.07)';ctx.lineWidth=28;ctx.stroke();return}
    let a=-Math.PI/2
    data.forEach(seg=>{const sw=(seg.cr/tot)*Math.PI*2;ctx.beginPath();ctx.arc(cx,cy,R,a,a+sw);ctx.strokeStyle=seg.color;ctx.lineWidth=28;ctx.lineCap='butt';ctx.stroke();a+=sw})
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=isDark?'#0d1020':'#fff';ctx.fill()
  }, [sems, theme])

  // Grade counts
  const counts={};Object.keys(GP).forEach(g=>counts[g]=0)
  const gradeMap={};Object.keys(GP).forEach(g=>gradeMap[g]=[])
  sems.forEach(s=>s.courses.forEach(c=>{
    if(counts[c.grade]!==undefined) counts[c.grade]++
    if(gradeMap[c.grade]!==undefined) gradeMap[c.grade].push({name:c.name||'Unnamed',sem:s.name})
  }))
  const maxGd=Math.max(1,...Object.values(counts))
  const total=Object.values(counts).reduce((a,b)=>a+b,0)
  const aRange=(counts['A+']||0)+(counts['A']||0)+(counts['A-']||0)
  const fails=counts['F']||0

  const withData=sems.filter(s=>s.courses.some(c=>(parseFloat(c.credit)||0)>0))
  const sortedS=[...withData].sort((a,b)=>calcCg(b.courses)-calcCg(a.courses))
  const best=sortedS[0],low=sortedS[sortedS.length-1]

  const classes=[
    {label:'Outstanding',range:'≥ 4.00',min:4.00,max:4.00,col:'#34d399'},
    {label:'Excellent',range:'3.75–3.99',min:3.75,max:3.99,col:'#22d3ee'},
    {label:'Very Good',range:'3.50–3.74',min:3.50,max:3.74,col:'#38bdf8'},
    {label:'Good',range:'3.25–3.49',min:3.25,max:3.49,col:'#818cf8'},
    {label:'Satisfactory',range:'3.00–3.24',min:3.00,max:3.24,col:'#a78bfa'},
    {label:'Above Average',range:'2.75–2.99',min:2.75,max:2.99,col:'#fbbf24'},
    {label:'Average',range:'2.50–2.74',min:2.50,max:2.74,col:'#fb923c'},
    {label:'Below Average',range:'2.25–2.49',min:2.25,max:2.49,col:'#f87171'},
    {label:'Pass',range:'2.00–2.24',min:2.00,max:2.24,col:'#94a3b8'},
    {label:'Fail',range:'< 2.00',min:0,max:1.99,col:'#6b7280'},
  ]

  const insights=[]
  if(!total){insights.push('No courses added yet. Head to <strong>Semesters</strong> to start.')}
  else{
    if(cgpa>=3.75) insights.push(`Outstanding! CGPA <strong>${cgpa.toFixed(2)}</strong> — top tier.`)
    else if(cgpa>=3.50) insights.push(`CGPA <strong>${cgpa.toFixed(2)}</strong> — Very Good range.`)
    else if(cgpa>=3.00) insights.push(`CGPA <strong>${cgpa.toFixed(2)}</strong> — aim for 3.50+.`)
    else if(cgpa>0) insights.push(`CGPA <strong>${cgpa.toFixed(2)}</strong> — focus on improvement.`)
    if(aRange>0) insights.push(`<strong>${aRange}</strong> of ${total} courses in A-range (${((aRange/total)*100).toFixed(0)}%).`)
    if(fails>0) insights.push(`<strong>${fails}</strong> failed course${fails>1?'s':''} dragging your CGPA.`)
    if(sortedS.length>=2){
      const diff=(calcCg(sortedS[0].courses)-calcCg(sortedS[sortedS.length-1].courses)).toFixed(2)
      insights.push(`GPA range: <strong>${calcCg(sortedS[sortedS.length-1].courses).toFixed(2)}</strong> to <strong>${calcCg(sortedS[0].courses).toFixed(2)}</strong> (Δ ${diff}).`)
    }
    const needed=(3.75*(totalCr+15)-totalWPts)/15
    if(needed>0&&needed<=4) insights.push(`Need <strong>${needed.toFixed(2)}</strong> GPA next 15-credit sem to reach Excellent.`)
  }

  const maxC=sems.length?Math.max(...sems.map(s=>s.courses.length)):0

  // Accordion state — tracks which grade keys are expanded
  const [openGrades, setOpenGrades] = useState([])
  const toggleGrade = (g) => setOpenGrades(prev => prev.includes(g) ? prev.filter(k=>k!==g) : [...prev, g])

  return (
    <>
      <div className="vhead"><h2 className="vtitle">Analytics</h2><p className="vsub">Deep dive into your academic performance</p></div>
      <div className="analytics-grid">

        {/* Cumulative GPA */}
        <div className="glass-panel an-panel an-wide">
          <p className="an-label">Cumulative GPA Progress</p>
          <div className="cumulative-wrap">
            <svg viewBox="0 0 700 140" preserveAspectRatio="none" style={{width:'100%',height:'100%'}}>
              {cc?(<>
                <defs><linearGradient id="cg" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#818cf8" stopOpacity=".22"/><stop offset="100%" stopColor="#818cf8" stopOpacity="0"/></linearGradient></defs>
                <path d={`M${cc[0][0]},140 `+cc.map(p=>`L${p[0]},${p[1]}`).join(' ')+` L${cc[cc.length-1][0]},140 Z`} fill="url(#cg)"/>
                <polyline points={cc.map(p=>p.join(',')).join(' ')} fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinejoin="round"/>
                {cc.map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="4" fill="#818cf8" stroke={isDark?'#0d1020':'#f0f2fa'} strokeWidth="2"/><text x={x} y={y-9} textAnchor="middle" fontSize="10" fill="#818cf8" fontFamily="JetBrains Mono,monospace">{cumulPts[i].cg.toFixed(2)}</text></g>)}
              </>):<text x="350" y="70" textAnchor="middle" fill="rgba(255,255,255,.12)" fontFamily="DM Sans" fontSize="13">Add 2+ semesters to see trend</text>}
            </svg>
          </div>
        </div>

        {/* Best/Lowest */}
        <div className="glass-panel an-panel an-highlight-card">
          <p className="an-label">🏆 Best Semester</p>
          <p className="an-hl-name">{best?.name||'—'}</p>
          <p className="an-hl-val" style={{color:'var(--green)'}}>{best?calcCg(best.courses).toFixed(2):'—'}</p>
          {best&&<span className={`chip ${ugcStatus(calcCg(best.courses),true).cls}`}>{ugcStatus(calcCg(best.courses),true).label}</span>}
        </div>
        <div className="glass-panel an-panel an-highlight-card">
          <p className="an-label">📉 Lowest Semester</p>
          <p className="an-hl-name">{low&&low!==best?low.name:'—'}</p>
          <p className="an-hl-val" style={{color:'var(--red)'}}>{low&&low!==best?calcCg(low.courses).toFixed(2):'—'}</p>
          {low&&low!==best&&<span className={`chip ${ugcStatus(calcCg(low.courses),true).cls}`}>{ugcStatus(calcCg(low.courses),true).label}</span>}
        </div>

        {/* GPA Trend */}
        <div className="glass-panel an-panel an-wide">
          <p className="an-label">GPA Trend</p>
          <div className="trend-wrap">
            <svg className="trend-svg" viewBox="0 0 700 160" preserveAspectRatio="none">
              {tc?(<>
                <defs><linearGradient id="tg" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#22d3ee" stopOpacity=".2"/><stop offset="100%" stopColor="#22d3ee" stopOpacity="0"/></linearGradient></defs>
                <path d={`M${tc[0][0]},160 `+tc.map(p=>`L${p[0]},${p[1]}`).join(' ')+` L${tc[tc.length-1][0]},160 Z`} fill="url(#tg)"/>
                <polyline points={tc.map(p=>p.join(',')).join(' ')} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinejoin="round"/>
                {tc.map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="5" fill="#22d3ee" stroke={isDark?'#0d1020':'#f0f2fa'} strokeWidth="2"/><text x={x} y={y-10} textAnchor="middle" fontSize="10" fill="#22d3ee" fontFamily="JetBrains Mono,monospace">{trendPts[i].toFixed(2)}</text></g>)}
              </>):<text x="350" y="80" textAnchor="middle" fill="rgba(255,255,255,.12)" fontFamily="DM Sans" fontSize="13">Add 2+ semesters to see trend</text>}
            </svg>
          </div>
        </div>

        {/* Donut */}
        <div className="glass-panel an-panel an-pair-left">
          <p className="an-label">Credit Distribution</p>
          <div className="donut-outer">
            <div className="donut-canvas-wrap">
              <canvas ref={donutRef} width="180" height="180"/>
              <div className="donut-center"><span className="donut-num">{totalCr}</span><span className="donut-sub">credits</span></div>
            </div>
            <div className="donut-legend">
              {sems.filter(s=>s.courses.reduce((a,c)=>a+(parseFloat(c.credit)||0),0)>0).map((s,i)=>(
                <div key={s.id} className="dl-row"><div className="dl-dot" style={{background:SEM_COLORS[i%SEM_COLORS.length]}}/><span>{s.name}: {s.courses.reduce((a,c)=>a+(parseFloat(c.credit)||0),0)} cr</span></div>
              ))}
            </div>
          </div>
        </div>

        {/* Sem Compare */}
        <div className="glass-panel an-panel an-pair-right">
          <p className="an-label">Semester Comparison</p>
          <div className="sem-compare-wrap">
            {(()=>{const cgs=sems.map(s=>calcCg(s.courses));const mx=Math.max(0.01,...cgs);return sems.map((sem,i)=>{
              const cg=cgs[i],col=SEM_COLORS[i%SEM_COLORS.length],{label}=ugcStatus(cg,sem.courses.some(c=>(parseFloat(c.credit)||0)>0))
              return(<div key={sem.id} className="scmp-row"><div className="scmp-head"><span>{sem.name}</span><span style={{fontFamily:"'JetBrains Mono',monospace",color:col}}>{cg.toFixed(2)} — {label}</span></div><div className="scmp-track"><div className="scmp-fill" style={{width:`${(cg/mx)*100}%`,background:col}}/></div></div>)
            })})()}
          </div>
        </div>

        {/* Grade Breakdown */}
        <div className="glass-panel an-panel an-wide">
          <p className="an-label">Grade Breakdown</p>
          <div className="grade-dist">
            {Object.entries(gradeMap).filter(([,a])=>a.length>0).map(([g,arr])=>{
              const n=arr.length,col=GCOL[g]||'#6b7280',isOpen=openGrades.includes(g)
              return(
                <div key={g} className={`gd-block${isOpen?' open':''}`}
                  style={isOpen?{background:`${col}10`,borderColor:`${col}35`}:{}}
                >
                  <div className="gd-row gd-row-clickable" onClick={()=>toggleGrade(g)}>
                    <span className="gd-g" style={{color:col}}>{g}</span>
                    <div className="gd-track"><div className="gd-fill" style={{width:`${(n/maxGd)*100}%`,background:col}}/></div>
                    <span className="gd-cnt">{n}</span>
                    <svg className="gd-chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <div className="gd-course-list">
                    {arr.map((c,i)=><div key={i} className="gd-course-item" style={{background:`${col}06`}}>
                      <span className="gd-ci-dot" style={{background:col}}/>
                      <span className="gd-ci-name">{c.name}</span>
                      <span className="gd-ci-sem">{c.sem}</span>
                    </div>)}
                  </div>
                </div>
              )
            })}
            {!Object.values(counts).some(n=>n>0)&&<p style={{fontSize:12,color:'var(--text3)',textAlign:'center',padding:16}}>No course data yet.</p>}
          </div>
        </div>

        {/* GPA Classification */}
        <div className="glass-panel an-panel">
          <p className="an-label">GPA Classification</p>
          <div className="gpa-class-wrap">
            {classes.map(c=>{const a=totalCr>0&&cgpa>=c.min&&cgpa<=(c.max===4?4:c.max+0.005)
              return(<div key={c.label} className={`gc-item ${a?'active-cls':''}`}><div className="gc-cls-dot" style={{background:c.col}}/><span className="gc-cls-label" style={a?{color:c.col}:{color:'var(--text2)'}}>{c.label}</span><span className="gc-cls-range">{c.range}</span></div>)
            })}
          </div>
        </div>

        {/* Perf Insights */}
        <div className="glass-panel an-panel">
          <p className="an-label">Performance Insights</p>
          <div className="perf-insights">
            {insights.map((t,i)=><div key={i} className="pi-item" dangerouslySetInnerHTML={{__html:t}}/>)}
          </div>
        </div>

        {/* Heatmap */}
        <div className="glass-panel an-panel an-wide">
          <p className="an-label">Performance Heatmap — Grade per course across semesters</p>
          <div className="heatmap-wrap">
            {!maxC?<p style={{fontSize:12,color:'var(--text3)'}}>No courses yet.</p>:(
              <div style={{display:'grid',gridTemplateColumns:`48px repeat(${sems.length},1fr)`,gap:4}}>
                <div className="hm-col-label"/>
                {sems.map(sem=>{const p=sem.name.split(' ');return<div key={sem.id} className="hm-col-label" title={sem.name}>{p.length>=2?p[0].slice(0,3)+"'"+p[1].slice(2):sem.name}</div>})}
                {Array.from({length:maxC},(_,r)=>(<React.Fragment key={r}>
                  <div className="hm-row-label">C{r+1}</div>
                  {sems.map(sem=>{const c=sem.courses[r];const ok=c&&(parseFloat(c.credit)||0)>0;const col=ok?GCOL[c.grade]||'#6b7280':null
                    return(<div key={sem.id} className="hm-cell" style={ok?{background:`${col}28`,border:`1px solid ${col}55`,color:col}:{background:'rgba(128,128,128,.06)',border:'1px solid rgba(128,128,128,.1)'}} title={ok?`${c.grade} — ${c.name||'Course'} · ${sem.name}`:''} >{ok?c.grade:''}</div>)
                  })}
                </React.Fragment>))}
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  )
}
