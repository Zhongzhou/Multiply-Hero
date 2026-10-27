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
    'calm:idle': 'animals/Pig001.png',
    'surprise:idle': 'animals/Pig002.png',
    'laugh:idle': 'animals/Pig003.png',
    'laugh:jump': 'animals/Pig003.png',
    'hard-cry:fallen': 'animals/Pig004.png',
  },
  cow: {
    'calm:idle': 'animals/Bull001.png',
    'surprise:idle': 'animals/Bull002.png',
    'laugh:idle': 'animals/Bull003.png',
    'laugh:jump': 'animals/Bull003.png',
    'hard-cry:fallen': 'animals/Bull004.png',
  },
  tiger: {
    'calm:idle': 'animals/Tiger001.png',
    'surprise:idle': 'animals/Tiger002.png',
    'laugh:idle': 'animals/Tiger003.png',
    'laugh:jump': 'animals/Tiger003.png',
    'hard-cry:fallen': 'animals/Tiger004.png',
  },
}

function characterPoseSrc(id: CharacterId, expression: Expression, motion: Motion = 'idle'): string {
  const file = poseFiles[id][`${expression}:${motion}`]
  if (!file) throw new Error(`Missing character art for ${id} ${expression} ${motion}`)
  const folder = file.includes('/') ? '' : 'characters/'
  return `${import.meta.env.BASE_URL}${folder}${file}`
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
