import { GP, SEASON_ORDER } from './constants'

export const gpOfGrade = (g) => GP[g] ?? 0
export const weightedPoints = (grade, credit) => gpOfGrade(grade) * (parseFloat(credit) || 0)

export function calcCg(courses) {
  let cr = 0, p = 0
  courses.forEach(c => {
    const x = parseFloat(c.credit) || 0
    cr += x
    p += weightedPoints(c.grade, x)
  })
  return cr ? p / cr : 0
}

/** CGPA using only completed semesters — the official cumulative GPA. */
export function calcOfficialCgpa(sems) {
  let totalCr = 0, totalWPts = 0
  sems.filter(s => s.status === 'completed').forEach(s =>
    s.courses.forEach(c => {
      const x = parseFloat(c.credit) || 0
      totalCr  += x
      totalWPts += weightedPoints(c.grade, x)
    })
  )
  return { cgpa: totalCr ? totalWPts / totalCr : 0, totalCr, totalWPts }
}

/** CGPA using ALL semesters (in-progress included) — the estimated value. */
export function calcEstimatedCgpa(sems) {
  let totalCr = 0, totalWPts = 0
  sems.forEach(s =>
    s.courses.forEach(c => {
      const x = parseFloat(c.credit) || 0
      totalCr  += x
      totalWPts += weightedPoints(c.grade, x)
    })
  )
  return { cgpa: totalCr ? totalWPts / totalCr : 0, totalCr, totalWPts }
}

export function ugcStatus(cg, has) {
  if (!has) return { label: 'No Data', cls: 'chip-none' }
  if (cg >= 4.00) return { label: 'Outstanding', cls: 'chip-outstanding' }
  if (cg >= 3.75) return { label: 'Excellent', cls: 'chip-excellent' }
  if (cg >= 3.50) return { label: 'Very Good', cls: 'chip-verygood' }
  if (cg >= 3.25) return { label: 'Good', cls: 'chip-good' }
  if (cg >= 3.00) return { label: 'Satisfactory', cls: 'chip-satisfact' }
  if (cg >= 2.75) return { label: 'Above Average', cls: 'chip-aboveavg' }
  if (cg >= 2.50) return { label: 'Average', cls: 'chip-average' }
  if (cg >= 2.25) return { label: 'Below Average', cls: 'chip-belowavg' }
  if (cg >= 2.00) return { label: 'Pass', cls: 'chip-pass' }
  return { label: 'Fail', cls: 'chip-fail' }
}

export const escH = (s) =>
  String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function sortSems(sems) {
  return [...sems].sort((a, b) => {
    const [at, ...ay] = a.name.split(' ')
    const [bt, ...by] = b.name.split(' ')
    const ayear = parseInt(ay.join(' ')) || 0
    const byear = parseInt(by.join(' ')) || 0
    if (ayear !== byear) return ayear - byear
    return (SEASON_ORDER[at] ?? 99) - (SEASON_ORDER[bt] ?? 99)
  })
}

export function nextMilestoneText(cgpa, hasData) {
  if (!hasData) return { short: 'Add courses to begin' }
  if (cgpa >= 4.00) return { short: '🏅 Dean\'s List — Peak!' }
  const milestones = [
    { min: 4.00, short: '4.00 Outstanding' },
    { min: 3.75, short: '3.75 Excellent' },
    { min: 3.50, short: '3.50 Very Good' },
    { min: 3.25, short: '3.25 Good' },
    { min: 3.00, short: '3.00 Satisfactory' },
    { min: 2.75, short: '2.75 Above Avg' },
    { min: 2.50, short: '2.50 Average' },
  ]
  const next = milestones.find(m => cgpa < m.min)
  if (!next) return { short: 'Keep improving!' }
  const gap = (next.min - cgpa).toFixed(2)
  return { short: `${next.short} (+${gap})`, gap: parseFloat(gap), target: next.min }
}

let _uid = Date.now()
export const uid = () => (++_uid).toString(36)
