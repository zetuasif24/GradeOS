import { useEffect, useRef } from 'react'

export default function StarCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let stars = [], W, H, frame = 0
    let animId

    function resize() {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
    }

    function spawn() {
      stars = []
      for (let i = 0; i < Math.floor(W * H / 5500); i++) {
        stars.push({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 1.1 + 0.2,
          o: Math.random() * 0.7 + 0.1,
          sp: Math.random() * 0.14 + 0.03,
          tp: Math.random() * 0.02 + 0.004,
          ph: Math.random() * Math.PI * 2,
        })
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)
      frame++
      stars.forEach(s => {
        const a = s.o * (0.55 + 0.45 * Math.sin(frame * s.tp + s.ph))
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(180,200,255,${a})`
        ctx.fill()
        s.y -= s.sp
        if (s.y < -2) { s.y = H + 2; s.x = Math.random() * W }
      })
      animId = requestAnimationFrame(draw)
    }

    resize(); spawn(); draw()
    window.addEventListener('resize', () => { resize(); spawn() })
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} id="starCanvas" />
}
