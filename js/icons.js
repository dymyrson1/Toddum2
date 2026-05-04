export function renderIcon(name) {
  const icons = {
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/>'
  }

  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icons[name] || ''}</svg>`
}

export function initIcons() {
  document.querySelectorAll('[data-icon]').forEach(el => {
    const name = el.dataset.icon
    if (!name) return

    el.insertAdjacentHTML('afterbegin', renderIcon(name))
    el.classList.add('has-icon')
  })
}
