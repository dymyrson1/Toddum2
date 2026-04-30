import { escapeHtml } from '../utils/html.js'

export { escapeHtml }

export function getModalElement() {
  return document.getElementById('modal')
}

export function closeModal() {
  const modal = getModalElement()

  if (!modal) return

  modal.classList.add('hidden')
  modal.innerHTML = ''

  document.removeEventListener('keydown', handleModalKeydown)
}

export function openModalContainer() {
  const modal = getModalElement()

  if (!modal) return null

  modal.classList.remove('hidden')

  attachModalBaseEvents(modal)

  return modal
}

function attachModalBaseEvents(modal) {
  modal.onclick = event => {
    if (event.target === modal) {
      closeModal()
    }
  }

  document.removeEventListener('keydown', handleModalKeydown)
  document.addEventListener('keydown', handleModalKeydown)
}

function handleModalKeydown(event) {
  if (event.key === 'Escape') {
    closeModal()
  }
}