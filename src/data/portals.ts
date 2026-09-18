import type { Portal } from '../types/portal'

export const initialPortals: Portal[] = [
  {
    id: 'crimson-gate',
    name: 'Crimson Gate',
    destination: 'Ashen Hollow',
    energy: 94,
    stability: 16,
    collapseMinutes: 4,
    creatures: 3,
    status: 'open',
    uncertain: false,
  },

  {
    id: 'mossbound-door',
    name: 'Mossbound Door',
    destination: 'Verdant Reach',
    energy: 47,
    stability: 78,
    collapseMinutes: 54,
    creatures: 0,
    status: 'open',
    uncertain: false,
  },

  {
    id: 'mirror-rift',
    name: 'Mirror Rift',
    destination: 'Unknown Reflection',
    energy: 81,
    stability: 42,
    collapseMinutes: 18,
    creatures: 0,
    status: 'open',
    uncertain: true,
  },

  {
    id: 'void-passage',
    name: 'Void Passage',
    destination: 'Null Sector',
    energy: 88,
    stability: 29,
    collapseMinutes: 8,
    creatures: 7,
    status: 'open',
    uncertain: false,
  },

  {
    id: 'azure-bloom',
    name: 'Azure Bloom',
    destination: 'Celestial Garden',
    energy: 31,
    stability: 91,
    collapseMinutes: 120,
    creatures: 0,
    status: 'open',
    uncertain: false,
  },

  {
    id: 'silent-arch',
    name: 'Silent Arch',
    destination: 'Archive IX',
    energy: 0,
    stability: 100,
    collapseMinutes: 0,
    creatures: 0,
    status: 'closed',
    uncertain: false,
  },
]