import { CONFETTI_COLORS, CONFETTI_TEXT } from './constants'

export type ConfettiShape = 'star' | 'egg' | 'text'

export type ConfettiParticle = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotation: number
  rotationVelocity: number
  life: number
  maxLife: number
  color: string
  shape: ConfettiShape
  text?: string
}

export type ConfettiOrigin = {
  x: number
  y: number
}

let particleId = 0

const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min)

const pickRandom = <T,>(items: T[]) =>
  items[Math.floor(Math.random() * items.length)]

export const createConfettiBurst = (
  width: number,
  height: number,
  origin?: ConfettiOrigin,
): ConfettiParticle[] => {
  const originX = origin?.x ?? width / 2
  const originY = origin?.y ?? height * 0.28
  const textCount = 8
  const starCount = 60
  const eggCount = 44

  const createParticle = (shape: ConfettiShape): ConfettiParticle => {
    const angle = randomBetween(-Math.PI * 0.92, -Math.PI * 0.08)
    const speed =
      shape === 'text' ? randomBetween(5.8, 8.6) : randomBetween(4.8, 11.2)
    const size =
      shape === 'text'
        ? randomBetween(18, 26)
        : shape === 'egg'
          ? randomBetween(10, 16)
          : randomBetween(8, 14)

    return {
      id: particleId += 1,
      x: originX + randomBetween(-110, 110),
      y: originY + randomBetween(-28, 20),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      rotation: randomBetween(0, Math.PI * 2),
      rotationVelocity: randomBetween(-0.14, 0.14),
      life: shape === 'text' ? 280 : 240,
      maxLife: shape === 'text' ? 280 : 240,
      color: pickRandom(CONFETTI_COLORS),
      shape,
      text: shape === 'text' ? CONFETTI_TEXT : undefined,
    }
  }

  return [
    ...Array.from({ length: starCount }, () => createParticle('star')),
    ...Array.from({ length: eggCount }, () => createParticle('egg')),
    ...Array.from({ length: textCount }, () => createParticle('text')),
  ]
}

export const updateConfettiParticle = (particle: ConfettiParticle) => ({
  ...particle,
  x: particle.x + particle.vx,
  y: particle.y + particle.vy,
  vx: particle.vx * 0.995,
  vy: particle.vy + 0.14,
  rotation: particle.rotation + particle.rotationVelocity,
  life: particle.life - 1,
})

export const drawStar = (ctx: CanvasRenderingContext2D, size: number) => {
  const spikes = 5
  const outerRadius = size / 2
  const innerRadius = outerRadius * 0.52

  ctx.beginPath()

  for (let index = 0; index < spikes * 2; index += 1) {
    const angle = (index * Math.PI) / spikes - Math.PI / 2
    const radius = index % 2 === 0 ? outerRadius : innerRadius
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius

    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }

  ctx.closePath()
  ctx.fill()
}

export const drawEgg = (ctx: CanvasRenderingContext2D, size: number) => {
  const width = size * 0.92
  const height = size * 1.24

  ctx.beginPath()
  ctx.moveTo(0, -height / 2)
  ctx.bezierCurveTo(width / 2, -height / 2, width / 2, 0, 0, height / 2)
  ctx.bezierCurveTo(-width / 2, 0, -width / 2, -height / 2, 0, -height / 2)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.fillRect(-width * 0.36, -height * 0.08, width * 0.72, height * 0.12)
  ctx.fillRect(-width * 0.24, height * 0.12, width * 0.48, height * 0.1)
}

export const drawText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  size: number,
) => {
  ctx.font = `700 ${size}px Georgia, "Times New Roman", serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 0, 0)
}
