import type { CSSProperties } from 'react';
import type { CardState } from '../game/types';

const CARD_WIDTH = 112;
const CARD_HEIGHT = 144;

type MemoCardProps = {
  card: CardState;
  isBoardAwake: boolean;
  isFleeing: boolean;
  nowTick: number;
  compactScale: number;
  onClick: () => void;
};

const getEffectScale = (effect: CardState['effect'], isFleeing: boolean) => {
  if (!isFleeing) {
    return 1
  }

  if (effect === 'small') {
    return 0.4
  }

  if (effect === 'tiny') {
    return 0.045
  }

  if (effect === 'bounce') {
    return 1
  }

  return 1
}

const MemoCard = ({
  card,
  isBoardAwake,
  isFleeing,
  nowTick,
  compactScale,
  onClick,
}: MemoCardProps) => {
  const scale = getEffectScale(card.effect, isFleeing) * compactScale
  const offsetX = (CARD_WIDTH * (scale - 1)) / 2
  const offsetY = (CARD_HEIGHT * (scale - 1)) / 2
  const isHopping = card.hopUntil !== null && card.hopUntil > nowTick && isFleeing
  const isBouncing = isFleeing && card.effect === 'bounce'
  const zIndex =
    card.revealed || isBouncing ? 30 : isFleeing ? 20 : card.matched ? 10 : 1

  return (
    <button
      type='button'
      className={[
        'memo-card',
        card.revealed ? 'is-revealed' : '',
        card.matched ? 'is-matched' : '',
        isBoardAwake ? 'is-awake' : 'is-sleeping',
        isFleeing ? 'is-fleeing' : '',
        isHopping ? 'is-hopping' : '',
        isBouncing ? 'is-bouncing' : '',
        isFleeing ? `effect-${card.effect}` : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        transform: `translate(${card.position.x + offsetX}px, ${card.position.y + offsetY}px) scale(${scale})`,
        zIndex,
      }}
      onClick={onClick}
      aria-label={`${card.title} card`}
    >
      <span className='memo-card-body'>
        <span className='card-face card-back'>
          <span
            className='egg-shell egg-shell-back'
            style={
              {
                '--egg-accent': card.accent,
                '--egg-pattern': card.shellPattern,
              } as CSSProperties
            }
          />
          <span className='card-eyes' aria-hidden='true'>
            <span className='eye'>
              <span className='pupil' />
            </span>
            <span className='eye'>
              <span className='pupil' />
            </span>
          </span>
        </span>
        <span className='card-face card-front'>
          <span
            className='egg-shell egg-shell-front'
            style={
              {
                '--egg-accent': card.accent,
                '--egg-pattern': card.shellPattern,
              } as CSSProperties
            }
          />
          {card.prankText ? (
            <span className='card-prank'>{card.prankText}</span>
          ) : (
            <>
              <span className='card-icon' aria-hidden='true'>
                {card.icon}
              </span>
              <span className='card-name'>{card.title}</span>
            </>
          )}
        </span>
      </span>
    </button>
  )
}

export default MemoCard
