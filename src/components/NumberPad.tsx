import { playClick } from '../audio/sounds.ts'

const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

export function NumberPad({
  value,
  disabled,
  onChange,
  onEnter,
}: {
  value: string
  disabled: boolean
  onChange: (next: string) => void
  onEnter: () => void
}) {
  function typeDigit(digit: string) {
    if (disabled || value.length >= 2) return
    onChange(value + digit)
  }

  return (
    <div className="number-pad" aria-label="Number pad">
      {digits.map((digit) => (
        <button
          key={digit}
          type="button"
          className="pad-key"
          data-testid={`pad-digit-${digit}`}
          disabled={disabled}
          onClick={() => {
            playClick()
            typeDigit(digit)
          }}
        >
          {digit}
        </button>
      ))}
      <button
        type="button"
        className="pad-key"
        data-testid="pad-digit-0"
        disabled={disabled}
        onClick={() => {
          playClick()
          typeDigit('0')
        }}
      >
        0
      </button>
      <button
        type="button"
        className="pad-key pad-back"
        data-testid="pad-backspace"
        aria-label="Backspace"
        disabled={disabled}
        onClick={() => {
          playClick()
          onChange(value.slice(0, -1))
        }}
      >
        ⌫
      </button>
      <button
        type="button"
        className="pad-key pad-enter"
        data-testid="pad-enter"
        disabled={disabled || value.length === 0}
        onClick={() => {
          playClick()
          onEnter()
        }}
      >
        Enter
      </button>
    </div>
  )
}
