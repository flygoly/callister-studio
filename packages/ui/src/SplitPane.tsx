import type { ReactNode } from 'react'

type SplitPaneProps = {
  left: ReactNode
  right: ReactNode
  bottom?: ReactNode
  leftMinWidth?: number
}

export function SplitPane({ left, right, bottom, leftMinWidth = 320 }: SplitPaneProps) {
  return (
    <div className="cs-split-pane">
      <div className="cs-split-pane__main">
        <div className="cs-split-pane__left" style={{ minWidth: leftMinWidth }}>
          {left}
        </div>
        <div className="cs-split-pane__right">{right}</div>
      </div>
      {bottom ? <div className="cs-split-pane__bottom">{bottom}</div> : null}
    </div>
  )
}
