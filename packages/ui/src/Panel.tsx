import type { HTMLAttributes, ReactNode } from 'react'

type PanelProps = HTMLAttributes<HTMLDivElement> & {
  title?: string
  children: ReactNode
}

export function Panel({ title, children, className = '', ...props }: PanelProps) {
  return (
    <section className={`cs-panel ${className}`.trim()} {...props}>
      {title ? <header className="cs-panel__title">{title}</header> : null}
      <div className="cs-panel__body">{children}</div>
    </section>
  )
}
