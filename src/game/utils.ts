import {
  BOARD_PADDING,
  CARD_HEIGHT,
  CARD_WIDTH,
  CHASE_TRIGGER_RADIUS,
  CURSOR_THREAT_RADIUS,
  SYMBOLS,
} from './constants'
import { getRandomEscapeEffect, getRandomFleeDuration } from './effects'
import type { CardState, EscapeEffect, Position } from './types'

type Bounds = {
  width: number
  height: number
}

type Cursor = {
  x: number
  y: number
  active: boolean
}

type VelocityMap = Record<number, Position>

type CardDistanceState = {
  centerX: number
  centerY: number
  dx: number
  dy: number
  distance: number
}

type CardMotionState = {
  card: CardState
  velocityX: number
  velocityY: number
}

type BounceResult = {
  position: Position
  velocity: Position
}

export const shuffle = <T,>(items: T[]) => {
  const next = [...items]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  }

  return next
}

export const createDeck = (): CardState[] =>
  shuffle(
    SYMBOLS.flatMap((symbol, pairId) => [
      {
        id: pairId * 2,
        pairId,
        icon: symbol.icon,
        title: symbol.title,
        accent: symbol.accent,
        shellPattern: symbol.shellPattern,
      },
      {
        id: pairId * 2 + 1,
        pairId,
        icon: symbol.icon,
        title: symbol.title,
        accent: symbol.accent,
        shellPattern: symbol.shellPattern,
      },
    ]),
  ).map((card) => ({
    ...card,
    matched: false,
    revealed: false,
    prankText: null,
    sleeping: true,
    fleeingUntil: null,
    fleeingDurationMs: getRandomFleeDuration(),
    hopUntil: null,
    effect: 'none',
    homePosition: { x: 0, y: 0 },
    position: { x: 0, y: 0 },
  }))

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

export const getCardDistanceState = (
  card: CardState,
  cursor: Cursor,
): CardDistanceState => {
  const centerX = card.position.x + CARD_WIDTH / 2
  const centerY = card.position.y + CARD_HEIGHT / 2
  const dx = centerX - cursor.x
  const dy = centerY - cursor.y

  return {
    centerX,
    centerY,
    dx,
    dy,
    distance: Math.max(Math.hypot(dx, dy), 1),
  }
}

export const shouldStartChase = (
  card: CardState,
  cursor: Cursor,
  distance: number,
) =>
  cursor.active &&
  !card.matched &&
  !card.revealed &&
  !card.sleeping &&
  card.fleeingUntil === null &&
  distance < CHASE_TRIGGER_RADIUS

export const startChase = (
  card: CardState,
  now: number,
  dx: number,
  dy: number,
  distance: number,
  bounds: Bounds,
  velocityMap: VelocityMap,
) => {
  const nextDuration = getRandomFleeDuration()
  const effect = getRandomEscapeEffect(card.effect)
  const directionX =
    Math.abs(dx / distance) > 0.12 ? dx / distance : dx >= 0 ? 1 : -1

  if (effect === 'bounce') {
    velocityMap[card.id] = {
      x: directionX * 14,
      y: -26,
    }
  }

  return {
    ...card,
    fleeingDurationMs: nextDuration,
    fleeingUntil: now + nextDuration,
    hopUntil: effect === 'hop' ? now + 360 : null,
    effect,
    position:
      effect === 'hop' ? getHopPosition(card.position, dx, dy, bounds) : card.position,
  }
}

export const startMobileRoam = (
  card: CardState,
  now: number,
  bounds: Bounds,
  velocityMap: VelocityMap,
) => {
  const nextDuration = getRandomFleeDuration()
  const effectRoll = Math.random()
  const effect: EscapeEffect =
    effectRoll > 0.72 ? 'hop' : effectRoll > 0.18 ? 'dodge' : 'small'
  const directionX =
    (Math.random() > 0.5 ? 1 : -1) * (card.id % 2 === 0 ? 1 : -1)
  const directionY = Math.random() > 0.5 ? 1 : -1

  if (effect === 'hop') {
    velocityMap[card.id] = {
      x: directionX * 2.8,
      y: directionY * 1.2,
    }
  } else if (effect === 'dodge') {
    velocityMap[card.id] = {
      x: directionX * 2.6,
      y: (Math.random() - 0.5) * 1.6,
    }
  } else {
    velocityMap[card.id] = { x: 0, y: 0 }
  }

  return {
    ...card,
    sleeping: false,
    fleeingDurationMs: nextDuration,
    fleeingUntil: now + nextDuration,
    hopUntil: effect === 'hop' ? now + 360 : null,
    effect,
    position:
      effect === 'hop'
        ? getHopPosition(
            card.position,
            directionX * -180,
            directionY * -120,
            bounds,
          )
        : getImpulsePosition(
            card.position,
            { x: directionX * 16, y: directionY * 8 },
            bounds,
          ),
  }
}

export const shouldRelaxCard = (
  card: CardState,
  cursor: Cursor,
  distance: number,
) =>
  card.fleeingUntil !== null &&
  (!cursor.active || distance > CURSOR_THREAT_RADIUS * 1.2)

export const getCardMotionState = ({
  card,
  cursor,
  distance,
  dx,
  dy,
  phase,
  velocity,
  queuedImpulse,
  now,
}: {
  card: CardState
  cursor: Cursor
  distance: number
  dx: number
  dy: number
  phase: number
  velocity: Position
  queuedImpulse: Position
  now: number
}): CardMotionState => {
  const isFleeing = card.fleeingUntil !== null && now < card.fleeingUntil
  const isMovingEffect = card.effect === 'dodge'
  const isBounceEffect = card.effect === 'bounce'

  let velocityX = velocity.x * 0.9 + queuedImpulse.x
  let velocityY = velocity.y * 0.9 + queuedImpulse.y

  if (isFleeing && cursor.active) {
    if (isMovingEffect && distance < CURSOR_THREAT_RADIUS) {
      const force =
        ((CURSOR_THREAT_RADIUS - distance) / CURSOR_THREAT_RADIUS) * 1.8
      velocityX += (dx / distance) * force
      velocityY += (dy / distance) * force
    }

    if (isMovingEffect) {
      velocityX += Math.cos(phase) * 0.18
      velocityY += Math.sin(phase) * 0.18
    } else if (isBounceEffect) {
      velocityY += 1.35
    } else {
      velocityX = 0
      velocityY = 0
    }
  } else {
    velocityX *= 0.6
    velocityY *= 0.6
  }

  return {
    card,
    velocityX,
    velocityY,
  }
}

export const getHopPosition = (
  position: Position,
  dx: number,
  dy: number,
  bounds: { width: number; height: number },
) => {
  const distance = Math.max(Math.hypot(dx, dy), 1)
  const hopDistance = 400

  return {
    x: clamp(
      position.x + (dx / distance) * hopDistance,
      BOARD_PADDING,
      bounds.width - CARD_WIDTH - BOARD_PADDING,
    ),
    y: clamp(
      position.y + (dy / distance) * hopDistance,
      BOARD_PADDING,
      bounds.height - CARD_HEIGHT - BOARD_PADDING,
    ),
  }
}

export const getImpulsePosition = (
  position: Position,
  velocity: Position,
  bounds: Bounds,
) => ({
  x: clamp(
    position.x + velocity.x,
    BOARD_PADDING,
    bounds.width - CARD_WIDTH - BOARD_PADDING,
  ),
  y: clamp(
    position.y + velocity.y,
    BOARD_PADDING,
    bounds.height - CARD_HEIGHT - BOARD_PADDING,
  ),
})

export const getSeparationImpulse = (
  cardId: number,
  position: Position,
  current: CardState[],
  bounds: Bounds,
) => {
  let pushX = 0
  let pushY = 0
  const centerX = position.x + CARD_WIDTH / 2
  const centerY = position.y + CARD_HEIGHT / 2
  const leftEdge = position.x - BOARD_PADDING
  const rightEdge = bounds.width - BOARD_PADDING - (position.x + CARD_WIDTH)
  const topEdge = position.y - BOARD_PADDING
  const bottomEdge = bounds.height - BOARD_PADDING - (position.y + CARD_HEIGHT)
  const cornerThreshold = 36

  if (leftEdge < cornerThreshold && topEdge < cornerThreshold) {
    pushX += 1.8
    pushY += 1.8
  }
  if (rightEdge < cornerThreshold && topEdge < cornerThreshold) {
    pushX -= 1.8
    pushY += 1.8
  }
  if (leftEdge < cornerThreshold && bottomEdge < cornerThreshold) {
    pushX += 1.8
    pushY -= 1.8
  }
  if (rightEdge < cornerThreshold && bottomEdge < cornerThreshold) {
    pushX -= 1.8
    pushY -= 1.8
  }

  for (const other of current) {
    if (other.id === cardId || other.matched || other.revealed) {
      continue
    }

    const otherCenterX = other.position.x + CARD_WIDTH / 2
    const otherCenterY = other.position.y + CARD_HEIGHT / 2
    const dx = centerX - otherCenterX
    const dy = centerY - otherCenterY
    const distance = Math.max(Math.hypot(dx, dy), 0.001)
    const minimumDistance = CARD_WIDTH * 0.72

    if (distance >= minimumDistance) {
      continue
    }

    const overlap = (minimumDistance - distance) / minimumDistance
    pushX += (dx / distance) * overlap * 2.8
    pushY += (dy / distance) * overlap * 2.8
  }

  return { x: pushX, y: pushY }
}

export const getBoardColumns = (width: number) => (width < 700 ? 2 : 4)

export const shouldTriggerPrank = () => Math.random() < 0.22

export const shouldTriggerMobilePanic = () => Math.random() < 0.26

export const getMobilePanicPosition = (
  card: CardState,
  bounds: Bounds,
  cursorX?: number,
) => {
  const leftTarget = BOARD_PADDING
  const rightTarget = bounds.width - CARD_WIDTH - BOARD_PADDING
  const topTarget = BOARD_PADDING
  const bottomTarget = bounds.height - CARD_HEIGHT - BOARD_PADDING
  const currentCenterX = card.position.x + CARD_WIDTH / 2
  const shouldFlyOppositeSide =
    cursorX !== undefined ? currentCenterX < cursorX : Math.random() > 0.5

  if (Math.random() > 0.5) {
    return {
      x: shouldFlyOppositeSide ? rightTarget : leftTarget,
      y: topTarget,
    }
  }

  return {
    x: card.position.x < bounds.width / 2 ? rightTarget : leftTarget,
    y: bottomTarget,
  }
}

export const applyCardSeparation = (
  card: CardState,
  position: Position,
  velocity: Position,
  current: CardState[],
  bounds: Bounds,
) => {
  if (card.matched || card.revealed) {
    return { position, velocity }
  }

  const separation = getSeparationImpulse(card.id, position, current, bounds)
  const nextVelocity = {
    x: velocity.x + separation.x,
    y: velocity.y + separation.y,
  }

  return {
    velocity: nextVelocity,
    position: {
      x: clamp(
        position.x + separation.x,
        BOARD_PADDING,
        bounds.width - CARD_WIDTH - BOARD_PADDING,
      ),
      y: clamp(
        position.y + separation.y,
        BOARD_PADDING,
        bounds.height - CARD_HEIGHT - BOARD_PADDING,
      ),
    },
  }
}

export const applyBounceCollisions = (
  card: CardState,
  position: Position,
  velocity: Position,
  current: CardState[],
  bounds: Bounds,
  velocityImpulses: VelocityMap,
): BounceResult => {
  let nextPosition = position
  let nextVelocity = { ...velocity }

  if (nextPosition.y === BOARD_PADDING || nextPosition.y === bounds.height - CARD_HEIGHT - BOARD_PADDING) {
    nextVelocity.y *= -0.9
  }

  if (nextPosition.x === BOARD_PADDING || nextPosition.x === bounds.width - CARD_WIDTH - BOARD_PADDING) {
    nextVelocity.x *= -0.9
  }

  for (const other of current) {
    if (other.id === card.id || other.revealed || other.matched) {
      continue
    }

    const otherCenterX = other.position.x + CARD_WIDTH / 2
    const otherCenterY = other.position.y + CARD_HEIGHT / 2
    const nextCenterX = nextPosition.x + CARD_WIDTH / 2
    const nextCenterY = nextPosition.y + CARD_HEIGHT / 2
    const collisionDx = otherCenterX - nextCenterX
    const collisionDy = otherCenterY - nextCenterY
    const collisionDistance = Math.hypot(collisionDx, collisionDy)
    const collisionRadius = CARD_WIDTH * 0.7

    if (collisionDistance === 0 || collisionDistance > collisionRadius) {
      continue
    }

    const normalX = collisionDx / collisionDistance
    const normalY = collisionDy / collisionDistance
    const push = ((collisionRadius - collisionDistance) / collisionRadius) * 7.5

    velocityImpulses[other.id] = {
      x: (velocityImpulses[other.id]?.x ?? 0) + normalX * push,
      y: (velocityImpulses[other.id]?.y ?? 0) + normalY * push,
    }

    nextVelocity = {
      x: nextVelocity.x - normalX * 3.2,
      y: nextVelocity.y - normalY * 3.2,
    }

    nextPosition = getImpulsePosition(
      nextPosition,
      { x: -normalX * 6, y: -normalY * 6 },
      bounds,
    )
  }

  return {
    position: nextPosition,
    velocity: nextVelocity,
  }
}

export const getStoredVelocity = (
  position: Position,
  velocity: Position,
  bounds: Bounds,
) => ({
  x:
    position.x === BOARD_PADDING ||
    position.x === bounds.width - CARD_WIDTH - BOARD_PADDING
      ? velocity.x * -0.4
      : velocity.x,
  y:
    position.y === BOARD_PADDING ||
    position.y === bounds.height - CARD_HEIGHT - BOARD_PADDING
      ? velocity.y * -0.4
      : velocity.y,
})
