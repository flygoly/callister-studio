type PlaceholderPageProps = {
  module: string
}

export function PlaceholderPage({ module }: PlaceholderPageProps): React.ReactElement {
  return (
    <div className="placeholder-page">
      <div className="placeholder-card">
        <h2>{module}</h2>
        <p>This playground is not implemented yet. See the roadmap for planned milestones.</p>
        <ul>
          <li>Input panel</li>
          <li>Output panel</li>
          <li>Trace inspector</li>
        </ul>
      </div>
    </div>
  )
}
