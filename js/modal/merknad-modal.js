import { findOrderRow, updateOrderRowField } from '../state.js'
import { renderTable } from '../table/table-render.js'
import { closeModal, escapeHtml, openModalContainer } from './modal-utils.js'

export function openMerknadModal(rowId) {
  const row = findOrderRow(rowId)

  if (!row) return

  const modal = openModalContainer()

  if (!modal) return

  modal.innerHTML = `
    <div class="modal-content merknad-modal-content">
      <div class="modal-header">
        <div>
          <h3>Merknad</h3>
          <div class="modal-cell-key">
            ${escapeHtml(row.customerName || 'Uten kunde')}
          </div>
        </div>

        <button id="closeMerknadModal" class="modal-close" type="button">
          ×
        </button>
      </div>

      <textarea
        id="merknadTextarea"
        class="merknad-textarea"
        placeholder="Skriv merknad..."
      >${escapeHtml(row.merknad || '')}</textarea>

      <div class="modal-actions">
        <button id="cancelMerknadBtn" class="secondary-btn" type="button">
          Avbryt
        </button>

        <button id="saveMerknadBtn" class="primary-btn" type="button">
          Lagre
        </button>
      </div>
    </div>
  `

  attachMerknadModalEvents(modal, rowId)
}

function attachMerknadModalEvents(modal, rowId) {
  const textarea = modal.querySelector('#merknadTextarea')
  const closeButton = modal.querySelector('#closeMerknadModal')
  const cancelButton = modal.querySelector('#cancelMerknadBtn')
  const saveButton = modal.querySelector('#saveMerknadBtn')

  if (textarea) {
    textarea.focus()
    textarea.setSelectionRange(textarea.value.length, textarea.value.length)
  }

  if (closeButton) closeButton.onclick = closeModal
  if (cancelButton) cancelButton.onclick = closeModal

  if (saveButton) {
    saveButton.onclick = () => {
      updateOrderRowField(rowId, 'merknad', textarea?.value.trim() || '')

      closeModal()
      renderTable()
    }
  }
}
