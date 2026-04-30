import { renderModalContent } from './modal-logic.js'

function handleModalKeydown(event) {
  if (event.key === 'Escape') {
    closeModal()
  }
}

export function openModal(rowId, productName) {
  const modal = document.getElementById('modal')
  if (!modal) return

  modal.classList.remove('hidden')

  modal.innerHTML = `
    <div class="modal-content">
      <div id="modalBody"></div>
    </div>
  `

  renderModalContent(rowId, productName)
  attachModalBaseEvents()
}

export function closeModal() {
  const modal = document.getElementById('modal')
  if (!modal) return

  modal.classList.add('hidden')
  modal.innerHTML = ''

  document.removeEventListener('keydown', handleModalKeydown)
}

function attachModalBaseEvents() {
  const modal = document.getElementById('modal')
  if (!modal) return

  modal.onclick = event => {
    if (event.target === modal) {
      closeModal()
    }
  }

  document.removeEventListener('keydown', handleModalKeydown)
  document.addEventListener('keydown', handleModalKeydown)
}