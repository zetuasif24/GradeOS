/* ═══════════════════════════════════════════════
   GradeOS — Full Script
   Asif Zetu · DIU · Software Engineering · 2026
═══════════════════════════════════════════════ */

/* ── Grade Data ── */
const GP = {
  "A+":4.00,"A":3.75,"A-":3.50,
  "B+":3.25,"B":3.00,"B-":2.75,
  "C+":2.50,"C":2.25,"D":2.00,"F":0.00
};
const GCOL = {
  "A+":"#10b981","A":"#22d3ee","A-":"#38bdf8",
  "B+":"#818cf8","B":"#a78bfa","B-":"#c084fc",
  "C+":"#f59e0b","C":"#f97316","D":"#ef4444","F":"#94a3b8"
};
const SEM_COLORS = ["#22d3ee","#818cf8","#f472b6","#4ade80","#fbbf24","#fb923c","#38bdf8","#a78bfa","#34d399","#e879f9"];

function ugcStatus(cg, has) {
  if (!has) return {label:"No Data",cls:"chip-none"};
  if (cg>=4.00) return {label:"Outstanding",  cls:"chip-outstanding"};
  if (cg>=3.75) return {label:"Excellent",    cls:"chip-excellent"};
  if (cg>=3.50) return {label:"Very Good",    cls:"chip-verygood"};
  if (cg>=3.25) return {label:"Good",         cls:"chip-good"};
  if (cg>=3.00) return {label:"Satisfactory", cls:"chip-satisfact"};
  if (cg>=2.75) return {label:"Above Average",cls:"chip-aboveavg"};
  if (cg>=2.50) return {label:"Average",      cls:"chip-average"};
  if (cg>=2.25) return {label:"Below Average",cls:"chip-belowavg"};
  if (cg>=2.00) return {label:"Pass",         cls:"chip-pass"};
  return {label:"Fail",cls:"chip-fail"};
}

/* ── State ── */
let sems = [], activeId = null;
let _u = Date.now();
const uid = () => (++_u).toString(36);

/* ── Storage ── */
const KEY = "gradeos_v5";
function save() {
  try { localStorage.setItem(KEY, JSON.stringify({sems, activeId})); } catch {}
}
function loadStore() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY)||"null");
    if (d) { sems=d.sems; activeId=d.activeId; return true; }
  } catch {}
  return false;
}

/* ── Math ── */
const gpOfGrade = g => GP[g]??0;
function semGp(courses) {   /* grade point (not weighted) — just GP[grade] per course */
  return gpOfGrade;         /* used per-row */
}
function weightedPoints(grade, credit) { return gpOfGrade(grade) * (parseFloat(credit)||0); }
function calcCg(courses) {
  let cr=0, p=0;
  courses.forEach(c => { const x=parseFloat(c.credit)||0; cr+=x; p+=weightedPoints(c.grade,x); });
  return cr ? p/cr : 0;
}
const escH = s => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

/* ── Animated counter ── */
function animNum(el, val, dec=2, dur=700) {
  const start = parseFloat(el.dataset.v||"0")||0;
  const end   = parseFloat(val);
  const t0    = performance.now();
  el.dataset.v = end;
  const ease = t => t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  (function run(now) {
    const p = Math.min((now-t0)/dur,1);
    el.textContent = (start+(end-start)*ease(p)).toFixed(dec);
    if (p<1) requestAnimationFrame(run);
    else el.textContent = end.toFixed(dec);
  })(performance.now());
}

/* Reset dataset.v so next animNum call always animates from zero */
function resetAnimEl(id) {
  const el = document.getElementById(id);
  if (el) { el.dataset.v = "0"; el.textContent = "0"; }
}

function setChip(id, cg, has) {
  const el = document.getElementById(id); if (!el) return;
  const {label,cls} = ugcStatus(cg,has);
  el.textContent = label; el.className = "chip "+cls;
}

/* ── Grade select ── */
function gOpts(sel) {
  return Object.keys(GP).map(g=>`<option value="${g}"${g===sel?" selected":""}>${g}</option>`).join("");
}

/* ── Semester ops ── */
const getActive = () => sems.find(s=>s.id===activeId)||sems[0];

function defaultCourses() {
  return Array.from({length:5}, ()=>({id:uid(),name:"",grade:"A+",credit:3}));
}

/* Season sort order */
const SEM_SEASON_ORDER = {"Spring":0, "Summer":1, "Fall":2};
function sortSems() {
  sems.sort((a,b)=>{
    const [atypeRaw,...ayearParts]=a.name.split(" ");
    const [btypeRaw,...byearParts]=b.name.split(" ");
    const atype=atypeRaw, btype=btypeRaw;
    const ayear=parseInt(ayearParts.join(" "))||0;
    const byear=parseInt(byearParts.join(" "))||0;
    if(ayear!==byear) return ayear-byear;
    return (SEM_SEASON_ORDER[atype]??99)-(SEM_SEASON_ORDER[btype]??99);
  });
}

// Called from modal confirm
function confirmAddSem() {
  const typeBtn = document.querySelector(".stype-btn.active");
  const type    = typeBtn ? typeBtn.dataset.type : "Spring";
  const yearVal = document.getElementById("semYearInp").value;
  const year    = parseInt(yearVal) || new Date().getFullYear();
  const name    = `${type} ${year}`;
  const sem     = {id:uid(), name, courses:defaultCourses()};
  sems.push(sem);
  sortSems();
  activeId=sem.id;
  closeAddSemModal();
  renderAll(); save();
}

// Pending delete id
let _pendingDelId = null;

function requestDelSem(id) {
  if (sems.length<=1) return; // can't delete last
  _pendingDelId = id;
  const sem = sems.find(s=>s.id===id);
  const name = sem ? sem.name : "this semester";
  document.getElementById("delSemMsg").textContent =
    `"${name}" and all its ${sem.courses.length} course(s) will be permanently removed.`;
  document.getElementById("delSemModal").classList.add("open");
}

function confirmDelSem() {
  if (!_pendingDelId) return;
  sems = sems.filter(s=>s.id!==_pendingDelId);
  if (activeId===_pendingDelId) activeId = sems[sems.length-1].id;
  _pendingDelId = null;
  closeDelSemModal();
  renderAll(); save();
}

function switchSem(id) { activeId=id; renderAll(); }

/* ── Course ops ── */
function addCourse() {
  const sem=getActive();
  sem.courses.push({id:uid(),name:"",grade:"A+",credit:3});
  renderCourses(); updateStats(); save();
}

function removeCourse(cid) {
  const sem=getActive();
  sem.courses=sem.courses.filter(c=>c.id!==cid);
  renderCourses(); updateStats(); save();
}

function updateCourse(cid, field, value) {
  const sem=getActive();
  const c=sem.courses.find(c=>c.id===cid); if (!c) return;
  if (field==="credit") {
    // allow partial input while typing — store as string then parse
    c.credit = value === "" ? 0 : (parseFloat(value)||0);
  } else {
    c[field]=value;
  }
  // ── FIX: update grade point cell (just GP[grade], not weighted) ──
  const gp = gpOfGrade(c.grade).toFixed(2);
  document.querySelectorAll(`[data-gp="${cid}"]`).forEach(el=>el.textContent=gp);
  document.querySelectorAll(`[data-mgp="${cid}"]`).forEach(el=>el.textContent=gp+" GP");
  // update bar
  const pct = (gpOfGrade(c.grade)/4)*100;
  const col = GCOL[c.grade]||"#6b7280";
  const bar = document.querySelector(`[data-bar="${cid}"]`);
  if (bar) {bar.style.width=pct+"%"; bar.style.background=col;}
  const bpct= document.querySelector(`[data-bpct="${cid}"]`);
  if (bpct) bpct.textContent=pct.toFixed(0)+"%";
  // ── FIX: immediately recalculate semester summary without full re-render ──
  updateStats();
  save();
}

/* ── Render Tabs ── */
function renderTabs() {
  const el=document.getElementById("semTabs"); el.innerHTML="";
  sems.forEach(sem=>{
    const btn=document.createElement("button");
    btn.className="sem-tab"+(sem.id===activeId?" active":"");
    const xBtn = sems.length>1
      ? `<span class="tab-x" onclick="event.stopPropagation();requestDelSem('${sem.id}')">✕</span>`
      : "";
    btn.innerHTML=`<span>${escH(sem.name)}</span>${xBtn}`;
    btn.onclick=()=>switchSem(sem.id);
    el.appendChild(btn);
  });
}

/* ── Render Desktop Table ── */
function renderDesktop(sem) {
  const tbody=document.getElementById("ctblBody"); tbody.innerHTML="";
  sem.courses.forEach((c,i)=>{
    const gp  = gpOfGrade(c.grade).toFixed(2);   // ── FIX: grade point not weighted
    const pct = (gpOfGrade(c.grade)/4)*100;
    const col = GCOL[c.grade]||"#6b7280";
    const tr  = document.createElement("tr");
    tr.innerHTML=`
      <td class="td-n">${i+1}</td>
      <td><input type="text" placeholder="Course name" value="${escH(c.name)}"
        oninput="updateCourse('${c.id}','name',this.value)"></td>
      <td><select onchange="updateCourse('${c.id}','grade',this.value)">${gOpts(c.grade)}</select></td>
      <td><input type="number" min="0" max="6" step="0.5" value="${c.credit}"
        oninput="updateCourse('${c.id}','credit',this.value)"></td>
      <td class="td-gp" data-gp="${c.id}">${gp}</td>
      <td>
        <div class="gbar-wrap">
          <div class="gbar-track">
            <div class="gbar-fill" data-bar="${c.id}" style="width:${pct}%;background:${col}"></div>
          </div>
          <span class="gbar-pct" data-bpct="${c.id}">${pct.toFixed(0)}%</span>
        </div>
      </td>
      <td><button class="xbtn" onclick="removeCourse('${c.id}')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg></button></td>`;
    tbody.appendChild(tr);
  });
}

/* ── Render Mobile Cards ── */
function renderMobile(sem) {
  const el=document.getElementById("mobCourses"); el.innerHTML="";
  sem.courses.forEach((c,i)=>{
    const gp = gpOfGrade(c.grade).toFixed(2);
    const card=document.createElement("div");
    card.className="mob-card";
    card.innerHTML=`
      <div class="mob-top">
        <span class="mob-idx">Course ${i+1}</span>
        <span class="mob-gp" data-mgp="${c.id}">${gp} GP</span>
        <button class="mob-del" onclick="removeCourse('${c.id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="mob-fields">
        <div class="mob-field full"><label>Course Name</label>
          <input type="text" placeholder="e.g. Software Engineering" value="${escH(c.name)}"
            oninput="updateCourse('${c.id}','name',this.value)"></div>
        <div class="mob-field"><label>Grade</label>
          <select onchange="updateCourse('${c.id}','grade',this.value)">${gOpts(c.grade)}</select></div>
        <div class="mob-field"><label>Credits</label>
          <input type="number" min="0" max="6" step="0.5" value="${c.credit}"
            oninput="updateCourse('${c.id}','credit',this.value)"></div>
      </div>`;
    el.appendChild(card);
  });
}

/* ── Render Courses ── */
function renderCourses() {
  const sem=getActive(); if (!sem) return;
  document.getElementById("semLabel").textContent=sem.name;
  renderDesktop(sem);
  renderMobile(sem);
  updateFootSummary(sem);
}

function updateFootSummary(sem) {
  if (!sem) return;
  // ── FIX: always called from updateStats too, so credits always reflect live input ──
  const cr = sem.courses.reduce((s,c)=>s+(parseFloat(c.credit)||0),0);
  document.getElementById("cpFootL").textContent =
    `${sem.courses.length} course${sem.courses.length!==1?"s":""} · ${cr} credit${cr!==1?"s":""}`;
}

/* ── Update Stats ── */
function updateStats() {
  const sem=getActive();
  // Per-semester
  const semCg  = sem?calcCg(sem.courses):0;
  const semHas = sem?sem.courses.some(c=>(parseFloat(c.credit)||0)>0):false;
  const semStr = semCg.toFixed(2);
  const semCrEl = document.getElementById("semDisplay");
  if (semCrEl) animNum(semCrEl, semStr, 2);
  ["semCgPill","cpFootCg"].forEach(id=>{const e=document.getElementById(id); if(e) e.textContent=semStr;});
  setChip("semChip",semCg,semHas);
  if (sem) {
    const cr=sem.courses.reduce((s,c)=>s+(parseFloat(c.credit)||0),0);
    const d=document.getElementById("semDetail");
    if(d) d.textContent=`${sem.courses.length} course${sem.courses.length!==1?"s":""} · ${cr} credit${cr!==1?"s":""}`;
  }
  // ── FIX: update foot summary live ──
  updateFootSummary(sem);

  // Cumulative
  let totalCr=0, totalWPts=0;
  sems.forEach(s=>s.courses.forEach(c=>{
    const x=parseFloat(c.credit)||0; totalCr+=x; totalWPts+=weightedPoints(c.grade,x);
  }));
  const cgpa   = totalCr?totalWPts/totalCr:0;
  const hasData= totalCr>0;
  const cgpaEl = document.getElementById("cgpaDisplay");
  if (cgpaEl) animNum(cgpaEl, cgpa.toFixed(2), 2);
  const crEl = document.getElementById("totalCrDisplay");
  if (crEl) animNum(crEl, totalCr, 0);
  setChip("cgpaChip",cgpa,hasData);
  const bar=document.getElementById("cgpaBarFill");
  if (bar) bar.style.width=((cgpa/4)*100)+"%";
  const scD=document.getElementById("semCountDisplay");
  if(scD) animNum(scD, sems.length, 0);

  // Dashboard sync
  updateDashboard(cgpa,semCg,semHas,hasData,totalCr);
  updateGlobalHeader(cgpa,hasData,totalCr);
  calcTarget();
}

/* ── Global Header ── */
function updateGlobalHeader(cgpa, hasData, totalCr) {
  const g=id=>document.getElementById(id);
  if(g("gh_cgpa")) g("gh_cgpa").textContent = hasData ? cgpa.toFixed(2) : "—";
  setChip("gh_chip", cgpa, hasData);
  if(g("gh_bar"))  g("gh_bar").style.width = ((cgpa/4)*100)+"%";
  if(g("gh_cr"))   g("gh_cr").textContent  = totalCr;
  if(g("gh_sems")) g("gh_sems").textContent= sems.length;
  // Next milestone text in header
  if(g("gh_ms_txt")) {
    const ms = nextMilestoneText(cgpa, hasData);
    g("gh_ms_txt").textContent = ms.short;
  }
}

function nextMilestoneText(cgpa, hasData) {
  if(!hasData) return {short:"Add courses to begin", long:"Start logging your grades in the Semesters tab."};
  if(cgpa>=4.00) return {short:"🏅 Dean's List — Peak!", long:"You've reached the maximum CGPA of 4.00. Outstanding!"};
  const milestones=[
    {label:"Outstanding (4.00)",  min:4.00, short:"4.00 Outstanding"},
    {label:"Excellent (3.75)",    min:3.75, short:"3.75 Excellent"},
    {label:"Very Good (3.50)",    min:3.50, short:"3.50 Very Good"},
    {label:"Good (3.25)",         min:3.25, short:"3.25 Good"},
    {label:"Satisfactory (3.00)", min:3.00, short:"3.00 Satisfactory"},
    {label:"Above Average (2.75)",min:2.75, short:"2.75 Above Avg"},
    {label:"Average (2.50)",      min:2.50, short:"2.50 Average"},
  ];
  const next=milestones.find(m=>cgpa<m.min);
  if(!next) return {short:"Keep improving!", long:"You're on the right track."};
  const gap=(next.min-cgpa).toFixed(2);
  return {
    short: `${next.short} (+${gap})`,
    long:  `You need ${gap} more GPA points to reach ${next.label}.`,
    target: next.min,
    gap: parseFloat(gap)
  };
}

/* ── Dashboard ── */
function renderDashboard() {
  let totalCr=0, totalWPts=0;
  sems.forEach(s=>s.courses.forEach(c=>{
    const x=parseFloat(c.credit)||0; totalCr+=x; totalWPts+=weightedPoints(c.grade,x);
  }));
  const cgpa    = totalCr?totalWPts/totalCr:0;
  const hasData = totalCr>0;
  const totalCourses = sems.reduce((a,s)=>a+s.courses.length,0);

  // Always reset so animNum animates from 0 on every full render (nav or page load)
  ["d_cgpa","d_totalCr","d_totalCourses","d_semCount","d_avgCr"].forEach(resetAnimEl);

  const g = id => document.getElementById(id);
  if(g("d_cgpa"))        animNum(g("d_cgpa"), cgpa.toFixed(2),2);
  if(g("d_cgpaBar"))     g("d_cgpaBar").style.width=((cgpa/4)*100)+"%";
  setChip("d_chip",cgpa,hasData);
  if(g("d_totalCr"))     animNum(g("d_totalCr"), totalCr,0);
  if(g("d_totalCourses"))animNum(g("d_totalCourses"), totalCourses,0);
  if(g("d_semCount"))    animNum(g("d_semCount"), sems.length, 0);
  if(g("d_avgCr"))       animNum(g("d_avgCr"), sems.length?(totalCr/sems.length):0, 1);

  renderSemOverview();
  renderBestWorst();
  renderDashGradeDist();
  renderRecentActivity();
  renderQuickInsights(cgpa,hasData,totalCr,totalCourses);
}

function updateDashboard(cgpa,semCg,semHas,hasData,totalCr) {
  // Live sync while typing — use textContent directly (no animation, avoids resetting dataset.v
  // which would break the entry animation when renderDashboard runs right after)
  const g = id => document.getElementById(id);
  if(g("d_cgpa"))    { g("d_cgpa").textContent = cgpa.toFixed(2); g("d_cgpa").dataset.v = cgpa.toFixed(2); }
  if(g("d_cgpaBar")) g("d_cgpaBar").style.width=((cgpa/4)*100)+"%";
  setChip("d_chip",cgpa,hasData);
  if(g("d_totalCr")) { g("d_totalCr").textContent = totalCr; g("d_totalCr").dataset.v = totalCr; }
  const tc = sems.reduce((a,s)=>a+s.courses.length,0);
  if(g("d_totalCourses")) { g("d_totalCourses").textContent = tc; g("d_totalCourses").dataset.v = tc; }
  if(g("d_semCount"))  { g("d_semCount").textContent = sems.length; g("d_semCount").dataset.v = sems.length; }
  const avg = sems.length?(totalCr/sems.length):0;
  if(g("d_avgCr"))   { g("d_avgCr").textContent = avg.toFixed(1); g("d_avgCr").dataset.v = avg; }
}

function renderDashGradeDist() {
  const el=document.getElementById("dashGradeDist"); if(!el) return;
  const counts={};
  Object.keys(GP).forEach(g=>counts[g]=0);
  sems.forEach(s=>s.courses.forEach(c=>{ if(counts[c.grade]!==undefined) counts[c.grade]++; }));
  const max=Math.max(1,...Object.values(counts));
  el.innerHTML="";
  Object.entries(counts).filter(([,n])=>n>0).forEach(([g,n])=>{
    const col=GCOL[g]||"#6b7280";
    const row=document.createElement("div"); row.className="dg-row";
    row.innerHTML=`<span class="dg-g" style="color:${col}">${g}</span>
      <div class="dg-track"><div class="dg-fill" style="width:0%;background:${col}"></div></div>
      <span class="dg-cnt">${n}</span>`;
    el.appendChild(row);
    setTimeout(()=>row.querySelector(".dg-fill").style.width=((n/max)*100)+"%",80);
  });
  if(!Object.values(counts).some(n=>n>0))
    el.innerHTML=`<p style="font-size:12px;color:var(--text3);padding:8px 0">No courses yet.</p>`;
}

function renderRecentActivity() {
  const el=document.getElementById("recentActivity"); if(!el) return;
  // Build activity from last-added courses across sems (reversed)
  const acts=[];
  [...sems].reverse().forEach(sem=>{
    [...sem.courses].reverse().forEach(c=>{
      if(acts.length>=6) return;
      const gp=gpOfGrade(c.grade);
      const col=GCOL[c.grade]||"#6b7280";
      acts.push({
        text: c.name?`<strong>${escH(c.name)}</strong> — ${c.grade} (${gp.toFixed(2)} GP)`
                    :`Course in <strong>${escH(sem.name)}</strong> — ${c.grade}`,
        meta: escH(sem.name),
        col
      });
    });
  });
  if(!acts.length){
    el.innerHTML=`<p style="font-size:12px;color:var(--text3);padding:8px 0">No activity yet. Add courses in Semesters.</p>`;
    return;
  }
  el.innerHTML=acts.map(a=>`
    <div class="activity-item">
      <div class="act-dot" style="background:${a.col}"></div>
      <div>
        <div class="act-text">${a.text}</div>
        <div class="act-meta">${a.meta}</div>
      </div>
    </div>`).join("");
}

function renderQuickInsights(cgpa, hasData, totalCr, totalCourses) {
  const el=document.getElementById("quickInsights"); if(!el) return;

  const counts={};
  Object.keys(GP).forEach(g=>counts[g]=0);
  sems.forEach(s=>s.courses.forEach(c=>{ if(counts[c.grade]!==undefined) counts[c.grade]++; }));
  const total=Object.values(counts).reduce((a,b)=>a+b,0);
  const aRange=(counts["A+"]||0)+(counts["A"]||0)+(counts["A-"]||0);
  const fails=counts["F"]||0;
  const bRange=(counts["B+"]||0)+(counts["B"]||0)+(counts["B-"]||0);
  const cOrBelow=(counts["C+"]||0)+(counts["C"]||0)+(counts["D"]||0);
  const gpaPct=((cgpa/4)*100).toFixed(1);

  // Milestone gap
  const milestones=[{t:4.00,l:"Outstanding"},{t:3.75,l:"Excellent"},{t:3.50,l:"Very Good"},{t:3.25,l:"Good"},{t:3.00,l:"Satisfactory"}];
  const nextMs=milestones.find(m=>cgpa<m.t);
  const gapStr=nextMs?`+${(nextMs.t-cgpa).toFixed(2)} to ${nextMs.l}`:"Peak — 4.00!";

  // Consistency score (lower stddev = more consistent)
  const semCgs=sems.map(s=>calcCg(s.courses)).filter(v=>v>0);
  let consistency="—";
  if(semCgs.length>=2){
    const mean=semCgs.reduce((a,b)=>a+b,0)/semCgs.length;
    const sd=Math.sqrt(semCgs.map(v=>(v-mean)**2).reduce((a,b)=>a+b,0)/semCgs.length);
    consistency=sd<0.15?"🟢 Very Consistent":sd<0.35?"🟡 Moderate":"🔴 High Variance";
  }

  // Credit load efficiency: weighted pts per credit
  const efficiency=totalCr>0?((cgpa/4)*100).toFixed(1)+"%":"—";

  // Best and worst semester names
  const sortedSems=sems.filter(s=>s.courses.some(c=>(parseFloat(c.credit)||0)>0))
                       .sort((a,b)=>calcCg(b.courses)-calcCg(a.courses));
  const bestSemLabel=sortedSems.length?`${sortedSems[0].name} (${calcCg(sortedSems[0].courses).toFixed(2)})`:"-";

  if(!total){
    el.innerHTML=`<div class="qi-item"><span class="qi-label">Status</span><span class="qi-val" style="color:var(--text3)">No data yet</span></div>`;
    return;
  }

  const {label:statusLabel}=ugcStatus(cgpa,hasData);
  const rows=[
    {l:"Status",           v:statusLabel||"—",          c:cgpa>=3.75?"#10b981":cgpa>=3.0?"var(--cyan)":"#f59e0b"},
    {l:"GPA Completion",   v:gpaPct+"%",                c:"var(--text)"},
    {l:"Next Milestone",   v:gapStr,                    c:"var(--violet)"},
    {l:"A-range Rate",     v:total?Math.round((aRange/total)*100)+"%":"—", c:"#10b981"},
    {l:"B-range Rate",     v:total?Math.round((bRange/total)*100)+"%":"—", c:"#818cf8"},
    {l:"Needs Attention",  v:cOrBelow>0?`${cOrBelow} course${cOrBelow>1?"s":""}`:"None", c:cOrBelow>0?"#f97316":"#10b981"},
    {l:"Failed Courses",   v:fails>0?fails:"None",       c:fails>0?"#ef4444":"#10b981"},
    {l:"Consistency",      v:consistency,               c:"var(--text2)"},
    {l:"Best Semester",    v:bestSemLabel,              c:"#f59e0b"},
    {l:"Avg Credits/Sem",  v:sems.length?(totalCr/sems.length).toFixed(1):"—", c:"var(--text2)"},
  ];
  el.innerHTML=rows.map(r=>`
    <div class="qi-item">
      <span class="qi-label">${r.l}</span>
      <span class="qi-val" style="color:${r.c}">${r.v}</span>
    </div>`).join("");
}

function renderSemOverview() {
  const el=document.getElementById("semOverview"); if (!el) return;
  el.innerHTML="";
  sems.forEach((sem,i)=>{
    const cg=calcCg(sem.courses);
    const cr=sem.courses.reduce((s,c)=>s+(parseFloat(c.credit)||0),0);
    const has=sem.courses.some(c=>(parseFloat(c.credit)||0)>0);
    const {label,cls}=ugcStatus(cg,has);
    const col=SEM_COLORS[i%SEM_COLORS.length];
    const card=document.createElement("div");
    card.className="sov-card";
    card.onclick=()=>{ nav(document.querySelector('[data-view="calculator"]')); switchSem(sem.id); };
    card.innerHTML=`
      <p class="sov-name">${escH(sem.name)}</p>
      <p class="sov-cg" style="color:${col}">${cg.toFixed(2)}</p>
      <p class="sov-info">${sem.courses.length} courses · ${cr} credits</p>
      <span class="chip ${cls} sov-chip">${label}</span>`;
    el.appendChild(card);
  });
}

function renderBestWorst() {
  // collect all courses across all sems
  const all=[];
  sems.forEach(sem=>sem.courses.forEach(c=>{
    if ((parseFloat(c.credit)||0)>0)
      all.push({name:c.name||"Unnamed",grade:c.grade,gp:gpOfGrade(c.grade),sem:sem.name});
  }));
  all.sort((a,b)=>b.gp-a.gp);
  // Show ALL best courses (GP >= 3.75 = A range), fallback to top 5 if none qualify
  const aRangeCourses = all.filter(c=>c.gp>=3.75);
  const top = aRangeCourses.length ? aRangeCourses : all.slice(0,5);
  // Show ALL courses below 3.0
  const worst = [...all].sort((a,b)=>a.gp-b.gp).filter(c=>c.gp<3.0);

  const render=(id,list,empty)=>{
    const el=document.getElementById(id); if (!el) return;
    if (!list.length){el.innerHTML=`<p style="font-size:12px;color:var(--text3);padding:8px 0">${empty}</p>`;return;}
    el.innerHTML=list.map(c=>`
      <div class="course-row-item">
        <span class="cri-name">${escH(c.name)}</span>
        <span class="cri-grade" style="color:${GCOL[c.grade]||"#6b7280"}">${c.grade}</span>
        <span class="cri-sem">${escH(c.sem)}</span>
      </div>`).join("");
  };
  render("bestCourses",top,"No courses with credits yet.");
  render("worstCourses",worst,"All courses at 3.00+ — great job!");
}

function renderInsights(cgpa,totalCr) {
  const el=document.getElementById("insightRow"); if (!el) return;
  // count grades
  const counts={};
  Object.keys(GP).forEach(g=>counts[g]=0);
  sems.forEach(s=>s.courses.forEach(c=>{ if(counts[c.grade]!==undefined) counts[c.grade]++; }));
  const total=Object.values(counts).reduce((a,b)=>a+b,0);
  const aCount=  (counts["A+"]||0)+(counts["A"]||0)+(counts["A-"]||0);
  const failCount= counts["F"]||0;
  const bestSem  = sems.slice().sort((a,b)=>calcCg(b.courses)-calcCg(a.courses))[0];
  const worstSem = sems.slice().sort((a,b)=>calcCg(a.courses)-calcCg(b.courses))[0];

  const items=[
    {label:"Total Courses",val:total,sub:"across all semesters"},
    {label:"A-range Grades",val:aCount,sub:`${total?((aCount/total)*100).toFixed(0):0}% of all courses`},
    {label:"Failed Courses",val:failCount,sub:"F grades"},
    {label:"Best Semester",val:bestSem?calcCg(bestSem.courses).toFixed(2):"—",sub:bestSem?bestSem.name:""},
    {label:"Lowest Semester",val:sems.length>1?calcCg(worstSem.courses).toFixed(2):"—",sub:sems.length>1?worstSem.name:"Only 1 sem"},
    {label:"Avg Credits/Sem",val:sems.length?(totalCr/sems.length).toFixed(1):"0",sub:"per semester"},
  ];
  el.innerHTML=items.map(it=>`
    <div class="insight-card">
      <p class="ins-label">${it.label}</p>
      <p class="ins-val">${it.val}</p>
      <p class="ins-sub">${it.sub}</p>
    </div>`).join("");
}

/* ── Analytics ── */
function renderAnalytics() {
  renderTrendLine();
  renderBestLowestSemCards();
  renderDonut();
  renderGradeDist();
  renderSemCompare();
  renderGpaClassification();
  renderPerfInsights();
  renderHeatmap();
  renderCumulative();
}

function renderBarChart() {
  const bc=document.getElementById("barChart"); const bl=document.getElementById("barLabels");
  if (!bc||!bl) return;
  bc.innerHTML=""; bl.innerHTML="";
  sems.forEach((sem,i)=>{
    const cg=calcCg(sem.courses);
    const col=SEM_COLORS[i%SEM_COLORS.length];
    const col_div=document.createElement("div"); col_div.className="bar-col";
    col_div.innerHTML=`<span class="bar-val">${cg.toFixed(2)}</span>
      <div class="bar-body" style="height:0%;background:${col};box-shadow:0 0 10px ${col}55"></div>`;
    bc.appendChild(col_div);
    const lbl=document.createElement("div"); lbl.className="bar-lbl";
    lbl.textContent=sem.name; bl.appendChild(lbl);
    setTimeout(()=>{ col_div.querySelector(".bar-body").style.height=((cg/4)*100)+"%"; },60+i*70);
  });
}

// Donut with canvas + hover tooltip
let _donutData=[];
function renderDonut() {
  const canvas=document.getElementById("donutCanvas");
  const numEl =document.getElementById("donutNum");
  const tipEl =document.getElementById("donutTip");
  const legEl =document.getElementById("donutLegend");
  if (!canvas) return;
  const ctx=canvas.getContext("2d");
  const W=canvas.width, H=canvas.height, cx=W/2, cy=H/2, R=70, r=42;

  _donutData=[];
  let totalCr=0;
  sems.forEach((sem,i)=>{
    const cr=sem.courses.reduce((s,c)=>s+(parseFloat(c.credit)||0),0);
    totalCr+=cr;
    if (cr>0) _donutData.push({label:sem.name,cr,color:SEM_COLORS[i%SEM_COLORS.length]});
  });
  animNum(numEl, totalCr, 0);

  ctx.clearRect(0,0,W,H);
  if (!_donutData.length) {
    ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2);
    ctx.strokeStyle="rgba(255,255,255,.07)"; ctx.lineWidth=28; ctx.stroke();
    if (legEl) legEl.innerHTML="";
    return;
  }

  let startAngle=-Math.PI/2;
  _donutData.forEach(seg=>{
    seg.start=startAngle;
    const sweep=(seg.cr/totalCr)*Math.PI*2;
    seg.end=startAngle+sweep;
    ctx.beginPath();
    ctx.arc(cx,cy,R,startAngle,seg.end);
    ctx.strokeStyle=seg.color; ctx.lineWidth=28; ctx.lineCap="butt";
    ctx.stroke();
    startAngle=seg.end;
  });
  // inner cutout
  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
  const isDark=document.documentElement.getAttribute("data-theme")!=="light";
  ctx.fillStyle=isDark?"#0d1020":"#fff"; ctx.fill();

  if (legEl) {
    legEl.innerHTML=_donutData.map(d=>`
      <div class="dl-row">
        <div class="dl-dot" style="background:${d.color}"></div>
        <span>${escH(d.label)}: ${d.cr} cr</span>
      </div>`).join("");
  }

  // Hover tooltip
  const wrap=canvas.parentElement;
  canvas.onmousemove = e => {
    const rect=canvas.getBoundingClientRect();
    const mx=e.clientX-rect.left, my=e.clientY-rect.top;
    const dx=mx-cx, dy=my-cy, dist=Math.sqrt(dx*dx+dy*dy);
    if (dist<r||dist>R+14) { tipEl.classList.remove("show"); return; }
    let angle=Math.atan2(dy,dx);
    if (angle<-Math.PI/2) angle+=Math.PI*2;
    const seg=_donutData.find(d=>angle>=d.start&&angle<d.end);
    if (seg) {
      const pct=((seg.cr/totalCr)*100).toFixed(1);
      tipEl.textContent=`${seg.label}: ${seg.cr} cr (${pct}%)`;
      tipEl.style.left=(mx+10)+"px"; tipEl.style.top=(my-8)+"px";
      tipEl.classList.add("show");
    } else { tipEl.classList.remove("show"); }
  };
  canvas.onmouseleave = () => tipEl.classList.remove("show");
}

function renderTrendLine() {
  const svg=document.getElementById("trendSvg"); if (!svg) return;
  svg.innerHTML="";
  if (sems.length<2) {
    svg.innerHTML=`<text x="350" y="80" text-anchor="middle" fill="rgba(255,255,255,.12)" font-family="DM Sans,sans-serif" font-size="13">Add 2+ semesters to see trend</text>`;
    return;
  }
  const cgs=sems.map(s=>calcCg(s.courses));
  const W=700,H=160,PAD=28;
  const mn=Math.max(0,Math.min(...cgs)-.3), mx=Math.min(4,Math.max(...cgs)+.3);
  const pts=cgs.map((cg,i)=>[PAD+i*(W-2*PAD)/(sems.length-1), H-PAD-((cg-mn)/(mx-mn))*(H-2*PAD)]);
  svg.innerHTML=`<defs>
    <linearGradient id="tg" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#22d3ee" stop-opacity=".2"/>
      <stop offset="100%" stop-color="#22d3ee" stop-opacity="0"/>
    </linearGradient></defs>`;
  const area=document.createElementNS("http://www.w3.org/2000/svg","path");
  area.setAttribute("d",`M${pts[0][0]},${H-PAD} `+pts.map(p=>`L${p[0]},${p[1]}`).join(" ")+` L${pts[pts.length-1][0]},${H-PAD} Z`);
  area.setAttribute("fill","url(#tg)"); svg.appendChild(area);
  const poly=document.createElementNS("http://www.w3.org/2000/svg","polyline");
  poly.setAttribute("points",pts.map(p=>p.join(",")).join(" "));
  poly.setAttribute("fill","none"); poly.setAttribute("stroke","#22d3ee");
  poly.setAttribute("stroke-width","2.5"); poly.setAttribute("stroke-linejoin","round");
  svg.appendChild(poly);
  const trendTheme=document.documentElement.getAttribute("data-theme")==="light";
  pts.forEach(([x,y],i)=>{
    const c=document.createElementNS("http://www.w3.org/2000/svg","circle");
    c.setAttribute("cx",x); c.setAttribute("cy",y); c.setAttribute("r","5");
    c.setAttribute("fill","#22d3ee"); c.setAttribute("stroke",trendTheme?"#f0f2fa":"#0d1020"); c.setAttribute("stroke-width","2");
    svg.appendChild(c);
    const t=document.createElementNS("http://www.w3.org/2000/svg","text");
    t.setAttribute("x",x); t.setAttribute("y",y-10); t.setAttribute("text-anchor","middle");
    t.setAttribute("font-size","10"); t.setAttribute("fill","#22d3ee"); t.setAttribute("font-family","JetBrains Mono,monospace");
    t.textContent=cgs[i].toFixed(2); svg.appendChild(t);
  });
}

function renderGradeDist() {
  const el=document.getElementById("gradeDist"); if (!el) return;
  // Build map: grade -> [{name, sem}]
  const gradeMap={};
  Object.keys(GP).forEach(g=>gradeMap[g]=[]);
  sems.forEach(s=>s.courses.forEach(c=>{
    if(gradeMap[c.grade]!==undefined)
      gradeMap[c.grade].push({name:c.name||"Unnamed", sem:s.name});
  }));
  const counts={}; Object.keys(GP).forEach(g=>counts[g]=gradeMap[g].length);
  const max=Math.max(1,...Object.values(counts));
  el.innerHTML="";
  Object.entries(gradeMap).filter(([,arr])=>arr.length>0).forEach(([g,arr])=>{
    const n=arr.length;
    const col=GCOL[g]||"#6b7280";
    const block=document.createElement("div"); block.className="gd-block";
    const courseListHtml=arr.map(c=>`
      <div class="gd-course-item">
        <span class="gd-ci-dot" style="background:${col}"></span>
        <span class="gd-ci-name">${escH(c.name)}</span>
        <span class="gd-ci-sem">${escH(c.sem)}</span>
      </div>`).join("");
    block.innerHTML=`
      <div class="gd-row gd-row-clickable" onclick="toggleGdBlock(this,\'${col}\')">
        <span class="gd-g" style="color:${col}">${g}</span>
        <div class="gd-track"><div class="gd-fill" style="width:0%;background:${col}"></div></div>
        <span class="gd-cnt">${n}</span>
        <svg class="gd-chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="${col}" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="gd-course-list">${courseListHtml}</div>`;
    el.appendChild(block);
    setTimeout(()=>{ block.querySelector(".gd-fill").style.width=((n/max)*100)+"%"; },80);
  });
  if (!Object.values(counts).some(n=>n>0))
    el.innerHTML=`<p style="font-size:12px;color:var(--text3);text-align:center;padding:16px">No course data yet.</p>`;
}

function toggleGdBlock(rowEl, col) {
  const block=rowEl.closest(".gd-block");
  const wasOpen=block.classList.contains("open");
  block.classList.toggle("open");
  if (!wasOpen) {
    // Apply tinted background based on the grade color
    block.style.background=col+"18";
    block.style.borderColor=col+"55";
  } else {
    block.style.background="";
    block.style.borderColor="";
  }
}

function renderSemCompare() {
  const el=document.getElementById("semCompare"); if (!el) return;
  const cgs=sems.map(s=>calcCg(s.courses));
  const maxCg=Math.max(.01,...cgs);
  el.innerHTML=sems.map((sem,i)=>{
    const cg=cgs[i], col=SEM_COLORS[i%SEM_COLORS.length];
    const has=sem.courses.some(c=>(parseFloat(c.credit)||0)>0);
    const {label}=ugcStatus(cg,has);
    return `<div class="scmp-row">
      <div class="scmp-head"><span>${escH(sem.name)}</span><span style="font-family:'JetBrains Mono',monospace;color:${col}">${cg.toFixed(2)} — ${label}</span></div>
      <div class="scmp-track"><div class="scmp-fill" data-tgt="${(cg/maxCg)*100}" style="width:0%;background:${col}"></div></div>
    </div>`;
  }).join("");
  setTimeout(()=>{
    el.querySelectorAll(".scmp-fill").forEach(f=>f.style.width=f.dataset.tgt+"%");
  },80);
}

function renderHeatmap() {
  const el=document.getElementById("heatmap"); if (!el) return;
  if (!sems.length) {el.innerHTML=`<p style="font-size:12px;color:var(--text3);padding:8px">No data.</p>`; return;}
  const maxC=Math.max(...sems.map(s=>s.courses.length));
  if (!maxC) {el.innerHTML=`<p style="font-size:12px;color:var(--text3)">No courses yet.</p>`;return;}

  // Shared floating tooltip
  let tip=document.getElementById("hmTip");
  if(!tip){tip=document.createElement("div");tip.id="hmTip";tip.className="hm-tip";document.body.appendChild(tip);}

  el.style.display="grid";
  el.style.gridTemplateColumns=`48px repeat(${sems.length},1fr)`;
  el.style.gap="4px";
  el.innerHTML="";

  // header row — abbreviated names to avoid overflow
  const blank=document.createElement("div"); blank.className="hm-col-label"; el.appendChild(blank);
  sems.forEach(sem=>{
    const h=document.createElement("div"); h.className="hm-col-label";
    const parts=sem.name.split(" ");
    h.textContent=parts.length>=2 ? parts[0].slice(0,3)+"'"+parts[1].slice(2) : sem.name;
    h.title=sem.name;
    el.appendChild(h);
  });

  // course rows
  for (let r=0;r<maxC;r++) {
    const rl=document.createElement("div"); rl.className="hm-row-label"; rl.textContent=`C${r+1}`; el.appendChild(rl);
    sems.forEach(sem=>{
      const c=sem.courses[r];
      const cell=document.createElement("div"); cell.className="hm-cell";
      if (c && (parseFloat(c.credit)||0)>0) {
        const col=GCOL[c.grade]||"#6b7280";
        cell.style.cssText=`background:${col}28;border:1px solid ${col}55;color:${col}`;
        cell.textContent=c.grade;
        cell.addEventListener("mouseenter",e=>{
          tip.innerHTML=`<span style="color:${col};font-weight:700">${escH(c.grade)}</span>&ensp;${escH(c.name||"Course")}<br><small>${escH(sem.name)} &middot; ${gpOfGrade(c.grade).toFixed(2)} GP &middot; ${c.credit} cr</small>`;
          tip.classList.add("show");
          posHmTip(e);
        });
        cell.addEventListener("mousemove",posHmTip);
        cell.addEventListener("mouseleave",()=>tip.classList.remove("show"));
      } else {
        cell.style.cssText="background:rgba(128,128,128,.06);border:1px solid rgba(128,128,128,.1)";
      }
      el.appendChild(cell);
    });
  }
}
function posHmTip(e){
  const tip=document.getElementById("hmTip"); if(!tip) return;
  const x=e.clientX, y=e.clientY;
  const tw=tip.offsetWidth||180, th=tip.offsetHeight||52;
  let left=x+14, top=y-th-10;
  if(left+tw>window.innerWidth-8) left=x-tw-14;
  if(top<8) top=y+20;
  tip.style.left=left+"px"; tip.style.top=top+"px";
}

function renderCrLoad() {
  const el=document.getElementById("crLoad"); if (!el) return;
  const loads=sems.map(s=>({name:s.name,cr:s.courses.reduce((a,c)=>a+(parseFloat(c.credit)||0),0)}));
  const max=Math.max(1,...loads.map(l=>l.cr));
  el.innerHTML=loads.map((l,i)=>`
    <div class="crl-row">
      <span class="crl-name">${escH(l.name)}</span>
      <div class="crl-track"><div class="crl-fill" data-w="${(l.cr/max)*100}" style="width:0%"></div></div>
      <span class="crl-num">${l.cr}</span>
    </div>`).join("");
  setTimeout(()=>{el.querySelectorAll(".crl-fill").forEach(f=>f.style.width=f.dataset.w+"%");},80);
}

function renderCumulative() {
  const svg=document.getElementById("cumulWrap"); if (!svg) return;
  svg.innerHTML="";
  if (sems.length<1) return;
  // Build cumulative CGPA series
  const pts=[];
  let cumCr=0, cumPts=0;
  sems.forEach((sem,i)=>{
    sem.courses.forEach(c=>{const x=parseFloat(c.credit)||0; cumCr+=x; cumPts+=weightedPoints(c.grade,x);});
    pts.push({x:i, cg:cumCr?cumPts/cumCr:0, label:sem.name});
  });
  const s=document.createElementNS("http://www.w3.org/2000/svg","svg");
  s.setAttribute("viewBox","0 0 700 140"); s.setAttribute("preserveAspectRatio","none");
  s.className.baseVal="cumul-svg"; s.style.width="100%"; s.style.height="100%";
  if (pts.length>=2) {
    const W=700,H=140,PAD=20;
    const mn=Math.max(0,Math.min(...pts.map(p=>p.cg))-.2);
    const mx=Math.min(4,Math.max(...pts.map(p=>p.cg))+.2);
    const coords=pts.map((p,i)=>[PAD+i*(W-2*PAD)/(pts.length-1), H-PAD-((p.cg-mn)/(mx-mn))*(H-2*PAD)]);
    s.innerHTML=`<defs><linearGradient id="cg" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#818cf8" stop-opacity=".22"/>
      <stop offset="100%" stop-color="#818cf8" stop-opacity="0"/>
    </linearGradient></defs>`;
    const area=document.createElementNS("http://www.w3.org/2000/svg","path");
    area.setAttribute("d",`M${coords[0][0]},${H-PAD} `+coords.map(p=>`L${p[0]},${p[1]}`).join(" ")+` L${coords[coords.length-1][0]},${H-PAD} Z`);
    area.setAttribute("fill","url(#cg)"); s.appendChild(area);
    const poly=document.createElementNS("http://www.w3.org/2000/svg","polyline");
    poly.setAttribute("points",coords.map(p=>p.join(",")).join(" "));
    poly.setAttribute("fill","none"); poly.setAttribute("stroke","#818cf8"); poly.setAttribute("stroke-width","2.5"); poly.setAttribute("stroke-linejoin","round");
    s.appendChild(poly);
    const cumulTheme=document.documentElement.getAttribute("data-theme")==="light";
    coords.forEach(([x,y],i)=>{
      const c=document.createElementNS("http://www.w3.org/2000/svg","circle");
      c.setAttribute("cx",x); c.setAttribute("cy",y); c.setAttribute("r","4");
      c.setAttribute("fill","#818cf8"); c.setAttribute("stroke",cumulTheme?"#f0f2fa":"#0d1020"); c.setAttribute("stroke-width","2");
      s.appendChild(c);
      const t=document.createElementNS("http://www.w3.org/2000/svg","text");
      t.setAttribute("x",x); t.setAttribute("y",y-9); t.setAttribute("text-anchor","middle");
      t.setAttribute("font-size","10"); t.setAttribute("fill","#818cf8"); t.setAttribute("font-family","JetBrains Mono,monospace");
      t.textContent=pts[i].cg.toFixed(2); s.appendChild(t);
    });
  } else {
    s.innerHTML=`<text x="350" y="70" text-anchor="middle" fill="rgba(255,255,255,.12)" font-family="DM Sans,sans-serif" font-size="13">Add 2+ semesters to see cumulative trend</text>`;
  }
  svg.appendChild(s);
}

function renderBestLowestSemCards() {
  if(!sems.length) return;
  const withData=sems.filter(s=>s.courses.some(c=>(parseFloat(c.credit)||0)>0));
  if(!withData.length) return;
  const sorted=[...withData].sort((a,b)=>calcCg(b.courses)-calcCg(a.courses));
  const best=sorted[0], low=sorted[sorted.length-1];

  const fill=(nameId,cgId,chipId,sem)=>{
    const n=document.getElementById(nameId); if(n) n.textContent=sem.name;
    const v=document.getElementById(cgId);
    if(v){ v.textContent=calcCg(sem.courses).toFixed(2); }
    const has=sem.courses.some(c=>(parseFloat(c.credit)||0)>0);
    setChip(chipId,calcCg(sem.courses),has);
  };
  fill("bestSemName","bestSemCg","bestSemChip",best);
  fill("lowSemName","lowSemCg","lowSemChip",low);
  // color the vals
  const bv=document.getElementById("bestSemCg"); if(bv) bv.style.color="var(--green)";
  const lv=document.getElementById("lowSemCg");  if(lv) lv.style.color="var(--red)";
}

function renderGpaClassification() {
  const el=document.getElementById("gpaClass"); if(!el) return;
  let totalCr=0,totalWPts=0;
  sems.forEach(s=>s.courses.forEach(c=>{
    const x=parseFloat(c.credit)||0; totalCr+=x; totalWPts+=weightedPoints(c.grade,x);
  }));
  const cgpa=totalCr?totalWPts/totalCr:0;

  const classes=[
    {label:"Outstanding",  range:"≥ 4.00",       min:4.00,max:4.00,col:"#34d399"},
    {label:"Excellent",    range:"3.75 – 3.99",   min:3.75,max:3.99,col:"#22d3ee"},
    {label:"Very Good",    range:"3.50 – 3.74",   min:3.50,max:3.74,col:"#38bdf8"},
    {label:"Good",         range:"3.25 – 3.49",   min:3.25,max:3.49,col:"#818cf8"},
    {label:"Satisfactory", range:"3.00 – 3.24",   min:3.00,max:3.24,col:"#a78bfa"},
    {label:"Above Average",range:"2.75 – 2.99",   min:2.75,max:2.99,col:"#fbbf24"},
    {label:"Average",      range:"2.50 – 2.74",   min:2.50,max:2.74,col:"#fb923c"},
    {label:"Below Average",range:"2.25 – 2.49",   min:2.25,max:2.49,col:"#f87171"},
    {label:"Pass",         range:"2.00 – 2.24",   min:2.00,max:2.24,col:"#94a3b8"},
    {label:"Fail",         range:"< 2.00",         min:0,   max:1.99,col:"#6b7280"},
  ];
  el.innerHTML=classes.map(c=>{
    const isActive=totalCr>0&&cgpa>=c.min&&cgpa<=(c.max===4.00?4.00:c.max+0.0049);
    return `<div class="gc-item${isActive?" active-cls":""}">
      <div class="gc-cls-dot" style="background:${c.col}"></div>
      <span class="gc-cls-label" style="${isActive?`color:${c.col}`:`color:var(--text2)`}">${c.label}</span>
      <span class="gc-cls-range">${c.range}</span>
    </div>`;
  }).join("");
}

function renderPerfInsights() {
  const el=document.getElementById("perfInsights"); if(!el) return;
  let totalCr=0,totalWPts=0;
  sems.forEach(s=>s.courses.forEach(c=>{
    const x=parseFloat(c.credit)||0; totalCr+=x; totalWPts+=weightedPoints(c.grade,x);
  }));
  const cgpa=totalCr?totalWPts/totalCr:0;
  const counts={};
  Object.keys(GP).forEach(g=>counts[g]=0);
  sems.forEach(s=>s.courses.forEach(c=>{ if(counts[c.grade]!==undefined) counts[c.grade]++; }));
  const total=Object.values(counts).reduce((a,b)=>a+b,0);
  const aRange=(counts["A+"]||0)+(counts["A"]||0)+(counts["A-"]||0);
  const fails=counts["F"]||0;
  const sorted=sems.filter(s=>s.courses.some(c=>(parseFloat(c.credit)||0)>0))
                   .sort((a,b)=>calcCg(b.courses)-calcCg(a.courses));

  const insights=[];
  if(!total){insights.push("No courses added yet. Head to <strong>Semesters</strong> to start.");
  } else {
    if(cgpa>=3.75) insights.push(`Outstanding performance! Your CGPA of <strong>${cgpa.toFixed(2)}</strong> places you in the top tier.`);
    else if(cgpa>=3.50) insights.push(`Great work — CGPA <strong>${cgpa.toFixed(2)}</strong>. You're in the Very Good range.`);
    else if(cgpa>=3.00) insights.push(`Solid progress — CGPA <strong>${cgpa.toFixed(2)}</strong>. Aim for 3.50+ for Excellent.`);
    else if(cgpa>=2.50) insights.push(`CGPA <strong>${cgpa.toFixed(2)}</strong> — focus on bringing grades up to B+ range.`);
    else if(cgpa>0) insights.push(`CGPA <strong>${cgpa.toFixed(2)}</strong> — consider seeking academic support.`);
    if(aRange>0) insights.push(`<strong>${aRange}</strong> of your ${total} courses are in the A-range (${((aRange/total)*100).toFixed(0)}%).`);
    if(fails>0) insights.push(`You have <strong>${fails}</strong> failed course${fails>1?"s":""}. These significantly impact your CGPA.`);
    if(sorted.length>=2){
      const diff=(calcCg(sorted[0].courses)-calcCg(sorted[sorted.length-1].courses)).toFixed(2);
      insights.push(`GPA range across semesters: <strong>${calcCg(sorted[sorted.length-1].courses).toFixed(2)}</strong> to <strong>${calcCg(sorted[0].courses).toFixed(2)}</strong> (Δ ${diff}).`);
    }
    const needed=(3.75*(totalCr+15)-totalWPts)/15;
    if(needed>0&&needed<=4) insights.push(`To reach <strong>Excellent (3.75)</strong>, you need <strong>${needed.toFixed(2)}</strong> GPA in your next 15-credit semester.`);
  }
  el.innerHTML=insights.map(t=>`<div class="pi-item">${t}</div>`).join("");
}

/* ── Graduation Toggle ── */
let _gradMode=false;
function toggleGradMode() {
  _gradMode=document.getElementById("gradToggle").checked;
  const lbl=document.getElementById("tiCreditsLabel");
  const semsGrp=document.getElementById("tiSemsGroup");
  const sub=document.getElementById("gradToggleSub");
  const trLbl=document.getElementById("trLabel");
  if(_gradMode){
    if(lbl) lbl.textContent="Total Remaining Credits (Degree)";
    if(semsGrp) semsGrp.style.display="block";
    if(sub) sub.textContent="Avg GPA per future semester to hit your CGPA target";
    if(trLbl) trLbl.textContent="Required Avg GPA Per Future Semester";
  } else {
    if(lbl) lbl.textContent="Planned Credits (Next Semester)";
    if(semsGrp) semsGrp.style.display="none";
    if(sub) sub.textContent="Uses remaining degree credits & future semesters";
    if(trLbl) trLbl.textContent="Required GPA This Semester";
  }
  calcTarget();
}

/* ── Target Calc ── */
function calcTarget() {
  const tEl=document.getElementById("targetCgpa");
  const cEl=document.getElementById("targetCredits");
  const nEl=document.getElementById("targetGpaNeeded");
  const noteEl=document.getElementById("targetNote");
  if (!tEl||!nEl) return;

  let curCr=0, curWPts=0;
  sems.forEach(s=>s.courses.forEach(c=>{const x=parseFloat(c.credit)||0; curCr+=x; curWPts+=weightedPoints(c.grade,x);}));
  const curCgpa=curCr?curWPts/curCr:0;

  const tc=document.getElementById("tbarCurrent"); if(tc) tc.style.width=((curCgpa/4)*100)+"%";
  const tn=document.getElementById("tbarCurrentNum"); if(tn) tn.textContent=curCgpa.toFixed(2);

  const tgt=parseFloat(tEl.value), planned=parseFloat(cEl.value);
  if (!tgt||!planned) {
    if(nEl) nEl.textContent="—";
    if(noteEl) noteEl.textContent="Enter your target CGPA and planned credits above.";
    ["tbarTarget","tbarNeeded"].forEach(id=>{const e=document.getElementById(id);if(e) e.style.width="0%";});
    ["tbarTargetNum","tbarNeededNum"].forEach(id=>{const e=document.getElementById(id);if(e) e.textContent="—";});
    const sc=document.getElementById("scenarios"); if(sc) sc.innerHTML=""; return;
  }

  if(_gradMode) {
    // Graduation mode: spread over all remaining credits & semesters
    const remSems=Math.max(1,parseFloat(document.getElementById("targetRemSems")?.value)||1);
    const needed=((tgt*(curCr+planned))-curWPts)/planned;
    if(nEl) nEl.textContent=needed<=0?"Already achieved!":needed>4?"Not achievable":needed.toFixed(2);
    const tt=document.getElementById("tbarTarget"); if(tt) tt.style.width=((tgt/4)*100)+"%";
    const ttn=document.getElementById("tbarTargetNum"); if(ttn) ttn.textContent=tgt.toFixed(2);
    const tnEl=document.getElementById("tbarNeeded"); if(tnEl) tnEl.style.width=(Math.min(Math.max(needed,0),4)/4*100)+"%";
    const tnnEl=document.getElementById("tbarNeededNum"); if(tnnEl) tnnEl.textContent=needed>0&&needed<=4?needed.toFixed(2):"—";
    if(noteEl) noteEl.textContent=needed<=0?"🎉 You've already exceeded your target!":
      needed<=4?`Avg GPA of ${needed.toFixed(2)} per semester across ${remSems} semester${remSems!==1?"s":""} (${planned} cr total) → CGPA ${tgt.toFixed(2)}.`:
      "⚠️ Target not achievable with the credits planned.";
    const sc=document.getElementById("scenarios"); if(!sc) return;
    const crPerSem=(planned/remSems).toFixed(1);
    const scenarios=[{l:"All A+",gpa:4.00},{l:"All A",gpa:3.75},{l:"All B+",gpa:3.25},{l:"All B",gpa:3.00},{l:"All C+",gpa:2.50},{l:"All D",gpa:2.00}];
    sc.innerHTML=scenarios.map(({l,gpa})=>{
      const newCgpa=((curWPts+gpa*planned)/(curCr+planned)).toFixed(2);
      return `<div class="sc-row"><span>${l} each (~${crPerSem} cr/sem)</span><span class="sc-val">CGPA → ${newCgpa}</span></div>`;
    }).join("");
  } else {
    const needed=((tgt*(curCr+planned))-curWPts)/planned;
    if(nEl) nEl.textContent=needed<=0?"Already achieved!":needed>4?"Not achievable (>4.00)":needed.toFixed(2);
    const tt=document.getElementById("tbarTarget"); if(tt) tt.style.width=((tgt/4)*100)+"%";
    const ttn=document.getElementById("tbarTargetNum"); if(ttn) ttn.textContent=tgt.toFixed(2);
    const tnEl=document.getElementById("tbarNeeded"); if(tnEl) tnEl.style.width=(Math.min(Math.max(needed,0),4)/4*100)+"%";
    const tnnEl=document.getElementById("tbarNeededNum"); if(tnnEl) tnnEl.textContent=needed>0&&needed<=4?needed.toFixed(2):"—";
    if(noteEl) noteEl.textContent=needed<=0?"🎉 You've already exceeded your target!":
      needed<=4?`You need ${needed.toFixed(2)} GPA this semester to reach CGPA ${tgt.toFixed(2)}.`:
      "⚠️ Target not achievable with planned credits alone.";
    const sc=document.getElementById("scenarios"); if(!sc) return;
    const scenarios=[{l:"All A+",gpa:4.00},{l:"All A",gpa:3.75},{l:"All B+",gpa:3.25},{l:"All B",gpa:3.00},{l:"All C+",gpa:2.50},{l:"All D",gpa:2.00}];
    sc.innerHTML=scenarios.map(({l,gpa})=>{
      const newCgpa=((curWPts+gpa*planned)/(curCr+planned)).toFixed(2);
      return `<div class="sc-row"><span>${l} this semester</span><span class="sc-val">CGPA → ${newCgpa}</span></div>`;
    }).join("");
  }
}

/* ── Navigation ── */
function nav(btn) {
  const view=btn.dataset.view;
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.querySelectorAll(".snav,.mob-btn").forEach(b=>{
    if (b.dataset.view===view) b.classList.add("active"); else b.classList.remove("active");
  });
  document.getElementById("view-"+view).classList.add("active");
  if (view==="calculator") {
    ensureSemester();
    // Reset Semesters tab cards so they animate on entry
    ["semDisplay","totalCrDisplay","semCountDisplay"].forEach(resetAnimEl);
    updateStats();
  }
  if (view==="analytics") setTimeout(renderAnalytics,50);
  if (view==="dashboard") renderDashboard();
  // Scroll the content area to top, not the window (prevents the scroll-jump bug)
  const content=document.querySelector(".content");
  if(content) content.scrollTop=0;
}

/* ── Sem Picker ── */
let _selType="Spring";
function pickType(btn) {
  document.querySelectorAll(".stype-btn").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active"); _selType=btn.dataset.type; updateSemPreview();
}
function updateSemPreview() {
  const year=document.getElementById("semYearInp").value||new Date().getFullYear();
  const pv=document.getElementById("semPreview");
  if (pv) pv.textContent=`${_selType} ${year}`;
}

/* ── Modals ── */
function openAddSemModal() {
  _selType="Spring";
  document.querySelectorAll(".stype-btn").forEach(b=>b.classList.toggle("active",b.dataset.type==="Spring"));
  const yi=document.getElementById("semYearInp");
  yi.value=new Date().getFullYear();
  updateSemPreview();
  document.getElementById("addSemModal").classList.add("open");
}
function closeAddSemModal() { document.getElementById("addSemModal").classList.remove("open"); }
function closeDelSemModal()  { document.getElementById("delSemModal").classList.remove("open"); _pendingDelId=null; }
function openClearModal()    { document.getElementById("clearModal").classList.add("open"); }
function closeClearModal()   { document.getElementById("clearModal").classList.remove("open"); }

function clearAll() {
  closeClearModal(); sems=[]; activeId=null;
  try {localStorage.removeItem(KEY);} catch {}
  renderDashboard();
}

/* ── Theme ── */
function toggleTheme() {
  const isLight=document.documentElement.getAttribute("data-theme")==="light";
  applyTheme(isLight?"dark":"light");
  try {localStorage.setItem("gradeos_theme",isLight?"dark":"light");} catch {}
}
function applyTheme(t) {
  const setDisp=(cls,d)=>document.querySelectorAll(cls).forEach(e=>e.style.display=d);
  if (t==="light") {
    document.documentElement.setAttribute("data-theme","light");
    setDisp(".ico-moon,.ico-moon2","none"); setDisp(".ico-sun,.ico-sun2","block");
  } else {
    document.documentElement.setAttribute("data-theme","dark");
    setDisp(".ico-moon,.ico-moon2","block"); setDisp(".ico-sun,.ico-sun2","none");
  }
  // re-render donut for bg color
  setTimeout(renderDonut,50);
}
function loadTheme() {
  try {
    const t=localStorage.getItem("gradeos_theme");
    applyTheme(t||"light"); // default: light
  } catch { applyTheme("light"); }
}

/* ── Star Canvas ── */
function initStars() {
  const canvas=document.getElementById("starCanvas");
  const ctx=canvas.getContext("2d");
  let stars=[], W, H, frame=0;
  function resize() { W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight; }
  function spawn() {
    stars=[];
    for (let i=0;i<Math.floor(W*H/5500);i++) stars.push({
      x:Math.random()*W, y:Math.random()*H,
      r:Math.random()*1.1+0.2, o:Math.random()*.7+.1,
      sp:Math.random()*.14+.03, tp:Math.random()*.02+.004, ph:Math.random()*Math.PI*2
    });
  }
  function draw() {
    ctx.clearRect(0,0,W,H); frame++;
    stars.forEach(s=>{
      const a=s.o*(.55+.45*Math.sin(frame*s.tp+s.ph));
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(180,200,255,${a})`; ctx.fill();
      s.y-=s.sp; if (s.y<-2) {s.y=H+2; s.x=Math.random()*W;}
    });
    requestAnimationFrame(draw);
  }
  resize(); spawn(); draw();
  window.addEventListener("resize",()=>{resize();spawn();});
}

/* ── Render All ── */
function renderAll() {
  // Reset all animated stat cards to 0 so animNum plays the 0→value animation
  ["semDisplay","totalCrDisplay","semCountDisplay",
   "d_cgpa","d_totalCr","d_totalCourses","d_semCount","d_avgCr"].forEach(resetAnimEl);
  renderTabs(); renderCourses(); updateStats(); renderDashboard();
}

/* ── Init ── */
function init() {
  loadTheme();
  if (!loadStore()) {
    sems=[]; activeId=null;
    updateGlobalHeader(0,false,0); // show empty state in header
  } else {
    renderAll();
  }
  initStars();
}

// Called when nav hits Semesters view — open modal if empty
function ensureSemester() {
  if (!sems.length) openAddSemModal();
}

document.addEventListener("DOMContentLoaded", init);
