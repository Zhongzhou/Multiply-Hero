import { playClick } from '../audio/sounds.ts'
import { levelLabel, neighborLevel, gameConfig, type AvatarId, type LevelId } from '../config/gameConfig.ts'
import { avatarCast, avatarPose, bossCast, bossPose } from '../content/cast.ts'
import { CharacterSlot } from './Characters.tsx'

export function EndScreen({
  level,
  outcome,
  avatar,
  onAgain,
  onEasier,
  onHarder,
  onHome,
}: {
  level: LevelId
  outcome: 'win' | 'lose'
  avatar: AvatarId
  onAgain: () => void
  onEasier: () => void
  onHarder: () => void
  onHome: () => void
}) {
  const settings = gameConfig.levels[level]
  const hero = avatarCast[avatar]
  const boss = bossCast[settings.boss]
  const won = outcome === 'win'
  const easier = neighborLevel(level, -1)
  const harder = neighborLevel(level, 1)

  return (
    <div className="screen end-screen" data-testid="end">
      <div className="end-stage">
        <CharacterSlot
          id={avatar}
          name={hero.name}
          pose={avatarPose(won ? 'victory' : 'defeat')}
          testId="end-avatar"
          side="left"
        />
        <div className="end-copy">
          <p className="end-kicker">{levelLabel(level)}</p>
          <h1 data-testid="end-title">{won ? 'You win!' : 'Not this time!'}</h1>
          <p className="end-sub">
            {won ? `${boss.name} is down!` : `${hero.name} can try again.`}
          </p>
        </div>
        <CharacterSlot
          id={settings.boss}
          name={boss.name}
          pose={bossPose(won ? 'defeat' : 'victory')}
          testId="end-boss"
          side="right"
        />
        <div className="end-actions">
          <button
            type="button"
            className="sticker sticker-green"
            data-testid="play-again"
            onClick={() => {
              playClick()
              onAgain()
            }}
          >
            Play again
          </button>
          <button
            type="button"
            className="sticker"
            data-testid="play-easier"
            disabled={easier === null}
            onClick={() => {
              if (!easier) return
              playClick()
              onEasier()
            }}
          >
            Play easier
          </button>
          <button
            type="button"
            className="sticker"
            data-testid="play-harder"
            disabled={harder === null}
            onClick={() => {
              if (!harder) return
              playClick()
              onHarder()
            }}
          >
            Play harder
          </button>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              playClick()
              onHome()
            }}
          >
            Change hero
          </button>
        </div>
      </div>
    </div>
  )
}
