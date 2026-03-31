import { PAIR_COUNT_OPTIONS } from '../game/constants'
import type { PairCountOption } from '../game/constants'

type IntroPanelProps = {
  turns: number
  matchedPairs: number
  totalPairs: number
  pairCount: PairCountOption
  onPairCountChange: (pairCount: PairCountOption) => void
  onRestart: () => void
}

const IntroPanel = ({
  turns,
  matchedPairs,
  totalPairs,
  pairCount,
  onPairCountChange,
  onRestart,
}: IntroPanelProps) => {
  return (
    <section className='intro-panel'>
      <p className='eyebrow'>Troll Memo prototype</p>
      <h1>Easter eggs that do not want to be found.</h1>
      <p className='lede'>
        {pairCount} Easter picture pairs, each tucked inside a decorated egg
        shell. They start sleepy and sweet, then panic, flee, and settle again
        when you back off.
      </p>

      <div className='pair-count-picker' aria-label='Choose number of pairs'>
        {PAIR_COUNT_OPTIONS.map((option) => (
          <button
            key={option}
            type='button'
            className={`pair-count-button ${pairCount === option ? 'is-selected' : ''}`}
            onClick={() => onPairCountChange(option)}
          >
            {option} pairs
          </button>
        ))}
      </div>

      <div className='status-row'>
        <div className='status-pill'>
          <span>Turns</span>
          <strong>{turns}</strong>
        </div>
        <div className='status-pill'>
          <span>Matches</span>
          <strong>
            {matchedPairs}/{totalPairs}
          </strong>
        </div>
        <button type='button' className='reset-button' onClick={onRestart}>
          Shuffle fresh chaos
        </button>
      </div>
    </section>
  )
}

export default IntroPanel
