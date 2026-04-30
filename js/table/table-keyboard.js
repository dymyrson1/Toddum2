import { confirmClearCell } from './table-confirmation.js'
import { getSelectedProductCell } from './table-selection.js'
import { isFormControlTarget } from './table-event-targets.js'

let keyboardEventsInitialized = false

export function initTableKeyboardController({
  state,
  deleteOrderCell,
  closeContextMenu,
  renderTable
}) {
  if (keyboardEventsInitialized) return

  document.addEventListener('keydown', (event) => {
    handleTableKeydown(event, {
      state,
      deleteOrderCell,
      closeContextMenu,
      renderTable
    })
  })

  keyboardEventsInitialized = true
}

function handleTableKeydown(
  event,
  { state, deleteOrderCell, closeContextMenu, renderTable }
) {
  if (isFormControlTarget(event.target)) return
  if (isModalOpen()) return

  const selectedCell = getSelectedProductCell(state)

  if (!selectedCell) return
  if (event.key !== 'Delete' && event.key !== 'Backspace') return

  event.preventDefault()

  const confirmed = confirmClearCell()

  if (!confirmed) return

  deleteOrderCell(selectedCell.rowId, selectedCell.productName)
  closeContextMenu()
  renderTable()
}

function isModalOpen() {
  const modal = document.getElementById('modal')

  return Boolean(modal && !modal.classList.contains('hidden'))
}
