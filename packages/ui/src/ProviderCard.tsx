import type { ReactNode } from 'react'

export type ProviderCardTone = 'neutral' | 'success' | 'warning' | 'danger'

export type ProviderCardProps = {
  title: string
  description?: string
  icon?: ReactNode
  active?: boolean
  tone?: ProviderCardTone
  statusText?: string
  disabled?: boolean
  onClick?: () => void
}

export function ProviderCard({
  title,
  description,
  icon,
  active = false,
  tone = 'neutral',
  statusText,
  disabled = false,
  onClick
}: ProviderCardProps) {
  const toneClass = `cs-provider-card__status--${tone}`

  return (
    <button
      type="button"
      className={[
        'cs-provider-card',
        active && 'cs-provider-card--active',
        disabled && 'cs-provider-card--disabled'
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      disabled={disabled}
    >
      {icon ? <span className="cs-provider-card__icon">{icon}</span> : null}
      <span className="cs-provider-card__text">
        <span className="cs-provider-card__title">{title}</span>
        {description ? (
          <span className="cs-provider-card__description">{description}</span>
        ) : null}
      </span>
      {statusText ? (
        <span className={['cs-provider-card__status', toneClass].join(' ')}>
          {statusText}
        </span>
      ) : null}
    </button>
  )
}
