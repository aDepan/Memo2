import { useEffect, useRef, useState } from 'react'
import IntroPanel from './components/IntroPanel'
import MemoCard from './components/MemoCard'
import WinConfetti from './components/WinConfetti'
import './App.css'
import {
  BOARD_PADDING,
  CARD_HEIGHT,
  CARD_WIDTH,
  PAIR_COUNT_OPTIONS,
  PRANK_MESSAGES,
} from './game/constants'
import { getRandomFleeDuration } from './game/effects'
import {
  applyBounceCollisions,
  applyCardSeparation,
  clamp,
  createDeck,
  getBoardColumns,
  getCardDistanceState,
  getMobilePanicPosition,
  getCardMotionState,
  getStoredVelocity,
  shouldTriggerMobilePanic,
  shouldRelaxCard,
  shouldStartChase,
  startMobileRoam,
  startChase,
} from './game/utils'
import type { CardState, Position } from './game/types'
import type { PairCountOption } from './game/constants'

type Cursor = {
  x: number
  y: number
  active: boolean
}

type Bounds = {
  width: number
  height: number
}

const App = () => {
  const boardRef = useRef<HTMLDivElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const cursorRef = useRef<Cursor>({ x: 0, y: 0, active: false })
  const velocityRef = useRef<Record<number, Position>>({})
  const phaseRef = useRef<Record<number, number>>({})
  const boardBoundsRef = useRef({ width: 880, height: 600 })
  const revealedIdsRef = useRef<number[]>([])
  const lastPrankStepShownRef = useRef(0)

  const defaultPairCount = PAIR_COUNT_OPTIONS[0]
  const [pairCount, setPairCount] = useState<PairCountOption>(defaultPairCount)
  const [cards, setCards] = useState<CardState[]>(() => createDeck(defaultPairCount))
  const [boardAwake, setBoardAwake] = useState(false)
  const [locked, setLocked] = useState(false)
  const [turns, setTurns] = useState(0)
  const [steps, setSteps] = useState(0)
  const [topCardId, setTopCardId] = useState<number | null>(null)
  const [winPulse, setWinPulse] = useState(0)
  const [confettiBurst, setConfettiBurst] = useState(0)
  const [nowTick, setNowTick] = useState(() => performance.now())
  const [deckVersion, setDeckVersion] = useState(0)
  const [prankCount, setPrankCount] = useState(0)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [isCompactBoard, setIsCompactBoard] = useState(false)
  const [cardScale, setCardScale] = useState(1)

  const getRandomPrankStepGap = () => 5 + Math.floor(Math.random() * 6)

  const [nextPrankStep, setNextPrankStep] = useState(() => getRandomPrankStepGap())

  const matchedCount = cards.filter((card) => card.matched).length
  const allMatched = matchedCount === cards.length

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: coarse)')
    const syncTouchMode = () => {
      setIsTouchDevice(mediaQuery.matches)
    }

    syncTouchMode()
    mediaQuery.addEventListener('change', syncTouchMode)

    return () => mediaQuery.removeEventListener('change', syncTouchMode)
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 640px)')
    const syncCompactBoard = () => {
      setIsCompactBoard(mediaQuery.matches)
    }

    syncCompactBoard()
    mediaQuery.addEventListener('change', syncCompactBoard)

    return () => mediaQuery.removeEventListener('change', syncCompactBoard)
  }, [])

  useEffect(() => {
    const syncCardScale = () => {
      const width = window.innerWidth

      if (width < 420) {
        setCardScale(0.56)
        return
      }

      if (width < 640) {
        setCardScale(0.64)
        return
      }

      setCardScale(1)
    }

    syncCardScale()
    window.addEventListener('resize', syncCardScale)

    return () => window.removeEventListener('resize', syncCardScale)
  }, [])

  const isPrankEligible = (card: CardState, nextStep: number) =>
    nextStep >= nextPrankStep &&
    !card.prankText &&
    !card.matched &&
    !card.revealed

  const getBoardBounds = (): Bounds => boardBoundsRef.current

  const getLayoutCardSize = () => {
    return {
      width: CARD_WIDTH * cardScale,
      height: CARD_HEIGHT * cardScale,
    }
  }

  const getConfettiOrigin = () => {
    const rect = boardRef.current?.getBoundingClientRect()

    if (!rect) {
      return undefined
    }

    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
  }

  const clearCardMotion = (cardId: number) => {
    velocityRef.current[cardId] = { x: 0, y: 0 }
  }

  const getCardPhase = (cardId: number, index: number) => {
    if (phaseRef.current[cardId] === undefined) {
      phaseRef.current[cardId] = Math.random() * Math.PI * 2
    }

    const phase = phaseRef.current[cardId] + 0.02 + index * 0.003
    phaseRef.current[cardId] = phase
    return phase
  }

  const ensureCardVelocity = (cardId: number) => {
    if (!velocityRef.current[cardId]) {
      velocityRef.current[cardId] = { x: 0, y: 0 }
    }

    return velocityRef.current[cardId]
  }

  const getNextPosition = (
    card: CardState,
    velocity: Position,
    bounds: Bounds,
  ) => ({
    x: clamp(
      card.position.x + velocity.x,
      BOARD_PADDING,
      bounds.width - CARD_WIDTH - BOARD_PADDING,
    ),
    y: clamp(
      card.position.y + velocity.y,
      BOARD_PADDING,
      bounds.height - CARD_HEIGHT - BOARD_PADDING,
    ),
  })

  const getUpdatedCardFrame = ({
    card,
    index,
    current,
    now,
    bounds,
    cursor,
    velocityImpulses,
  }: {
    card: CardState
    index: number
    current: CardState[]
    now: number
    bounds: Bounds
    cursor: Cursor
    velocityImpulses: Record<number, Position>
  }) => {
    const queuedImpulse = velocityImpulses[card.id] ?? { x: 0, y: 0 }
    const velocity = ensureCardVelocity(card.id)
    const phase = getCardPhase(card.id, index)
    const distanceState = getCardDistanceState(card, cursor)

    let nextCard = card

    if (shouldStartChase(card, cursor, distanceState.distance)) {
      nextCard = startChase(
        card,
        now,
        distanceState.dx,
        distanceState.dy,
        distanceState.distance,
        bounds,
        velocityRef.current,
      )
    } else if (
      isTouchDevice &&
      !card.matched &&
      !card.revealed &&
      !card.sleeping &&
      card.fleeingUntil === null
    ) {
      nextCard = startMobileRoam(card, now, bounds, velocityRef.current)
    }

    const shouldRelax =
      isTouchDevice && !cursor.active && nextCard.effect !== 'none'
        ? false
        : shouldRelaxCard(nextCard, cursor, distanceState.distance)

    if (shouldRelax) {
      clearCardMotion(card.id)

      return {
        ...nextCard,
        fleeingUntil: null,
        hopUntil: null,
        effect: 'none' as const,
      }
    }

    const motionState = getCardMotionState({
      card: nextCard,
      cursor,
      distance: distanceState.distance,
      dx: distanceState.dx,
      dy: distanceState.dy,
      phase,
      velocity,
      queuedImpulse,
      now,
    })

    let nextPosition = getNextPosition(
      nextCard,
      { x: motionState.velocityX, y: motionState.velocityY },
      bounds,
    )

    const separatedState = applyCardSeparation(
      nextCard,
      nextPosition,
      { x: motionState.velocityX, y: motionState.velocityY },
      current,
      bounds,
    )

    nextPosition = separatedState.position

    let nextVelocity = separatedState.velocity

    if (nextCard.effect === 'bounce') {
      const bouncedState = applyBounceCollisions(
        nextCard,
        nextPosition,
        nextVelocity,
        current,
        bounds,
        velocityImpulses,
      )

      nextPosition = bouncedState.position
      nextVelocity = bouncedState.velocity
    }

    velocityRef.current[card.id] = getStoredVelocity(
      nextPosition,
      nextVelocity,
      bounds,
    )

    const isFleeing = nextCard.fleeingUntil !== null && now < nextCard.fleeingUntil
    const chaseExpired = nextCard.fleeingUntil !== null && now >= nextCard.fleeingUntil

    if (
      !isFleeing &&
      !chaseExpired &&
      Math.abs(nextVelocity.x) < 0.05 &&
      Math.abs(nextVelocity.y) < 0.05 &&
      nextCard === card
    ) {
      return card
    }

    return {
      ...nextCard,
      fleeingUntil: chaseExpired ? null : nextCard.fleeingUntil,
      hopUntil:
        nextCard.hopUntil !== null && now >= nextCard.hopUntil
          ? null
          : nextCard.hopUntil,
      effect: chaseExpired ? 'none' : nextCard.effect,
      position: nextPosition,
    }
  }

  useEffect(() => {
    revealedIdsRef.current = cards
      .filter((card) => card.revealed && !card.matched)
      .map((card) => card.id)
  }, [cards])

  useEffect(() => {
    const updateLayout = () => {
      const board = boardRef.current

      if (!board) {
        return
      }

      const width = board.clientWidth
      const height = board.clientHeight
      boardBoundsRef.current = { width, height }
      const layoutCardSize = getLayoutCardSize()

      const columns = getBoardColumns(width, cards.length)
      const rows = Math.ceil(cards.length / columns)
      const usableWidth = width - BOARD_PADDING * 2 - layoutCardSize.width
      const usableHeight = height - BOARD_PADDING * 2 - layoutCardSize.height
      const gapX = columns > 1 ? usableWidth / (columns - 1) : 0
      const gapY = rows > 1 ? usableHeight / (rows - 1) : 0

      setCards((current) =>
        current.map((card, index) => {
          const column = index % columns
          const row = Math.floor(index / columns)
          const slotX = BOARD_PADDING + column * gapX
          const slotY = BOARD_PADDING + row * gapY
          const x = slotX + (layoutCardSize.width - CARD_WIDTH) / 2
          const y = slotY + (layoutCardSize.height - CARD_HEIGHT) / 2
          const isUnset = card.position.x === 0 && card.position.y === 0

          return {
            ...card,
            homePosition: { x, y },
            position: isUnset ? { x, y } : card.position,
          }
        }),
      )
    }

    updateLayout()

    const observer = new ResizeObserver(updateLayout)

    if (boardRef.current) {
      observer.observe(boardRef.current)
    }

    return () => observer.disconnect()
  }, [cards.length, deckVersion, isCompactBoard])

  useEffect(() => {
    if (!boardAwake || allMatched) {
      return
    }

    const tick = () => {
      const now = performance.now()
      const bounds = getBoardBounds()
      const cursor = cursorRef.current
      const velocityImpulses: Record<number, Position> = {}
      setNowTick(now)

      setCards((current) =>
        current.map((card, index) =>
          getUpdatedCardFrame({
            card,
            index,
            current,
            now,
            bounds,
            cursor,
            velocityImpulses,
          }),
        ),
      )

      animationRef.current = window.requestAnimationFrame(tick)
    }

    animationRef.current = window.requestAnimationFrame(tick)

    return () => {
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current)
      }
    }
  }, [allMatched, boardAwake, isTouchDevice])

  useEffect(() => {
    if (!allMatched) {
      return
    }

    const burstFrame = window.requestAnimationFrame(() => {
      setConfettiBurst((value) => value + 1)
    })

    const timeout = window.setTimeout(() => {
      setWinPulse((value) => value + 1)
      setConfettiBurst((value) => value + 1)
    }, 450)

    return () => {
      window.cancelAnimationFrame(burstFrame)
      window.clearTimeout(timeout)
    }
  }, [allMatched])

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = boardRef.current?.getBoundingClientRect()

    if (!rect) {
      return
    }

    cursorRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      active: true,
    }
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = boardRef.current?.getBoundingClientRect()

    if (!rect) {
      return
    }

    cursorRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      active: true,
    }

    if (isTouchDevice && !boardAwake) {
      setBoardAwake(true)
      setCards((current) =>
        current.map((card) => ({
          ...card,
          sleeping: false,
        })),
      )
    }
  }

  const handlePointerUp = () => {
    cursorRef.current.active = false
  }

  const handlePointerLeave = () => {
    cursorRef.current.active = false
  }

  const handleCardClick = (cardId: number) => {
    if (locked) {
      return
    }

    const clicked = cards.find((card) => card.id === cardId)

    if (!clicked || clicked.revealed || clicked.matched) {
      return
    }

    if (!boardAwake) {
      setBoardAwake(true)
      if (isTouchDevice) {
        setCards((current) =>
          current.map((card) => ({
            ...card,
            sleeping: false,
          })),
        )
        return
      }
    }

    const currentlyRevealed = revealedIdsRef.current

    if (currentlyRevealed.length >= 2) {
      return
    }

    const nextRevealed = [...currentlyRevealed, cardId]
    const nextStep = steps + 1

    setTopCardId(cardId)
    setSteps(nextStep)

    if (
      isTouchDevice &&
      currentlyRevealed.length === 0 &&
      shouldTriggerMobilePanic()
    ) {
      clearCardMotion(cardId)
      setCards((current) =>
        current.map((card) =>
          card.id === cardId
            ? {
                ...card,
                sleeping: false,
                fleeingUntil: null,
                hopUntil: null,
                effect: 'none',
                position: getMobilePanicPosition(
                  card,
                  getBoardBounds(),
                  cursorRef.current.x,
                ),
              }
            : card,
        ),
      )

      return
    }

    if (isPrankEligible(clicked, nextStep)) {
      const prankText = PRANK_MESSAGES[prankCount % PRANK_MESSAGES.length]

      setLocked(true)
      lastPrankStepShownRef.current = nextStep
      setNextPrankStep(nextStep + getRandomPrankStepGap())
      setPrankCount((value) => value + 1)
      setCards((current) =>
        current.map((card) =>
          card.id === cardId
            ? {
                ...card,
                revealed: true,
                prankText,
                sleeping: false,
                fleeingUntil: null,
                hopUntil: null,
                effect: 'none',
              }
            : card,
        ),
      )

      window.setTimeout(() => {
        setCards((current) =>
          current.map((card) =>
            card.id === cardId
              ? {
                  ...card,
                  revealed: false,
                  prankText: null,
                  position: card.homePosition,
                }
              : card,
          ),
        )
        setTopCardId(null)
        setLocked(false)
      }, 1300)

      return
    }

    setCards((current) =>
      current.map((card) =>
        card.id === cardId
          ? {
              ...card,
              revealed: true,
              prankText: null,
              sleeping: false,
              fleeingUntil: null,
              hopUntil: null,
              effect: 'none',
            }
          : card,
      ),
    )

    if (nextRevealed.length !== 2) {
      return
    }

    setLocked(true)
    setTurns((value) => value + 1)

    const [firstId, secondId] = nextRevealed
    const first = cards.find((card) => card.id === firstId)
    const second = cards.find((card) => card.id === secondId)

    if (first && second && first.pairId === second.pairId) {
      window.setTimeout(() => {
        setCards((current) =>
          current.map((card) =>
            card.id === firstId || card.id === secondId
              ? {
                  ...card,
                  matched: true,
                  prankText: null,
                  fleeingUntil: null,
                  hopUntil: null,
                  effect: 'none',
                  position: card.homePosition,
                }
              : card,
          ),
        )
        setTopCardId(null)
        setLocked(false)
      }, 340)
      return
    }

    window.setTimeout(() => {
      setCards((current) =>
        current.map((card) => {
          if (card.id !== firstId && card.id !== secondId) {
            return card
          }

          return {
            ...card,
            revealed: false,
            prankText: null,
            sleeping: false,
            fleeingUntil: null,
            fleeingDurationMs: getRandomFleeDuration(),
            hopUntil: null,
            effect: 'none',
          }
        }),
      )
      setTopCardId(null)
      setLocked(false)
    }, 920)
  }

  const restart = () => {
    velocityRef.current = {}
    phaseRef.current = {}
    cursorRef.current.active = false
    setBoardAwake(false)
    setLocked(false)
    setTurns(0)
    setSteps(0)
    setTopCardId(null)
    setConfettiBurst(0)
    setNowTick(performance.now())
    setDeckVersion((value) => value + 1)
    lastPrankStepShownRef.current = 0
    setNextPrankStep(getRandomPrankStepGap())
    setPrankCount(0)
    setCards(createDeck(pairCount))
  }

  const handlePairCountChange = (nextPairCount: PairCountOption) => {
    if (nextPairCount === pairCount) {
      restart()
      return
    }

    velocityRef.current = {}
    phaseRef.current = {}
    cursorRef.current.active = false
    setPairCount(nextPairCount)
    setBoardAwake(false)
    setLocked(false)
    setTurns(0)
    setSteps(0)
    setTopCardId(null)
    setWinPulse(0)
    setConfettiBurst(0)
    setNowTick(performance.now())
    setDeckVersion((value) => value + 1)
    lastPrankStepShownRef.current = 0
    setNextPrankStep(getRandomPrankStepGap())
    setPrankCount(0)
    setCards(createDeck(nextPairCount))
  }

  return (
    <>
      <WinConfetti burstKey={confettiBurst} getOrigin={getConfettiOrigin} />

      <main className={`app-shell ${allMatched ? 'is-winning' : ''}`}>
        <IntroPanel
          turns={turns}
          matchedPairs={matchedCount / 2}
          totalPairs={cards.length / 2}
          pairCount={pairCount}
          onPairCountChange={handlePairCountChange}
          onRestart={restart}
        />

        <section className='board-panel'>
          <div className='board-header'>
            <div>
              <p className='board-label'>Arena</p>
              <h2>Hunt the spring stash.</h2>
            </div>
            <p className='board-hint'>
              {!boardAwake &&
                `${pairCount} themed egg pairs are asleep until your first click.`}
              {boardAwake &&
                !allMatched &&
                'Each new chase rolls one gentle escape effect.'}
              {allMatched && `All pairs caught. Pulse ${winPulse + 1}.`}
            </p>
          </div>

          <div
          ref={boardRef}
          className='board'
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerLeave}
        >
            {cards.map((card) => {
              const isFleeing =
                card.fleeingUntil !== null && nowTick < card.fleeingUntil

              return (
                <MemoCard
                  key={card.id}
                  card={card}
                  isBoardAwake={boardAwake}
                  isFleeing={isFleeing}
                  isTopCard={topCardId === card.id}
                  nowTick={nowTick}
                  compactScale={cardScale}
                  onClick={() => handleCardClick(card.id)}
                />
              )
            })}
          </div>
        </section>
      </main>
    </>
  )
}

export default App
