import type { PortalStatus, RiskLevel } from '../types/portal'
const profiles = {
  LOW: { particles: 7, speed: 0.3, glow: 0.24, pulse: 0.5, shake: 0, burst: 0 },
  MEDIUM: { particles: 20, speed: 0.65, glow: 0.45, pulse: 1, shake: 0.5, burst: 5 },
  HIGH: { particles: 48, speed: 1.2, glow: 0.72, pulse: 1.7, shake: 2, burst: 12 },
  CRITICAL: { particles: 105, speed: 2.4, glow: 1, pulse: 3.2, shake: 5, burst: 28 },
} as const
export function riskToVfx(level: RiskLevel, status: PortalStatus) {
  return status === 'closed'
    ? { particles: 0, speed: 0, glow: 0, pulse: 0, shake: 0, burst: 0 }
    : profiles[level]
}
