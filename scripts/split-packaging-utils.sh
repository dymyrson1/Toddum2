#!/usr/bin/env bash
set -e

WRITE_MODE=false

if [[ "$1" == "--write" ]]; then
  WRITE_MODE=true
fi

TIMESTAMP=$(date +"%Y-%m-%dT%H-%M-%S")

echo ""
echo "Split packaging-utils.js into smaller utility modules"
echo ""

FILES=(
  "js/products/packaging-utils.js"
  "js/products/packaging-id-utils.js"
  "js/products/packaging-create-utils.js"
  "js/products/packaging-normalize-utils.js"
  "js/products/packaging-format-utils.js"
)

echo "Planned changes:"
for file in "${FILES[@]}"; do
  echo "- update/create: $file"
done

if [[ "$WRITE_MODE" == false ]]; then
  echo ""
  echo "Dry run only. Apply with:"
  echo ""
  echo "  bash scripts/split-packaging-utils.sh --write"
  echo ""
  exit 0
fi

mkdir -p js/products

for file in "${FILES[@]}"; do
  if [[ -f "$file" ]]; then
    cp "$file" "$file.$TIMESTAMP.bak"
  fi
done

cat > js/products/packaging-utils.js <<'JS'
export {
  createPackagingId,
  normalizePackagingIdPart
} from './packaging-id-utils.js'

export {
  createDefaultPackagingOption,
  createPackagingOption,
  getDefaultPackagingOptionForProduct
} from './packaging-create-utils.js'

export {
  normalizePackagingOption,
  normalizePackagingOptions,
  parsePackagingOption
} from './packaging-normalize-utils.js'

export {
  formatCellForLog,
  formatPackagingLabel,
  formatWeightLabel
} from './packaging-format-utils.js'
JS

cat > js/products/packaging-id-utils.js <<'JS'
export function createPackagingId(packageName, weightKg) {
  const namePart = normalizePackagingIdPart(packageName)
  const weightPart = normalizePackagingIdPart(String(weightKg || 0))

  if (!namePart) return ''

  if (namePart === 'kg') return 'default_kg'
  if (namePart === 'l') return 'default_l'

  return `${namePart}__${weightPart}`
}

export function normalizePackagingIdPart(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(',', '.')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9._-]/g, '')
}
JS

cat > js/products/packaging-create-utils.js <<'JS'
import { createPackagingId } from './packaging-id-utils.js'
import { formatPackagingLabel } from './packaging-format-utils.js'
import { parseWeightKg } from './packaging-normalize-utils.js'

export function createDefaultPackagingOption(packageName = 'kg') {
  const cleanPackageName = String(packageName || 'kg').trim() || 'kg'
  const weightKg = cleanPackageName.toLowerCase() === 'l' ? 1 : 1

  return {
    id: createPackagingId(cleanPackageName, weightKg),
    packageName: cleanPackageName,
    weightKg,
    label: cleanPackageName,
    isDefault: true
  }
}

export function getDefaultPackagingOptionForProduct(productName) {
  const normalizedProductName = String(productName || '').trim().toLowerCase()

  if (normalizedProductName === 'melk') {
    return createDefaultPackagingOption('l')
  }

  return createDefaultPackagingOption('kg')
}

export function createPackagingOption(packageName, weightKgInput) {
  const cleanPackageName = String(packageName || '').trim()
  const weightKg = parseWeightKg(weightKgInput)

  if (!cleanPackageName) return null
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null

  return {
    id: createPackagingId(cleanPackageName, weightKg),
    packageName: cleanPackageName,
    weightKg,
    label: formatPackagingLabel(cleanPackageName, weightKg),
    isDefault: false
  }
}
JS

cat > js/products/packaging-normalize-utils.js <<'JS'
import { createPackagingId } from './packaging-id-utils.js'
import { formatPackagingLabel } from './packaging-format-utils.js'

export function parsePackagingOption(value) {
  if (!value) return null

  if (typeof value === 'string') {
    return parsePackagingString(value)
  }

  if (typeof value === 'object') {
    return normalizePackagingOption(value)
  }

  return null
}

export function normalizePackagingOption(option) {
  if (!option) return null

  if (typeof option === 'string') {
    return parsePackagingString(option)
  }

  const packageName = String(option.packageName || option.name || option.label || '').trim()
  const weightKg = parseWeightKg(option.weightKg ?? option.weight ?? option.kg ?? 1)
  const isDefault = Boolean(option.isDefault)

  if (!packageName) return null
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null

  return {
    id: option.id || createPackagingId(packageName, weightKg),
    packageName,
    weightKg,
    label: option.label || formatPackagingLabel(packageName, weightKg),
    isDefault
  }
}

export function normalizePackagingOptions(options = []) {
  const normalized = options
    .map(option => parsePackagingOption(option))
    .filter(Boolean)

  const result = []
  const usedIds = new Set()
  const defaultOption = normalized.find(option => option.isDefault)

  if (defaultOption) {
    result.push({
      ...defaultOption,
      isDefault: true
    })
    usedIds.add(defaultOption.id)
  }

  normalized.forEach(option => {
    if (usedIds.has(option.id)) return

    result.push({
      ...option,
      isDefault: Boolean(option.isDefault)
    })

    usedIds.add(option.id)
  })

  return result.sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1
    if (!a.isDefault && b.isDefault) return 1

    return Number(a.weightKg || 0) - Number(b.weightKg || 0)
  })
}

export function parseWeightKg(value) {
  if (typeof value === 'number') return value

  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(',', '.')

  if (!normalized) return 0

  const number = Number(normalized.replace(/[^0-9.]/g, ''))

  if (!Number.isFinite(number)) return 0

  if (normalized.includes('g') && !normalized.includes('kg')) {
    return number / 1000
  }

  return number
}

function parsePackagingString(value) {
  const cleanValue = String(value || '').trim()

  if (!cleanValue) return null

  const lower = cleanValue.toLowerCase()
  const weightKg = parseWeightKg(cleanValue) || 1
  const isDefault = lower === 'kg' || lower === 'l'

  return {
    id: createPackagingId(cleanValue, weightKg),
    packageName: cleanValue,
    weightKg,
    label: isDefault ? cleanValue : formatPackagingLabel(cleanValue, weightKg),
    isDefault
  }
}
JS

cat > js/products/packaging-format-utils.js <<'JS'
import { formatNumber } from '../utils/number.js'

export function formatPackagingLabel(packageName, weightKg) {
  const cleanPackageName = String(packageName || '').trim()

  if (!cleanPackageName) return ''

  const normalized = cleanPackageName.toLowerCase()

  if (normalized === 'kg' || normalized === 'l') {
    return cleanPackageName
  }

  return `${cleanPackageName} - ${formatWeightLabel(weightKg)}`
}

export function formatWeightLabel(weightKg) {
  const value = Number(weightKg)

  if (!Number.isFinite(value) || value <= 0) {
    return '—'
  }

  if (value < 1) {
    return `${formatNumber(value * 1000)} g`
  }

  return `${formatNumber(value)} kg`
}

export function formatCellForLog(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return ''
  }

  return items
    .map(item => {
      const qty = Number(item.qty) || 0
      const label = item.label || item.packageName || item.type || ''

      if (!qty || !label) return ''

      return `${formatNumber(qty)} ${label}`
    })
    .filter(Boolean)
    .join(', ')
}
JS

echo ""
echo "Done."
echo "Backups created with suffix: .$TIMESTAMP.bak"
