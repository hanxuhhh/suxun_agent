import React, { useEffect, useRef } from 'react'

const PulseSphere: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 320
    canvas.height = 320

    const cx = 160, cy = 160, R = 90
    const dots: { angle: number; radius: number; speed: number; size: number; opacity: number }[] = []
    for (let i = 0; i < 60; i++) {
      dots.push({
        angle: Math.random() * Math.PI * 2,
        radius: R + (Math.random() - 0.5) * 30,
        speed: (Math.random() - 0.5) * 0.008,
        size: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.7 + 0.3,
      })
    }

    const pulses: { r: number; alpha: number }[] = [
      { r: R, alpha: 0.5 },
      { r: R + 30, alpha: 0.3 },
      { r: R + 60, alpha: 0.15 },
    ]

    let frame = 0
    let animId: number

    const draw = () => {
      ctx.clearRect(0, 0, 320, 320)

      // Outer pulse rings
      pulses.forEach((p) => {
        p.r += 0.4
        p.alpha -= 0.005
        if (p.r > R + 90 || p.alpha <= 0) {
          p.r = R
          p.alpha = 0.5
        }
        ctx.beginPath()
        ctx.arc(cx, cy, p.r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(139,92,246,${p.alpha})`
        ctx.lineWidth = 1.5
        ctx.stroke()
      })

      // Core glow
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R)
      grad.addColorStop(0, 'rgba(167,139,250,0.9)')
      grad.addColorStop(0.5, 'rgba(109,40,217,0.6)')
      grad.addColorStop(1, 'rgba(79,22,234,0.15)')
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()

      // Orbiting dots
      dots.forEach((d) => {
        d.angle += d.speed
        const x = cx + d.radius * Math.cos(d.angle)
        const y = cy + d.radius * Math.sin(d.angle)
        ctx.beginPath()
        ctx.arc(x, y, d.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(196,181,253,${d.opacity})`
        ctx.fill()
      })

      // Scan line
      const scanAngle = (frame * 0.02) % (Math.PI * 2)
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(scanAngle)
      const lg = ctx.createLinearGradient(0, 0, R, 0)
      lg.addColorStop(0, 'rgba(167,139,250,0.5)')
      lg.addColorStop(1, 'rgba(167,139,250,0)')
      ctx.fillStyle = lg
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, R, -0.3, 0.3)
      ctx.closePath()
      ctx.fill()
      ctx.restore()

      frame++
      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="w-64 h-64 md:w-80 md:h-80"
      style={{ filter: 'drop-shadow(0 0 24px rgba(139,92,246,0.6))' }}
    />
  )
}

export default PulseSphere
