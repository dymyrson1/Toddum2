import { getOrderCell, updateOrderCell } from '../state.js'
import { renderTable } from './table-render.js'
import { formatNumber } from '../utils/number.js'

let copiedCellData = null

export function copyCell(rowId, productName) {
  const data = getOrderCell(rowId, productName)

  if (!data || !Array.isArray(data.items) || data.items.length === 0) {
    copiedCellData = null
    safeWriteClipboard('')
    return
  }

  copiedCellData = cloneData(data)

  const text = data.items.map((item) => formatClipboardItem(item)).join('\n')

  safeWriteClipboard(text)
}

export function pasteCell(targetRowId, targetProductName) {
  if (!copiedCellData) return

  updateOrderCell(targetRowId, targetProductName, cloneData(copiedCellData))

  renderTable()
}

export function hasCopiedCell() {
  return copiedCellData !== null
}

function formatClipboardItem(item) {
  const qty = formatNumber(item.qty)
  const label = item.label || item.packageName || item.type || ''

  if (!label) return qty

  return `${qty} ${label}`
}

function cloneData(data) {
  if (typeof structuredClone === 'function') {
    return structuredClone(data)
  }

  return JSON.parse(JSON.stringify(data))
}

function safeWriteClipboard(text) {
  if (!navigator.clipboard) return

  navigator.clipboard.writeText(text).catch(() => {
    console.warn('Clipboard write failed')
  })
}
