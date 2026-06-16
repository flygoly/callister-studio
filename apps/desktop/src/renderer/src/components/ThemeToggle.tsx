import { useAppStore } from '../stores/useAppStore'
import { Select } from '@callister/ui'

const themeOptions = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' }
]

export function ThemeToggle() {
  const theme = useAppStore((state) => state.settings.theme)
  const setTheme = useAppStore((state) => state.setTheme)

  return (
    <Select
      label="Theme"
      value={theme}
      options={themeOptions}
      onChange={(event) => void setTheme(event.target.value as 'light' | 'dark' | 'system')}
    />
  )
}
