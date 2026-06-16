import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <label className="cs-field">
      {label ? <span className="cs-field__label">{label}</span> : null}
      <input className={`cs-input ${className}`.trim()} {...props} />
    </label>
  )
}
