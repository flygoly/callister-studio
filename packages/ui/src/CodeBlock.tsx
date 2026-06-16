type CodeBlockProps = {
  code: string
  language?: string
}

export function CodeBlock({ code, language = 'text' }: CodeBlockProps) {
  return (
    <pre className="cs-code-block">
      <code data-language={language}>{code}</code>
    </pre>
  )
}
