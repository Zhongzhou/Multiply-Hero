import type { CharacterId, Expression, Motion, Pose } from '../content/cast.ts'
import { poseLabel } from '../content/cast.ts'

const poseFiles: Record<CharacterId, Partial<Record<`${Expression}:${Motion}`, string>>> = {
  penguin: {
    'calm:idle': 'pengy-standing.png',
    'laugh:idle': 'pengy-laughing.png',
    'tongue:idle': 'pengy-sticking-out-tongue.png',
    'cry:idle': 'pengy-crying.png',
    'laugh:jump': 'pengy-laughing-and-jumping.png',
    'cry:lay': 'pengy-on-the-ground-crying.png',
  },
  koala: {
    'calm:idle': 'marshmello-standing.png',
    'laugh:idle': 'marshmello-laughing.png',
    'tongue:idle': 'marshmello-sticking-out-tongue.png',
    'cry:idle': 'marshmello-crying.png',
    'laugh:jump': 'marshmello-laughing-and-jumping.png',
    'cry:lay': 'marshmello-on-the-ground-crying.png',
  },
  pig: {
    'calm:idle': 'penny-standing.png',
    'cry:idle': 'penny-crying.png',
    'laugh:idle': 'penny-laughing.png',
    'laugh:jump': 'penny-laughing-and-jumping.png',
    'hard-cry:fallen': 'penny-fell-down-crying.png',
  },
  whale: {
    'calm:idle': 'splash-standing.png',
    'cry:idle': 'splash-crying.png',
    'laugh:idle': 'splash-laughing.png',
    'laugh:jump': 'splash-laughing-and-jumping.png',
    'hard-cry:fallen': 'splash-fell-down-crying.png',
  },
  gorilla: {
    'calm:idle': 'bongo-standing.png',
    'cry:idle': 'bongo-crying.png',
    'laugh:idle': 'bongo-laughing.png',
    'laugh:jump': 'bongo-laughing-and-jumping.png',
    'hard-cry:fallen': 'bongo-fell-down-crying.png',
  },
}

function characterPoseSrc(id: CharacterId, expression: Expression, motion: Motion = 'idle'): string {
  const file = poseFiles[id][`${expression}:${motion}`]
  if (!file) throw new Error(`Missing character art for ${id} ${expression} ${motion}`)
  return `${import.meta.env.BASE_URL}characters/${file}`
}

export function CharacterArt({
  id,
  expression,
  motion = 'idle',
  alt = '',
}: {
  id: CharacterId
  expression: Expression
  motion?: Motion
  alt?: string
}) {
  return <img src={characterPoseSrc(id, expression, motion)} alt={alt} draggable={false} />
}

export function CharacterSlot({
  id,
  pose,
  name,
  testId,
  side = 'center',
}: {
  id: CharacterId
  pose: Pose
  name: string
  testId?: string
  side?: 'left' | 'right' | 'center'
}) {
  return (
    <figure
      className="character-slot"
      aria-label={poseLabel(name, pose)}
      data-testid={testId}
      data-motion={pose.motion}
      data-expression={pose.expression}
    >
      <div className={`actor motion-${pose.motion} side-${side}`}>
        <CharacterArt id={id} expression={pose.expression} motion={pose.motion} alt="" />
      </div>
      <figcaption className="character-name">{name}</figcaption>
    </figure>
  )
}
