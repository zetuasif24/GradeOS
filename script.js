/* ═══════════════════════════════════════════════
   GradeOS — CGPA Calculator v4
   Asif Zetu · DIU · Software Engineering
═══════════════════════════════════════════════ */

/* ─── Grade Data ─── */
const GP = {
  "A+":4.00,"A":3.75,"A-":3.50,
  "B+":3.25,"B":3.00,"B-":2.75,
  "C+":2.50,"C":2.25,"D":2.00,"F":0.00
};

const GRADE_COLORS = {
  "A+":"#34d399","A":"#22d3ee","A-":"#38bdf8",
  "B+":"#818cf8","B":"#a78bfa","B-":"#c084fc",
  "C+":"#fbbf24","C":"#fb923c","D":"#f87171","F":"#94a3b8"
};

/* UGC status — exact match */
function ugcStatus(cgpa, hasData) {
  if (!hasData) return { label:"No Data", cls:"chip-none" };
  if (cgpa>=4.00) return { label:"Outstanding",   cls:"chip-outstanding" };
  if (cgpa>=3.75) return { label:"Excellent",     cls:"chip-excellent"   };
  if (cgpa>=3.50) return { label:"Very Good",     cls:"chip-verygood"    };
  if (cgpa>=3.25) return { label:"Good",          cls:"chip-good"        };
  if (cgpa>=3.00) return { label:"Satisfactory",  cls:"chip-satisfact"   };
  if (cgpa>=2.75) return { label:"Above Average", cls:"chip-aboveavg"    };
  if (cgpa>=2.50) return { label:"Average",       cls:"chip-average"     };
  if (cgpa>=2.25) return { label:"Below Average", cls:"chip-belowavg"    };
  if (cgpa>=2.00) return { label:"Pass",          cls:"chip-pass"        };
  return { label:"Fail", cls:"chip-fail" };
}

/* ─── State ─── */
let semesters  = [];
let activeId   = null;
let _uid       = Date.now();
const uid      = () => (++_uid).toString(36);

/* ─── Persistence ─── */
const STORE_KEY = "gradeOS_v4";
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ semesters, activeId })); } catch {}
}
function loadData() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) { const d = JSON.parse(raw); semesters = d.semesters; activeId = d.activeId; return true; }
  } catch {}
  return false;
}

/* ─── Math ─── */
function pts(grade, credit) { return (GP[grade]??0) * (parseFloat(credit)||0); }
function calcCg(courses) {
  let cr=0, p=0;
  courses.forEach(c => { const x=parseFloat(c.credit)||0; cr+=x; p+=pts(c.grade,x); });
  return cr ? p/cr : 0;
}
const escH = s => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

/* ─── Animated counter ─── */
function animateNum(el, target, decimals=2, duration=600) {
  const start   = parseFloat(el.dataset.val||"0") || 0;
  const end     = parseFloat(target);
  const t0      = performance.now();
  const ease    = t => t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
  el.dataset.val = end;
  function frame(now) {
    const progress = Math.min((now-t0)/duration, 1);
    const val = start + (end-start)*ease(progress);
    el.textContent = val.toFixed(decimals);
    if (progress<1) requestAnimationFrame(frame);
    else el.textContent = end.toFixed(decimals);
  }
  requestAnimationFrame(frame);
}

/* ─── Grade bar ─── */
function gradeBarPct(grade) { return ((GP[grade]??0)/4)*100; }
function gradeBarColor(grade) { return GRADE_COLORS[grade]||"#6b7280"; }

/* ─── Grade select HTML ─── */
function gOpts(sel) {
  return Object.keys(GP).map(g=>
    `<option value="${g}"${g===sel?" selected":""}>${g}</option>`
  ).join("");
}

/* ─── Semester ops ─── */
function getActive() { return semesters.find(s=>s.id===activeId)||semesters[0]; }

function defaultCourses() {
  return Array.from({length:5},()=>({id:uid(),name:"",grade:"A+",credit:3}));
}

function addSemester() {
  const sem={id:uid(),name:"Semester "+(semesters.length+1),courses:defaultCourses()};
  semesters.push(sem); activeId=sem.id;
  renderAll(); save();
}

function deleteSemester(id) {
  if (semesters.length<=1) return;
  semesters=semesters.filter(s=>s.id!==id);
  if (activeId===id) activeId=semesters[semesters.length-1].id;
  renderAll(); save();
}

function switchSem(id) { activeId=id; renderAll(); }

/* ─── Course ops ─── */
function addCourse() {
  const sem=getActive(); sem.courses.push({id:uid(),name:"",grade:"A+",credit:3});
  renderCourses(); updateStats(); save();
}

function removeCourse(cid) {
  const sem=getActive(); sem.courses=sem.courses.filter(c=>c.id!==cid);
  renderCourses(); updateStats(); save();
}

function updateCourse(cid, field, value) {
  const sem=getActive();
  const c=sem.courses.find(c=>c.id===cid); if (!c) return;
  c[field]=field==="credit"?(parseFloat(value)||0):value;
  /* live pts + bar update */
  const p=pts(c.grade,c.credit).toFixed(2);
  document.querySelectorAll(`[data-pts="${cid}"]`).forEach(el=>el.textContent=p);
  document.querySelectorAll(`[data-mpts="${cid}"]`).forEach(el=>el.textContent=p+" pts");
  const bar=document.querySelector(`[data-bar="${cid}"]`);
  if (bar) { bar.style.width=gradeBarPct(c.grade)+"%"; bar.style.background=gradeBarColor(c.grade); }
  const pct=document.querySelector(`[data-barpct="${cid}"]`);
  if (pct) pct.textContent=gradeBarPct(c.grade).toFixed(0)+"%";
  updateStats(); save();
}

/* ─── Render Tabs ─── */
function renderTabs() {
  const el=document.getElementById("semTabsWrap");
  el.innerHTML="";
  semesters.forEach(sem=>{
    const btn=document.createElement("button");
    btn.className="sem-tab"+(sem.id===activeId?" active":"");
    const close=semesters.length>1
      ?`<span class="tab-x" onclick="event.stopPropagation();deleteSemester('${sem.id}')">✕</span>`:"";
    btn.innerHTML=`<span>${escH(sem.name)}</span>${close}`;
    btn.onclick=()=>switchSem(sem.id);
    el.appendChild(btn);
  });
}

/* ─── Render Desktop Table ─── */
function renderDesktop(sem) {
  const tbody=document.getElementById("ctblBody");
  tbody.innerHTML="";
  sem.courses.forEach((c,i)=>{
    const p=pts(c.grade,c.credit).toFixed(2);
    const pct=gradeBarPct(c.grade);
    const col=gradeBarColor(c.grade);
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td class="td-n">${i+1}</td>
      <td><input type="text" placeholder="Course name" value="${escH(c.name)}"
        oninput="updateCourse('${c.id}','name',this.value)"></td>
      <td><select onchange="updateCourse('${c.id}','grade',this.value)">${gOpts(c.grade)}</select></td>
      <td><input type="number" min="0" max="6" step="0.5" value="${c.credit}"
        oninput="updateCourse('${c.id}','credit',this.value)"></td>
      <td class="td-pts" data-pts="${c.id}">${p}</td>
      <td>
        <div class="grade-bar-wrap">
          <div class="grade-bar-track">
            <div class="grade-bar-fill" data-bar="${c.id}"
              style="width:${pct}%;background:${col}"></div>
          </div>
          <span class="grade-bar-pct" data-barpct="${c.id}">${pct.toFixed(0)}%</span>
        </div>
      </td>
      <td><button class="xbtn" onclick="removeCourse('${c.id}')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg></button></td>`;
    tbody.appendChild(tr);
  });
}

/* ─── Render Mobile Cards ─── */
function renderMobile(sem) {
  const el=document.getElementById("mobStack");
  el.innerHTML="";
  sem.courses.forEach((c,i)=>{
    const p=pts(c.grade,c.credit).toFixed(2);
    const card=document.createElement("div");
    card.className="mob-card";
    card.innerHTML=`
      <div class="mob-card-top">
        <span class="mob-idx">Course ${i+1}</span>
        <span class="mob-pts-display" data-mpts="${c.id}">${p} pts</span>
        <button class="mob-xbtn" onclick="removeCourse('${c.id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="mob-fields">
        <div class="mob-field full">
          <label>Course Name</label>
          <input type="text" placeholder="e.g. Software Engineering" value="${escH(c.name)}"
            oninput="updateCourse('${c.id}','name',this.value)">
        </div>
        <div class="mob-field">
          <label>Grade</label>
          <select onchange="updateCourse('${c.id}','grade',this.value)">${gOpts(c.grade)}</select>
        </div>
        <div class="mob-field">
          <label>Credits</label>
          <input type="number" min="0" max="6" step="0.5" value="${c.credit}"
            oninput="updateCourse('${c.id}','credit',this.value)">
        </div>
      </div>`;
    el.appendChild(card);
  });
}

/* ─── Render Courses ─── */
function renderCourses() {
  const sem=getActive(); if (!sem) return;
  document.getElementById("semLabel").textContent=sem.name;
  renderDesktop(sem);
  renderMobile(sem);
  const cr=sem.courses.reduce((s,c)=>s+(parseFloat(c.credit)||0),0);
  document.getElementById("cpFootL").textContent=
    `${sem.courses.length} course${sem.courses.length!==1?"s":""} · ${cr} credit${cr!==1?"s":""}`;
}

/* ─── Update Stats ─── */
function updateStats() {
  const sem=getActive();

  /* Per-semester */
  const semCg=sem?calcCg(sem.courses):0;
  const semHas=sem?sem.courses.some(c=>(parseFloat(c.credit)||0)>0):false;
  const semStr=semCg.toFixed(2);
  animateNum(document.getElementById("semDisplay"),semStr,2);
  document.getElementById("semCgPill").textContent=semStr;
  document.getElementById("cpFootCg").textContent=semStr;
  setChip("semChip",semCg,semHas);

  if (sem) {
    const cr=sem.courses.reduce((s,c)=>s+(parseFloat(c.credit)||0),0);
    document.getElementById("semDetail").textContent=
      `${sem.courses.length} course${sem.courses.length!==1?"s":""}  ·  ${cr} credit${cr!==1?"s":""}`;
  }

  /* Cumulative */
  let totalCr=0,totalPts=0;
  semesters.forEach(s=>s.courses.forEach(c=>{
    const cr=parseFloat(c.credit)||0;
    totalCr+=cr; totalPts+=pts(c.grade,cr);
  }));
  const cgpa=totalCr?totalPts/totalCr:0;
  const hasData=totalCr>0;

  animateNum(document.getElementById("cgpaDisplay"),cgpa.toFixed(2),2);
  animateNum(document.getElementById("totalCrDisplay"),totalCr,0);
  animateNum(document.getElementById("totalPtsDisplay"),totalPts.toFixed(2),2);

  setChip("cgpaChip",cgpa,hasData);

  /* Bar fill */
  const pct=(cgpa/4)*100;
  document.getElementById("cgpaBarFill").style.width=pct+"%";

  /* Sync target view */
  calcTarget();
  updateTargetBars(cgpa);
}

function setChip(id, cgpa, hasData) {
  const el=document.getElementById(id);
  const {label,cls}=ugcStatus(cgpa,hasData);
  el.textContent=label;
  el.className="status-chip "+cls;
}

/* ─── ANALYTICS VIEW ─── */
function renderAnalytics() {
  if (document.getElementById("view-analytics").style.display==="none") return;

  const colors=["#22d3ee","#818cf8","#f472b6","#4ade80","#fbbf24","#fb923c","#38bdf8","#a78bfa"];

  /* Bar chart */
  const barChart=document.getElementById("barChart");
  const barLabels=document.getElementById("barLabels");
  barChart.innerHTML=""; barLabels.innerHTML="";
  const maxCg=4;
  semesters.forEach((sem,i)=>{
    const cg=calcCg(sem.courses);
    const heightPct=Math.max((cg/maxCg)*100,1);
    const col=colors[i%colors.length];

    const col_div=document.createElement("div");
    col_div.className="bar-col";
    col_div.innerHTML=`
      <span class="bar-val">${cg.toFixed(2)}</span>
      <div class="bar-body" style="height:0%;background:${col};box-shadow:0 0 10px ${col}66"></div>`;
    barChart.appendChild(col_div);

    const lbl=document.createElement("div");
    lbl.className="bar-lbl"; lbl.textContent=sem.name;
    barLabels.appendChild(lbl);

    /* animate height */
    setTimeout(()=>{ col_div.querySelector(".bar-body").style.height=heightPct+"%"; },50+i*80);
  });

  /* Donut — credit distribution per semester */
  let totalCrAll=0;
  semesters.forEach(s=>s.courses.forEach(c=>totalCrAll+=(parseFloat(c.credit)||0)));
  let cumDeg=0;
  const segments=[];
  semesters.forEach((sem,i)=>{
    let cr=0;
    sem.courses.forEach(c=>cr+=(parseFloat(c.credit)||0));
    const deg=totalCrAll?((cr/totalCrAll)*360):0;
    segments.push({label:sem.name,cr,start:cumDeg,end:cumDeg+deg,color:colors[i%colors.length]});
    cumDeg+=deg;
  });
  const conicParts=segments.map(s=>`${s.color} ${s.start.toFixed(1)}deg ${s.end.toFixed(1)}deg`).join(",");
  document.getElementById("donutEl").style.background=
    segments.length?`conic-gradient(${conicParts})`:`conic-gradient(rgba(255,255,255,.06) 0% 100%)`;
  animateNum(document.getElementById("donutNum"),totalCrAll,0);
  const legend=document.getElementById("donutLegend");
  legend.innerHTML=segments.map(s=>
    `<div class="dl-row"><div class="dl-dot" style="background:${s.color}"></div>
    <span>${escH(s.label)}: ${s.cr} cr</span></div>`
  ).join("");

  /* Trend line SVG */
  const svg=document.getElementById("trendSvg");
  svg.innerHTML="";
  if (semesters.length>=2) {
    const cgs=semesters.map(s=>calcCg(s.courses));
    const W=600,H=140,PAD=20;
    const minCg=Math.max(0,Math.min(...cgs)-0.3);
    const maxCgT=Math.min(4,Math.max(...cgs)+0.3);
    const xStep=(W-2*PAD)/(semesters.length-1);
    const pts_=cgs.map((cg,i)=>{
      const x=PAD+i*xStep;
      const y=H-PAD-((cg-minCg)/(maxCgT-minCg))*(H-2*PAD);
      return [x,y];
    });
    /* gradient area */
    const areaD=`M${pts_[0][0]},${H-PAD} `+pts_.map(p=>`L${p[0]},${p[1]}`).join(" ")+` L${pts_[pts_.length-1][0]},${H-PAD} Z`;
    const area=document.createElementNS("http://www.w3.org/2000/svg","path");
    area.setAttribute("d",areaD);
    area.setAttribute("fill","url(#trendGrad)");
    /* defs */
    svg.innerHTML=`<defs><linearGradient id="trendGrad" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#22d3ee" stop-opacity=".25"/>
      <stop offset="100%" stop-color="#22d3ee" stop-opacity="0"/>
    </linearGradient></defs>`;
    svg.appendChild(area);
    /* line */
    const polyline=document.createElementNS("http://www.w3.org/2000/svg","polyline");
    polyline.setAttribute("points",pts_.map(p=>p.join(",")).join(" "));
    polyline.setAttribute("fill","none");
    polyline.setAttribute("stroke","#22d3ee");
    polyline.setAttribute("stroke-width","2.5");
    polyline.setAttribute("stroke-linejoin","round");
    polyline.setAttribute("stroke-linecap","round");
    svg.appendChild(polyline);
    /* dots */
    pts_.forEach(([x,y],i)=>{
      const circle=document.createElementNS("http://www.w3.org/2000/svg","circle");
      circle.setAttribute("cx",x); circle.setAttribute("cy",y); circle.setAttribute("r","5");
      circle.setAttribute("fill","#22d3ee");
      circle.setAttribute("stroke","var(--bg2)"); circle.setAttribute("stroke-width","2");
      svg.appendChild(circle);
      const text=document.createElementNS("http://www.w3.org/2000/svg","text");
      text.setAttribute("x",x); text.setAttribute("y",y-12);
      text.setAttribute("text-anchor","middle");
      text.setAttribute("font-size","10"); text.setAttribute("fill","#22d3ee");
      text.setAttribute("font-family","JetBrains Mono, monospace");
      text.textContent=cgs[i].toFixed(2);
      svg.appendChild(text);
    });
  } else {
    svg.innerHTML=`<text x="300" y="70" text-anchor="middle" fill="rgba(255,255,255,.15)"
      font-family="DM Sans,sans-serif" font-size="13">Add 2+ semesters to see trend</text>`;
  }

  /* Grade distribution */
  const gradeDist=document.getElementById("gradeDist");
  gradeDist.innerHTML="";
  const counts={};
  Object.keys(GP).forEach(g=>counts[g]=0);
  semesters.forEach(s=>s.courses.forEach(c=>{ if (counts[c.grade]!==undefined) counts[c.grade]++; }));
  const total=Object.values(counts).reduce((a,b)=>a+b,0)||1;
  Object.entries(counts).filter(([,n])=>n>0).forEach(([g,n])=>{
    const row=document.createElement("div");
    row.className="gd-row";
    const col=GRADE_COLORS[g]||"#6b7280";
    row.innerHTML=`
      <span class="gd-grade" style="color:${col}">${g}</span>
      <div class="gd-track"><div class="gd-fill" style="width:0%;background:${col}"></div></div>
      <span class="gd-count">${n}</span>`;
    gradeDist.appendChild(row);
    setTimeout(()=>{ row.querySelector(".gd-fill").style.width=((n/total)*100)+"%"; },80);
  });
  if (!total || Object.values(counts).every(n=>n===0)) {
    gradeDist.innerHTML=`<p style="font-size:12px;color:var(--text-3);text-align:center;padding:16px">No course data yet.</p>`;
  }
}

/* ─── TARGET CALCULATOR ─── */
function calcTarget() {
  const targetEl   = document.getElementById("targetCgpa");
  const creditsEl  = document.getElementById("targetCredits");
  const neededEl   = document.getElementById("targetGpaNeeded");
  const noteEl     = document.getElementById("targetNote");
  if (!targetEl) return;

  const targetCgpa   = parseFloat(targetEl.value);
  const plannedCr    = parseFloat(creditsEl.value);

  /* current cumulative */
  let curCr=0, curPts=0;
  semesters.forEach(s=>s.courses.forEach(c=>{
    const x=parseFloat(c.credit)||0; curCr+=x; curPts+=pts(c.grade,x);
  }));
  const curCgpa=curCr?curPts/curCr:0;

  document.getElementById("tbarCurrentNum").textContent=curCgpa.toFixed(2);
  updateTargetBars(curCgpa);

  if (!targetCgpa||!plannedCr) {
    neededEl.textContent="—";
    noteEl.textContent="Enter your target CGPA and planned credits above.";
    document.getElementById("tbarTargetNum").textContent="—";
    document.getElementById("tbarRequiredNum").textContent="—";
    document.getElementById("tbarTarget").style.width="0%";
    document.getElementById("tbarRequired").style.width="0%";
    renderScenarios(null);
    return;
  }

  /* required = (target*(curCr+plannedCr) - curPts) / plannedCr */
  const needed=((targetCgpa*(curCr+plannedCr))-curPts)/plannedCr;
  neededEl.textContent=needed<=0?"Already achieved!":needed>4?"Not possible (>4.00)":needed.toFixed(2);

  document.getElementById("tbarTargetNum").textContent=targetCgpa.toFixed(2);
  document.getElementById("tbarRequiredNum").textContent=needed>0&&needed<=4?needed.toFixed(2):"—";
  document.getElementById("tbarTarget").style.width=((targetCgpa/4)*100)+"%";
  document.getElementById("tbarRequired").style.width=(Math.min(Math.max(needed,0),4)/4*100)+"%";

  const feasible=needed>=0&&needed<=4;
  noteEl.textContent=needed<=0
    ?"🎉 You've already exceeded your target!"
    :feasible
    ?`You need a ${needed.toFixed(2)} GPA this semester to reach ${targetCgpa.toFixed(2)} CGPA.`
    :"⚠️ This target is not achievable with the planned credits.";

  renderScenarios(curCr, curPts, targetCgpa, plannedCr);
}

function renderScenarios(curCr, curPts, targetCgpa, plannedCr) {
  const el=document.getElementById("targetScenarios");
  if (!curCr && curCr!==0) { el.innerHTML=""; return; }
  const scenarios=[
    {label:"If you score all A+",gpa:4.00},
    {label:"If you score all A",gpa:3.75},
    {label:"If you score all B+",gpa:3.25},
    {label:"If you score all B",gpa:3.00},
  ];
  el.innerHTML=scenarios.map(sc=>{
    const newCgpa=((curPts+sc.gpa*plannedCr)/(curCr+plannedCr)).toFixed(2);
    return `<div class="scenario-row">
      <span>${sc.label}</span>
      <span class="scenario-val">CGPA → ${newCgpa}</span>
    </div>`;
  }).join("");
}

function updateTargetBars(cgpa) {
  document.getElementById("tbarCurrent").style.width=((cgpa/4)*100)+"%";
  document.getElementById("tbarCurrentNum").textContent=cgpa.toFixed(2);
}

/* ─── View Switcher ─── */
function switchView(name, btn) {
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.querySelectorAll(".nav-tab").forEach(b=>b.classList.remove("active"));
  document.getElementById("view-"+name).classList.add("active");
  btn.classList.add("active");
  if (name==="analytics") { setTimeout(renderAnalytics, 50); }
}

/* ─── Theme ─── */
function toggleTheme() {
  const isLight=document.documentElement.getAttribute("data-theme")==="light";
  applyTheme(isLight?"dark":"light");
  try { localStorage.setItem("gradeOS_theme",isLight?"dark":"light"); } catch {}
}
function applyTheme(t) {
  const moon=document.querySelector(".th-moon");
  const sun =document.querySelector(".th-sun");
  if (t==="light") {
    document.documentElement.setAttribute("data-theme","light");
    moon.style.display="none"; sun.style.display="block";
  } else {
    document.documentElement.setAttribute("data-theme","dark");
    moon.style.display="block"; sun.style.display="none";
  }
}
function loadTheme() {
  try { const t=localStorage.getItem("gradeOS_theme"); if(t) applyTheme(t); } catch {}
}

/* ─── Modal ─── */
function openClearModal()  { document.getElementById("clearModal").classList.add("open"); }
function closeClearModal() { document.getElementById("clearModal").classList.remove("open"); }
function clearAll() {
  closeClearModal();
  semesters=[];
  try { localStorage.removeItem(STORE_KEY); } catch {}
  addSemester();
}

/* ─── Export PDF ─── */
function exportPDF() { window.print(); }

/* ─── Render All ─── */
function renderAll() { renderTabs(); renderCourses(); updateStats(); }

/* ─── Star Canvas ─── */
function initStars() {
  const canvas=document.getElementById("starCanvas");
  const ctx=canvas.getContext("2d");
  let stars=[];
  let W,H;

  function resize() {
    W=canvas.width=window.innerWidth;
    H=canvas.height=window.innerHeight;
  }

  function spawn() {
    stars=[];
    const count=Math.floor(W*H/6000);
    for (let i=0;i<count;i++) {
      stars.push({
        x:Math.random()*W, y:Math.random()*H,
        r:Math.random()*1.2+0.2,
        o:Math.random()*.7+.1,
        speed:Math.random()*.15+.03,
        twinkleSpeed:Math.random()*.02+.005,
        twinklePhase:Math.random()*Math.PI*2
      });
    }
  }

  let frame=0;
  function draw() {
    ctx.clearRect(0,0,W,H);
    frame++;
    stars.forEach(s=>{
      const twinkle=Math.sin(frame*s.twinkleSpeed+s.twinklePhase);
      const alpha=s.o*(0.6+0.4*twinkle);
      ctx.beginPath();
      ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(180,200,255,${alpha})`;
      ctx.fill();
      s.y-=s.speed;
      if (s.y<-2) { s.y=H+2; s.x=Math.random()*W; }
    });
    requestAnimationFrame(draw);
  }

  resize(); spawn(); draw();
  window.addEventListener("resize",()=>{ resize(); spawn(); });
}

/* ─── Init ─── */
function init() {
  loadTheme();
  if (!loadData()) {
    semesters=[{id:uid(),name:"Semester 1",courses:defaultCourses()}];
    activeId=semesters[0].id;
    save();
  }
  renderAll();
  initStars();
}

document.addEventListener("DOMContentLoaded", init);
