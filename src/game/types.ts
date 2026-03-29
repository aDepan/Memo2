export type Position = {
  x: number
  y: number
}

export type EscapeEffect = 'none' | 'dodge' | 'small' | 'tiny' | 'hop' | 'bounce'

export type CardData = {
  id: number
  pairId: number
  icon: string
  title: string
  accent: string
  shellPattern: string
}

export type CardState = CardData & {
  matched: boolean
  revealed: boolean
  prankText: string | null
  sleeping: boolean
  fleeingUntil: number | null
  fleeingDurationMs: number
  hopUntil: number | null
  effect: EscapeEffect
  homePosition: Position
  position: Position
}
