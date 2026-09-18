import type { PortalStatus, RiskLevel } from '../types/portal'
const profiles = {
  LOW: {
    particles: 24,
    speed: 0.36,
    glow: 0.48,
    pulse: 0.5,
    shake: 0,
    burst: 3,
    turbulence: 0.12,
    orbit: 0.4,
  },
  MEDIUM: {
    particles: 62,
    speed: 0.8,
    glow: 0.65,
    pulse: 0.9,
    shake: 0.4,
    burst: 9,
    turbulence: 0.32,
    orbit: 0.75,
  },
  HIGH: {
    particles: 126,
    speed: 1.35,
    glow: 0.84,
    pulse: 1.35,
    shake: 1.8,
    burst: 22,
    turbulence: 0.62,
    orbit: 1.1,
  },
  CRITICAL: {
    particles: 280,
    speed: 2.5,
    glow: 1,
    pulse: 1.8,
    shake: 4,
    burst: 48,
    turbulence: 1,
    orbit: 1.7,
  },
} as const
export function riskToVfx(level: RiskLevel, status: PortalStatus) {
  return status === 'closed'
    ? {
        particles: 0,
        speed: 0,
        glow: 0,
        pulse: 0,
        shake: 0,
        burst: 0,
        turbulence: 0,
        orbit: 0,
      }
    : profiles[level]
}
