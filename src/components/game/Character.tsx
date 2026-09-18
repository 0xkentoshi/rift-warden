import type { CSSProperties } from 'react'
interface Props {
  x: number
  y: number
  direction: 'up' | 'down' | 'left' | 'right'
  moving: boolean
}
// Calibrated to this atlas's boot baselines at an 86px frame size. Generated
// rows are not perfectly uniform; these offsets keep the feet on the ground.
const rows = { down: '-10px', left: '-93px', right: '-176px', up: '-257px' }
export function Character({ x, y, direction, moving }: Props) {
  return (
    <div
      className={'character' + (moving ? ' character--moving' : '')}
      style={
        {
          left: x,
          top: y,
          zIndex: Math.round(y),
          '--sprite-y': rows[direction],
          '--sprite-step-y': direction === 'up' ? '-259px' : rows[direction],
        } as CSSProperties
      }
      data-x={Math.round(x)}
      data-y={Math.round(y)}
      data-moving={moving}
      data-direction={direction}
      aria-label="Rift technician"
    >
      <span className="character__shadow" />
      <span className="character__sprite" />
    </div>
  )
}
