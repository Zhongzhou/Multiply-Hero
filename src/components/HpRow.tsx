function Heart({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="heart" aria-hidden="true">
      <path
        d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z"
        fill={filled ? '#ff5d73' : 'transparent'}
        stroke="#1e2a3a"
        strokeWidth="2"
      />
    </svg>
  )
}

export function HpRow({
  name,
  hp,
  max,
  align,
  testId,
}: {
  name: string
  hp: number
  max: number
  align: 'start' | 'end'
  testId: string
}) {
  return (
    <div className={`hp-row hp-${align}`} data-testid={testId}>
      <span className="hp-name">{name}</span>
      <span className="hp-value">
        HP {hp}
        <span className="sr-only"> of {max}</span>
      </span>
      <div className="hp-hearts" aria-hidden="true">
        {Array.from({ length: max }, (_, index) => (
          <Heart key={index} filled={index < hp} />
        ))}
      </div>
    </div>
  )
}
