import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  children: ReactNode
}

export function Button({ variant = 'secondary', className = '', children, ...props }: ButtonProps) {
  return (
    <button className={`cs-btn cs-btn--${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  )
}
