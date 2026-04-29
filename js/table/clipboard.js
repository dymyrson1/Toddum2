import { getCurrentCells } from '../state.js'
import { renderTable } from './table-render.js'

let copiedCellData = null

export function copyCell(key) {
  const cells = getCurrentCells()
  const data = cells[key]

  if (!data || !data.items || data.items.length === 0) {
    copiedCellData = null
    safeWriteClipboard('')
    return
  }

  copiedCellData = cloneData(data)

  const text = data.items
    .map(item => `${item.type}: ${item.qty}`)
    .join('\n')

  safeWriteClipboard(text)
}

export function pasteCell(targetKey) {
  if (!copiedCellData) return

  const cells = getCurrentCells()
  cells[targetKey] = cloneData(copiedCellData)

  renderTable()
}

export function hasCopiedCell() {
  return copiedCellData !== null
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