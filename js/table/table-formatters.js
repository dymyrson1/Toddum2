import { escapeHtml } from '../utils/html.js'
import { formatNumber } from '../utils/number.js'

export { escapeHtml }

export function getRowStatusClass(row) {
  const aChecked = Boolean(row.checks?.A)
  const bChecked = Boolean(row.checks?.B)

  if (aChecked && bChecked) return 'row-status-both'
  if (aChecked) return 'row-status-a'
  if (bChecked) return 'row-status-b'

  return ''
}

export function renderCellItems(cellData) {
  if (!cellData || !Array.isArray(cellData.items) || cellData.items.length === 0) {
    return '<span class="cell-empty">—</span>'
  }

  return cellData.items.map((item) => renderCellItem(item)).join('<br>')
}

export function renderCellItem(item) {
  const qty = Number(item.qty) || 0
  const packageName = getPackageDisplayName(item)
  const packageNameLower = packageName.toLowerCase()

  if (!packageName) {
    return escapeHtml(formatNumber(qty))
  }

  if (
    packageNameLower === 'kg' ||
    packageNameLower === 'l' ||
    packageNameLower === 'liter' ||
    packageNameLower === 'literer'
  ) {
    return `${escapeHtml(formatNumber(qty))}${escapeHtml(packageName)}`
  }

  if (packageNameLower.includes('spann')) {
    return `${escapeHtml(formatNumber(qty))} spann`
  }

  return `${escapeHtml(formatNumber(qty))}x${escapeHtml(packageName)}`
}

function getPackageDisplayName(item) {
  const packageName = String(item?.packageName || '').trim()

  if (packageName) {
    return packageName
  }

  const label = String(item?.label || item?.type || '').trim()

  if (!label) {
    return ''
  }

  return label.split(' - ')[0].trim()
}
