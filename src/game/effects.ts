import type { PortalStatus, RiskLevel } from '../types/portal'
const profiles = {
  LOW: { particles: 9, speed: 0.38, glow: 0.35, pulse: 0.65 },
  MEDIUM: { particles: 17, speed: 0.65, glow: 0.5, pulse: 1 },
  HIGH: { particles: 28, speed: 1, glow: 0.72, pulse: 1.5 },
  CRITICAL: { particles: 46, speed: 1.7, glow: 1, pulse: 2.5 },
} as const
export function riskToVfx(level: RiskLevel, status: PortalStatus) {
  return status === 'closed'
    ? { particles: 2, speed: 0.12, glow: 0.08, pulse: 0.3 }
    : profiles[level]
}
