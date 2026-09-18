import type { CSSProperties } from 'react'
interface Props {
  x: number
  y: number
  direction: 'up' | 'down' | 'left' | 'right'
  moving: boolean
}
const rows = { down: '0%', left: '33.333333%', right: '66.666667%', up: '100%' }
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
