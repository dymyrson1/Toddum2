import { updateOrderRowField, updateRowCheck } from '../state.js'

import { closeContextMenu } from './context-menu.js'
import { renderTable } from './table-render.js'

import {
  getCheckboxFromEvent,
  getCheckboxIdentity,
  getRowFieldFromEvent,
  getRowFieldIdentity
} from './table-event-targets.js'

import { confirmCheckboxChange } from './table-confirmation.js'

export function handleTableChange(event) {
  if (handleRowFieldChange(event)) return
  if (handleCheckboxChange(event)) return
}

export function handleRowFieldChange(event) {
  const field = getRowFieldFromEvent(event)
  const identity = getRowFieldIdentity(field)

  if (!identity) return false

  closeContextMenu()

  updateOrderRowField(identity.rowId, identity.rowField, identity.value)

  renderTable()

  return true
}

export function handleCheckboxChange(event) {
  const checkbox = getCheckboxFromEvent(event)
  const identity = getCheckboxIdentity(checkbox)

  if (!identity) return false

  closeContextMenu()

  const confirmed = confirmCheckboxChange()

  if (!confirmed) {
    checkbox.checked = !checkbox.checked
    return true
  }

  updateRowCheck(identity.rowId, identity.rowCheck, identity.checked)

  renderTable()

  return true
}
