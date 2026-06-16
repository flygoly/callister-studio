import type { TextareaHTMLAttributes } from 'react'

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
}

export function TextArea({ label, className = '', ...props }: TextAreaProps) {
  return (
    <label className="cs-field">
      {label ? <span className="cs-field__label">{label}</span> : null}
      <textarea className={`cs-textarea ${className}`.trim()} {...props} />
    </label>
  )
}
