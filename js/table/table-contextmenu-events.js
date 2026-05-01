import { state } from '../state.js'
import { closeContextMenu, openContextMenu } from './context-menu.js'

import { getProductCellFromEvent, getProductCellIdentity } from './table-event-targets.js'

import { selectProductCell } from './table-selection.js'

export function handleTableContextMenu(event) {
  const cell = getProductCellFromEvent(event)
  const identity = getProductCellIdentity(cell)

  if (!identity) return

  event.preventDefault()

  closeContextMenu()
  selectProductCell(state, identity.rowId, identity.productName)
  openContextMenu(event, identity.rowId, identity.productName)
}
