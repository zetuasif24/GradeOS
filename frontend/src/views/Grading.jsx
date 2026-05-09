const GRADES = [
  { cls: 'g-ap', grade: 'A+', pts: '4.00', range: '80–100%', rem: 'Outstanding' },
  { cls: 'g-a',  grade: 'A',  pts: '3.75', range: '75–79%',  rem: 'Excellent' },
  { cls: 'g-am', grade: 'A−', pts: '3.50', range: '70–74%',  rem: 'Very Good' },
  { cls: 'g-bp', grade: 'B+', pts: '3.25', range: '65–69%',  rem: 'Good' },
  { cls: 'g-b',  grade: 'B',  pts: '3.00', range: '60–64%',  rem: 'Satisfactory' },
  { cls: 'g-bm', grade: 'B−', pts: '2.75', range: '55–59%',  rem: 'Above Average' },
  { cls: 'g-cp', grade: 'C+', pts: '2.50', range: '50–54%',  rem: 'Average' },
  { cls: 'g-c',  grade: 'C',  pts: '2.25', range: '45–49%',  rem: 'Below Average' },
  { cls: 'g-d',  grade: 'D',  pts: '2.00', range: '40–44%',  rem: 'Pass' },
  { cls: 'g-f',  grade: 'F',  pts: '0.00', range: '00–39%',  rem: 'Fail' },
]

export default function Grading() {
  return (
    <>
      <div className="vhead">
        <h2 className="vtitle">UGC Grading System</h2>
        <p className="vsub">Official Bangladesh UGC uniform grading scale</p>
      </div>
      <div className="grading-cards">
        {GRADES.map(({ cls, grade, pts, range, rem }) => (
          <div key={grade} className={`gcard ${cls}`}>
            <div className="gc-bar" />
            <span className="gc-grade">{grade}</span>
            <span className="gc-pts">{pts}</span>
            <span className="gc-range">{range}</span>
            <span className="gc-rem">{rem}</span>
          </div>
        ))}
      </div>
    </>
  )
}
