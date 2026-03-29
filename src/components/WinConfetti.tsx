import { useEffect, useRef } from 'react'
import {
  createConfettiBurst,
  drawEgg,
  drawStar,
  drawText,
  updateConfettiParticle,
} from '../game/confetti'
import type { ConfettiOrigin, ConfettiParticle } from '../game/confetti'

type WinConfettiProps = {
  burstKey: number
  getOrigin?: () => ConfettiOrigin | undefined
}

const WinConfetti = ({ burstKey, getOrigin }: WinConfettiProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const particlesRef = useRef<ConfettiParticle[]>([])
  const animationRef = useRef<number | null>(null)
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 })

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current

      if (!canvas) {
        return
      }

      const width = window.innerWidth
      const height = window.innerHeight
      const dpr = window.devicePixelRatio || 1
      const context = canvas.getContext('2d')

      if (!context) {
        return
      }

      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      sizeRef.current = { width, height, dpr }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    const render = () => {
      const { width, height } = sizeRef.current
      context.clearRect(0, 0, width, height)

      particlesRef.current = particlesRef.current
        .map(updateConfettiParticle)
        .filter((particle) => particle.life > 0)

      for (const particle of particlesRef.current) {
        const opacity = Math.max(particle.life / particle.maxLife, 0)

        context.save()
        context.translate(particle.x, particle.y)
        context.rotate(particle.rotation)
        context.globalAlpha = opacity
        context.fillStyle = particle.color

        if (particle.shape === 'star') {
          drawStar(context, particle.size)
        }

        if (particle.shape === 'egg') {
          drawEgg(context, particle.size)
        }

        if (particle.shape === 'text' && particle.text) {
          drawText(context, particle.text, particle.size)
        }

        context.restore()
      }

      animationRef.current = window.requestAnimationFrame(render)
    }

    animationRef.current = window.requestAnimationFrame(render)

    return () => {
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (burstKey === 0) {
      return
    }

    const { width, height } = sizeRef.current
    particlesRef.current.push(
      ...createConfettiBurst(width, height, getOrigin?.()),
    )
  }, [burstKey, getOrigin])

  return <canvas ref={canvasRef} className='win-confetti' aria-hidden='true' />
}

export default WinConfetti
