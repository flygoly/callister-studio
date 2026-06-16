import type { HTMLAttributes, ReactNode } from 'react'

type PanelProps = HTMLAttributes<HTMLDivElement> & {
  title?: string
  actions?: ReactNode
  children: ReactNode
}

export function Panel({ title, actions, children, className = '', ...props }: PanelProps) {
  return (
    <section className={`cs-panel ${className}`.trim()} {...props}>
      {title ? (
        <header className="cs-panel__title">
          <span>{title}</span>
          {actions ? <span className="cs-panel__actions">{actions}</span> : null}
        </header>
      ) : null}
      <div className="cs-panel__body">{children}</div>
    </section>
  )
}
