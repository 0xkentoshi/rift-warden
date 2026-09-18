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
export type WalkableZone =
  | { id: string; type: 'ellipse'; center: Point; radius: Point }
  | { id: string; type: 'path'; from: Point; to: Point; width: number; portalId?: string }
// Only the carpet, the six stone paths and their entry landings are navigable.
// Colliders remain a separate exclusion layer (lamps, rails and portal masonry).
export const walkableZones: WalkableZone[] = [
  {
    id: 'central-carpet',
    type: 'ellipse',
    center: { x: 836, y: 502 },
    radius: { x: 168, y: 91 },
  },
  {
    id: 'north-path',
    type: 'path',
    from: { x: 835, y: 450 },
    to: { x: 835, y: 344 },
    width: 68,
  },
  {
    id: 'northwest-path',
    type: 'path',
    from: { x: 731, y: 454 },
    to: { x: 590, y: 396 },
    width: 64,
  },
  {
    id: 'northeast-path',
    type: 'path',
    from: { x: 941, y: 454 },
    to: { x: 1082, y: 396 },
    width: 64,
  },
  {
    id: 'southwest-path',
    type: 'path',
    from: { x: 710, y: 530 },
    to: { x: 587, y: 563 },
    width: 62,
  },
  {
    id: 'southeast-path',
    type: 'path',
    from: { x: 962, y: 530 },
    to: { x: 1085, y: 563 },
    width: 62,
  },
  {
    id: 'south-path',
    type: 'path',
    from: { x: 835, y: 552 },
    to: { x: 835, y: 598 },
    width: 68,
  },
  {
    id: 'crimson-stairs',
    portalId: 'crimson-gate',
    type: 'path',
    from: { x: 619, y: 417 },
    to: { x: 493, y: 335 },
    width: 62,
  },
  {
    id: 'moss-stairs',
    portalId: 'mossbound-door',
    type: 'path',
    from: { x: 835, y: 371 },
    to: { x: 835, y: 270 },
    width: 76,
  },
  {
    id: 'mirror-stairs',
    portalId: 'mirror-rift',
    type: 'path',
    from: { x: 1053, y: 417 },
    to: { x: 1179, y: 335 },
    width: 62,
  },
  {
    id: 'void-stairs',
    portalId: 'void-passage',
    type: 'path',
    from: { x: 587, y: 563 },
    to: { x: 481, y: 605 },
    width: 58,
  },
  {
    id: 'azure-stairs',
    portalId: 'azure-bloom',
    type: 'path',
    from: { x: 1085, y: 563 },
    to: { x: 1191, y: 605 },
    width: 58,
  },
  {
    id: 'silent-stairs',
    portalId: 'silent-arch',
    type: 'path',
    from: { x: 835, y: 591 },
    to: { x: 835, y: 636 },
    width: 56,
  },
]
export const portalPositions: Record<string, PortalPlacement> = {
  'crimson-gate': {
    core: { x: 465, y: 263 },
    radius: { x: 30, y: 53 },
    label: { x: 487, y: 366 },
    approach: { x: 493, y: 335 },
    interactionRadius: 38,
    collider: { id: 'crimson-gate', x: 336, y: 154, width: 245, height: 250 },
    color: '#ff383c',
  },
  'mossbound-door': {
    core: { x: 835, y: 183 },
    radius: { x: 36, y: 53 },
    label: { x: 835, y: 280 },
    approach: { x: 835, y: 270 },
    interactionRadius: 32,
    collider: { id: 'mossbound-door', x: 700, y: 76, width: 270, height: 250 },
    color: '#69ff4b',
  },
  'mirror-rift': {
    core: { x: 1204, y: 264 },
    radius: { x: 30, y: 53 },
    label: { x: 1187, y: 366 },
    approach: { x: 1179, y: 335 },
    interactionRadius: 38,
    collider: { id: 'mirror-rift', x: 1090, y: 154, width: 245, height: 250 },
    color: '#ffae25',
  },
  'void-passage': {
    core: { x: 445, y: 550 },
    radius: { x: 26, y: 52 },
    label: { x: 478, y: 707 },
    approach: { x: 481, y: 605 },
    interactionRadius: 36,
    collider: { id: 'void-passage', x: 320, y: 447, width: 239, height: 290 },
    color: '#c748ff',
  },
  'azure-bloom': {
    core: { x: 1226, y: 550 },
    radius: { x: 26, y: 52 },
    label: { x: 1194, y: 707 },
    approach: { x: 1191, y: 605 },
    interactionRadius: 36,
    collider: { id: 'azure-bloom', x: 1113, y: 447, width: 239, height: 290 },
    color: '#27acff',
  },
  'silent-arch': {
    core: { x: 835, y: 718 },
    radius: { x: 37, y: 48 },
    label: { x: 835, y: 811 },
    approach: { x: 835, y: 636 },
    interactionRadius: 27,
    collider: { id: 'silent-arch', x: 723, y: 613, width: 224, height: 250 },
    color: '#a396c1',
  },
}
// Conservative silhouettes block furniture and arches; the six approaches remain reachable.
export const sceneryColliders: Rect[] = [
  { id: 'north-wall', x: 0, y: 0, width: 1672, height: 246 },
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
export const ambientLights: (Point & { color?: string })[] = [
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
  // Candle wicks on the approved art; these are light anchors, not new objects.
  { x: 353, y: 282, color: '#ff514d' },
  { x: 395, y: 327, color: '#ff514d' },
  { x: 422, y: 368, color: '#ff514d' },
  { x: 557, y: 267, color: '#ff514d' },
  { x: 603, y: 315, color: '#ff514d' },
  { x: 732, y: 237 },
  { x: 938, y: 240 },
  { x: 1071, y: 313 },
  { x: 1110, y: 275 },
  { x: 1270, y: 328 },
  { x: 1305, y: 294 },
  { x: 1334, y: 319 },
  { x: 1246, y: 369 },
  { x: 503, y: 508, color: '#d85aff' },
  { x: 437, y: 635, color: '#d85aff' },
  { x: 1169, y: 508, color: '#37baff' },
  { x: 1336, y: 549, color: '#37baff' },
  { x: 1235, y: 639, color: '#37baff' },
  { x: 712, y: 727 },
  { x: 729, y: 772 },
  { x: 958, y: 727 },
  { x: 941, y: 772 },
  { x: 72, y: 344 },
  { x: 95, y: 651 },
  { x: 320, y: 800 },
  { x: 1581, y: 709 },
  { x: 1555, y: 304 },
]
