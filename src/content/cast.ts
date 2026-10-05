import type { AvatarId, BossId } from '../config/gameConfig.ts'

export type Expression = 'calm' | 'tongue' | 'cry' | 'laugh' | 'hard-cry'
export type Motion = 'idle' | 'jump' | 'fallen' | 'lay'
export type CharacterId = AvatarId | BossId

export interface Pose {
  expression: Expression
  motion: Motion
}

export type AvatarMoment = 'idle' | 'tongue' | 'cry' | 'victory' | 'defeat'
export type BossMoment = 'idle' | 'cry' | 'laugh' | 'victory' | 'defeat'

export const avatarCast: Record<AvatarId, { name: string; label: string }> = {
  penguin: { name: 'Pengy', label: 'Purple penguin' },
  koala: { name: 'Marshy', label: 'Grey koala' },
}

export const bossCast: Record<BossId, { name: string; label: string }> = {
  pig: { name: 'Penny', label: 'the pig' },
  whale: { name: 'Splash', label: 'the whale' },
  gorilla: { name: 'Bongo', label: 'the gorilla' },
}

export function avatarPose(moment: AvatarMoment): Pose {
  switch (moment) {
    case 'tongue':
      return { expression: 'tongue', motion: 'idle' }
    case 'cry':
      return { expression: 'cry', motion: 'idle' }
    case 'victory':
      return { expression: 'laugh', motion: 'jump' }
    case 'defeat':
      return { expression: 'cry', motion: 'lay' }
    default:
      return { expression: 'calm', motion: 'idle' }
  }
}

export function bossPose(moment: BossMoment): Pose {
  switch (moment) {
    case 'cry':
      return { expression: 'cry', motion: 'idle' }
    case 'laugh':
      return { expression: 'laugh', motion: 'idle' }
    case 'victory':
      return { expression: 'laugh', motion: 'jump' }
    case 'defeat':
      return { expression: 'hard-cry', motion: 'fallen' }
    default:
      return { expression: 'calm', motion: 'idle' }
  }
}

export function poseLabel(name: string, pose: Pose): string {
  if (pose.motion === 'jump' && pose.expression === 'laugh') return `${name} laughs and jumps`
  if (pose.motion === 'lay') return `${name} is on the ground, crying`
  if (pose.motion === 'fallen') return `${name} fell down and is crying`
  if (pose.expression === 'tongue') return `${name} sticks out their tongue`
  if (pose.expression === 'hard-cry') return `${name} is crying hard`
  if (pose.expression === 'cry') return `${name} is crying`
  if (pose.expression === 'laugh') return `${name} is laughing`
  return name
}
