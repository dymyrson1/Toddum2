import { renderIcon } from '../icons.js'

export function initTheme() {
  const autoTheme = getThemeByTime()

  applyTheme(autoTheme)

  const btn = document.getElementById('themeToggle')
  if (!btn) return

  btn.onclick = () => {
    const current = document.documentElement.dataset.theme
    const next = current === 'dark' ? 'light' : 'dark'

    applyTheme(next)
  }
}

function getThemeByTime() {
  const hour = new Date().getHours()

  if (hour >= 20 || hour < 7) {
    return 'dark'
  }

  return 'light'
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme

  const btn = document.getElementById('themeToggle')
  if (btn) {
    btn.innerHTML = theme === 'dark' ? renderIcon('sun') : renderIcon('moon')
  }
}
