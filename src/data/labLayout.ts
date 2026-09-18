// One coordinate system, matching the approved image. Coordinates denote the player's feet.
export interface Point {
  x: number
  y: number
}
export interface Rect {
  id: string
  x: number
  y: number
  width: number
  height: number
}
export interface PortalPlacement {
  core: Point
  radius: Point
  label: Point
  approach: Point
  interactionRadius: number
  collider: Rect
  color: string
}
export const SCENE = { width: 1672, height: 941 } as const
export const START_POSITION: Point = { x: 836, y: 521 }
export const PLAYER_RADIUS = 11
export const portalPositions: Record<string, PortalPlacement> = {
  'crimson-gate': {
    core: { x: 465, y: 263 },
    radius: { x: 30, y: 53 },
    label: { x: 487, y: 366 },
    approach: { x: 619, y: 417 },
    interactionRadius: 100,
    collider: { id: 'crimson-gate', x: 336, y: 154, width: 245, height: 250 },
    color: '#ff383c',
  },
  'mossbound-door': {
    core: { x: 835, y: 183 },
    radius: { x: 36, y: 53 },
    label: { x: 835, y: 280 },
    approach: { x: 835, y: 371 },
    interactionRadius: 86,
    collider: { id: 'mossbound-door', x: 700, y: 76, width: 270, height: 250 },
    color: '#69ff4b',
  },
  'mirror-rift': {
    core: { x: 1204, y: 264 },
    radius: { x: 30, y: 53 },
    label: { x: 1187, y: 366 },
    approach: { x: 1053, y: 417 },
    interactionRadius: 100,
    collider: { id: 'mirror-rift', x: 1090, y: 154, width: 245, height: 250 },
    color: '#ffae25',
  },
  'void-passage': {
    core: { x: 430, y: 564 },
    radius: { x: 28, y: 55 },
    label: { x: 438, y: 714 },
    approach: { x: 605, y: 594 },
    interactionRadius: 95,
    collider: { id: 'void-passage', x: 320, y: 447, width: 239, height: 290 },
    color: '#c748ff',
  },
  'azure-bloom': {
    core: { x: 1239, y: 564 },
    radius: { x: 29, y: 55 },
    label: { x: 1235, y: 714 },
    approach: { x: 1067, y: 594 },
    interactionRadius: 95,
    collider: { id: 'azure-bloom', x: 1113, y: 447, width: 239, height: 290 },
    color: '#27acff',
  },
  'silent-arch': {
    core: { x: 835, y: 718 },
    radius: { x: 37, y: 48 },
    label: { x: 835, y: 811 },
    approach: { x: 835, y: 591 },
    interactionRadius: 66,
    collider: { id: 'silent-arch', x: 723, y: 613, width: 224, height: 250 },
    color: '#a396c1',
  },
}
// Conservative silhouettes block furniture and arches; the six approaches remain reachable.
export const sceneryColliders: Rect[] = [
  { id: 'north-wall', x: 0, y: 0, width: 1672, height: 276 },
  { id: 'west-furniture', x: 0, y: 0, width: 304, height: 941 },
  { id: 'east-furniture', x: 1368, y: 0, width: 304, height: 941 },
  { id: 'south-steps', x: 0, y: 824, width: 1672, height: 117 },
  { id: 'west-rail', x: 594, y: 680, width: 65, height: 261 },
  { id: 'east-rail', x: 1013, y: 680, width: 65, height: 261 },
  { id: 'lamp-nw', x: 689, y: 363, width: 41, height: 60 },
  { id: 'lamp-ne', x: 939, y: 363, width: 41, height: 60 },
  { id: 'lamp-w', x: 619, y: 457, width: 41, height: 60 },
  { id: 'lamp-e', x: 1012, y: 457, width: 41, height: 60 },
  { id: 'lamp-sw', x: 693, y: 559, width: 43, height: 57 },
  { id: 'lamp-se', x: 937, y: 559, width: 43, height: 57 },
]
export const colliders: Rect[] = [
  ...sceneryColliders,
  ...Object.values(portalPositions).map((p) => p.collider),
]
export const ambientLights: Point[] = [
  { x: 440, y: 76 },
  { x: 713, y: 106 },
  { x: 958, y: 108 },
  { x: 1200, y: 79 },
  { x: 296, y: 205 },
  { x: 123, y: 290 },
  { x: 1577, y: 185 },
  { x: 138, y: 498 },
  { x: 1504, y: 569 },
  { x: 642, y: 474 },
  { x: 1028, y: 474 },
  { x: 713, y: 385 },
  { x: 959, y: 385 },
  { x: 714, y: 578 },
  { x: 958, y: 578 },
  { x: 545, y: 852 },
  { x: 1128, y: 852 },
]
