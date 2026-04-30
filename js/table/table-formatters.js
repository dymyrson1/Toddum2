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

  return cellData.items.map(item => renderCellItem(item)).join('<br>')
}

export function renderCellItem(item) {
  const qty = Number(item.qty) || 0
  const label = item.label || item.packageName || item.type || '—'
  const packageName = String(item.packageName || '').toLowerCase()
  const labelLower = String(label).toLowerCase()

  if (packageName === 'kg' || labelLower === 'kg') {
    return `${escapeHtml(formatNumber(qty))}kg`
  }

  if (
    packageName === 'l' ||
    packageName === 'liter' ||
    packageName === 'literer' ||
    labelLower === 'l' ||
    labelLower === 'liter' ||
    labelLower === 'literer'
  ) {
    return `${escapeHtml(formatNumber(qty))}l`
  }

  if (packageName.includes('spann') || labelLower.includes('spann')) {
    return `${escapeHtml(formatNumber(qty))} spann`
  }

  return `${escapeHtml(formatNumber(qty))}x${escapeHtml(label)}`
}

export function formatNumber(value) {
  return Number(value).toLocaleString('nb-NO', {
    maximumFractionDigits: 2
  })
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}