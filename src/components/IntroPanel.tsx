type IntroPanelProps = {
  turns: number
  matchedPairs: number
  totalPairs: number
  onRestart: () => void
}

const IntroPanel = ({
  turns,
  matchedPairs,
  totalPairs,
  onRestart,
}: IntroPanelProps) => {
  return (
    <section className='intro-panel'>
      <p className='eyebrow'>Troll Memo prototype</p>
      <h1>Easter eggs that do not want to be found.</h1>
      <p className='lede'>
        8 Easter picture pairs, each tucked inside a decorated egg shell. They
        start sleepy and sweet, then panic, flee, and settle again when you
        back off.
      </p>

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
