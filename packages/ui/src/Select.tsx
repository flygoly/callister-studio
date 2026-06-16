import type { SelectHTMLAttributes } from 'react'

type SelectOption = {
  value: string
  label: string
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  options: SelectOption[]
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <label className="cs-field">
      {label ? <span className="cs-field__label">{label}</span> : null}
      <select className={`cs-select ${className}`.trim()} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
