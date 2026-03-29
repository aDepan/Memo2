import type { EscapeEffect } from './types'

const EFFECTS: EscapeEffect[] = [
  'bounce',
  'bounce',
  'bounce',
  'bounce',
  'dodge',
  'small',
  'tiny',
  'hop',
]

export function getRandomFleeDuration() {
  return 5_000 + Math.floor(Math.random() * 5_001)
}

export function getRandomEscapeEffect(previous?: EscapeEffect): EscapeEffect {
  const pool = previous
    ? EFFECTS.filter((effect) => effect !== previous)
    : EFFECTS

  return pool[Math.floor(Math.random() * pool.length)]
}
