import { playClick } from '../audio/sounds.ts'
import { gameConfig, levelLabel, levelOrder, type AvatarId, type LevelId } from '../config/gameConfig.ts'
import { avatarCast, bossCast } from '../content/cast.ts'
import { CharacterArt } from './Characters.tsx'

export function HomeScreen({
  avatar,
  saveWarning,
  onChoose,
  onStart,
  onDifficulty,
}: {
  avatar: AvatarId
  saveWarning: boolean
  onChoose: (avatar: AvatarId) => void
  onStart: (level: LevelId) => void
  onDifficulty: () => void
}) {
  return (
    <div className="screen home-screen" data-testid="home">
      <header className="home-header">
        <div>
          <h1>Multiply Heroes</h1>
          <p>Answer times tables. Knock out the boss. No clock.</p>
          <button
            type="button"
            className="text-button"
            data-testid="open-difficulty"
            onClick={() => {
              playClick()
              onDifficulty()
            }}
          >
            Fact difficulty
          </button>
        </div>
      </header>
      <div className="home-columns">
        <section className="panel" aria-labelledby="hero-heading">
          <h2 id="hero-heading">Pick your hero</h2>
          <div className="hero-grid">
            {(Object.keys(avatarCast) as AvatarId[]).map((id) => {
              const selected = avatar === id
              return (
                <div key={id} className="hero-pick">
                  <button
                    type="button"
                    className="hero-card"
                    data-testid={`avatar-${id}`}
                    aria-pressed={selected}
                    aria-labelledby={`hero-name-${id}`}
                    onClick={() => {
                      playClick()
                      onChoose(id)
                    }}
                  >
                    <div className="hero-art">
                      <CharacterArt id={id} expression={selected ? 'laugh' : 'calm'} />
                    </div>
                  </button>
                  <span id={`hero-name-${id}`} className="hero-name">
                    {avatarCast[id].name}
                  </span>
                  <span className="hero-label">{avatarCast[id].label}</span>
                </div>
              )
            })}
          </div>
          {saveWarning ? <p className="save-warning">Couldn't save the hero on this tablet.</p> : null}
        </section>
        <section className="panel" aria-labelledby="battle-heading">
          <h2 id="battle-heading">Pick a battle</h2>
          <div className="level-list">
            {levelOrder.map((level) => {
              const settings = gameConfig.levels[level]
              const boss = bossCast[settings.boss]
              return (
                <button
                  key={level}
                  type="button"
                  className={`level-card level-${level}`}
                  data-testid={`level-${level}`}
                  onClick={() => {
                    playClick()
                    onStart(level)
                  }}
                >
                  <div className="level-art" aria-hidden="true">
                    <CharacterArt id={settings.boss} expression="calm" />
                  </div>
                  <span className="level-copy">
                    <span className="level-name">{levelLabel(level)}</span>
                    <span className="level-boss">
                      {boss.name} {boss.label}
                    </span>
                    <span className="level-hp">
                      Your hearts {settings.avatarHp} · {boss.name}'s hearts {settings.bossHp}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
