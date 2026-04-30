export function getModalElement() {
  return document.getElementById('modal')
}

export function closeModal() {
  const modal = getModalElement()

  if (!modal) return

  modal.classList.add('hidden')
  modal.innerHTML = ''
}

export function openModalContainer() {
  const modal = getModalElement()

  if (!modal) return null

  modal.classList.remove('hidden')

  return modal
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}