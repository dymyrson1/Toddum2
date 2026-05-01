#!/usr/bin/env bash
set -e

WRITE_MODE=false

if [[ "$1" == "--write" ]]; then
  WRITE_MODE=true
fi

TIMESTAMP=$(date +"%Y-%m-%dT%H-%M-%S")

echo ""
echo "Split rapport-render.js into smaller render modules"
echo ""

FILES=(
  "js/rapport/rapport-render.js"
  "js/rapport/rapport-formatters.js"
  "js/rapport/rapport-header-render.js"
  "js/rapport/rapport-summary-render.js"
  "js/rapport/rapport-detail-render.js"
)

echo "Planned changes:"
for file in "${FILES[@]}"; do
  echo "- update/create: $file"
done

if [[ "$WRITE_MODE" == false ]]; then
  echo ""
  echo "Dry run only. Apply with:"
  echo ""
  echo "  bash scripts/split-rapport-render.sh --write"
  echo ""
  exit 0
fi

mkdir -p js/rapport

for file in "${FILES[@]}"; do
  if [[ -f "$file" ]]; then
    cp "$file" "$file.$TIMESTAMP.bak"
  fi
done

cat > js/rapport/rapport-render.js <<'JS'
import { renderRapportDetailTable } from './rapport-detail-render.js'
import { renderRapportHeader, renderRapportKpis } from './rapport-header-render.js'
import { renderRapportMain } from './rapport-summary-render.js'

export function renderRapportLayout(report) {
  return `
    <section id="rapportTab" class="tab-panel rapport-view">
      ${renderRapportHeader(report)}
      ${renderRapportKpis(report)}
      ${renderRapportMain(report)}
      ${renderRapportDetailTable(report)}
    </section>
  `
}
JS

cat > js/rapport/rapport-formatters.js <<'JS'
import { escapeHtml } from '../utils/html.js'
import { formatNumber } from '../utils/number.js'

export function formatKg(value) {
  return `${formatNumber(value)} kg`
}

export function formatPackageShort(packageRow) {
  const qty = formatNumber(packageRow.qty)
  const packageName = String(packageRow.packageName || '').toLowerCase()
  const label = String(packageRow.label || packageRow.packageName || '')

  if (packageName === 'kg' || label.toLowerCase() === 'kg') {
    return `${qty}kg`
  }

  if (packageName === 'l' || label.toLowerCase() === 'l') {
    return `${qty}l`
  }

  if (packageName.includes('spann') || label.toLowerCase().includes('spann')) {
    return `${qty} spann`
  }

  return `${qty}×${escapeHtml(label)}`
}

export function formatPackageLabel(packageRow) {
  const packageName = String(packageRow.packageName || '').toLowerCase()
  const label = packageRow.label || packageRow.packageName

  if (packageName.includes('spann')) {
    return `spann - ${formatNumber(packageRow.weightKg)} kg`
  }

  return label
}

export function formatPackageQty(packageRow) {
  const qty = formatNumber(packageRow.qty)
  const packageName = String(packageRow.packageName || '').toLowerCase()
  const label = String(packageRow.label || '').toLowerCase()

  if (packageName === 'kg' || label === 'kg') {
    return `${qty} kg`
  }

  if (packageName === 'l' || label === 'l') {
    return `${qty} l`
  }

  if (packageName.includes('spann') || label.includes('spann')) {
    return `${qty} spann`
  }

  return `${qty} stk`
}

export function formatUnitWeight(packageRow) {
  const packageName = String(packageRow.packageName || '').toLowerCase()
  const label = String(packageRow.label || '').toLowerCase()

  if (packageName === 'l' || label === 'l') {
    return `${formatNumber(packageRow.weightKg)} l`
  }

  if (packageRow.weightKg < 1) {
    return `${formatNumber(packageRow.weightKg * 1000)} g`
  }

  return `${formatNumber(packageRow.weightKg)} kg`
}
JS

cat > js/rapport/rapport-header-render.js <<'JS'
import { escapeHtml } from '../utils/html.js'
import { formatKg } from './rapport-formatters.js'

export function renderRapportHeader(report) {
  return `
    <div class="rapport-hero">
      <div>
        <h2>Produksjonsrapport</h2>
        <p>${escapeHtml(report.weekLabel)}</p>
      </div>

      <div class="rapport-main-number">
        <span>Total vekt</span>
        <strong>${formatKg(report.totalWeightKg)}</strong>
      </div>
    </div>
  `
}

export function renderRapportKpis(report) {
  return `
    <div class="rapport-kpi-grid">
      ${renderKpiCard('Produkter', report.productCount)}
      ${renderKpiCard('Emballasjelinjer', report.packageLineCount)}
      ${renderKpiCard('Total vekt', formatKg(report.totalWeightKg))}
    </div>
  `
}

function renderKpiCard(label, value) {
  return `
    <div class="rapport-kpi-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `
}
JS

cat > js/rapport/rapport-summary-render.js <<'JS'
import { escapeHtml } from '../utils/html.js'

import {
  formatKg,
  formatPackageShort
} from './rapport-formatters.js'

export function renderRapportMain(report) {
  if (report.products.length === 0) {
    return `
      <section class="rapport-card">
        <div class="rapport-empty">
          Ingen produksjonsdata for denne uken.
        </div>
      </section>
    `
  }

  return `
    <div class="rapport-layout">
      <section class="rapport-card">
        <div class="rapport-card-header">
          <h3>Produksjonsliste</h3>
          <span>Kort oversikt for produksjon</span>
        </div>

        <div class="rapport-production-list">
          ${report.products.map(renderProductionItem).join('')}
        </div>
      </section>

      <section class="rapport-card">
        <div class="rapport-card-header">
          <h3>Sum per produkt</h3>
          <span>Sortert etter total vekt</span>
        </div>

        <div class="rapport-table-wrap">
          <table class="rapport-table">
            <thead>
              <tr>
                <th>Produkt</th>
                <th>Linjer</th>
                <th>Total vekt</th>
              </tr>
            </thead>

            <tbody>
              ${report.sortedByWeight.map(renderProductSummaryRow).join('')}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `
}

function renderProductionItem(product) {
  return `
    <article class="rapport-production-item">
      <div>
        <strong>${escapeHtml(product.productName)}</strong>
        <span>${formatKg(product.totalWeightKg)}</span>
      </div>

      <p>${product.packageRows.map(formatPackageShort).join(', ')}</p>
    </article>
  `
}

function renderProductSummaryRow(product) {
  return `
    <tr>
      <td>${escapeHtml(product.productName)}</td>
      <td>${product.packageRows.length}</td>
      <td>${formatKg(product.totalWeightKg)}</td>
    </tr>
  `
}
JS

cat > js/rapport/rapport-detail-render.js <<'JS'
import { escapeHtml } from '../utils/html.js'

import {
  formatKg,
  formatPackageLabel,
  formatPackageQty,
  formatUnitWeight
} from './rapport-formatters.js'

export function renderRapportDetailTable(report) {
  if (report.products.length === 0) return ''

  return `
    <section class="rapport-card rapport-card-wide">
      <div class="rapport-card-header">
        <h3>Detaljert oversikt</h3>
        <span>Alle emballasjer per produkt</span>
      </div>

      <div class="rapport-table-wrap">
        <table class="rapport-table">
          <thead>
            <tr>
              <th>Produkt</th>
              <th>Emballasje</th>
              <th>Antall</th>
              <th>Enhetsvekt</th>
              <th>Total vekt</th>
            </tr>
          </thead>

          <tbody>
            ${report.products.map(renderProductDetailRows).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `
}

function renderProductDetailRows(product) {
  const packageRows = product.packageRows
    .map((packageRow, index) => {
      return `
        <tr>
          <td>${index === 0 ? escapeHtml(product.productName) : ''}</td>
          <td>${escapeHtml(formatPackageLabel(packageRow))}</td>
          <td>${escapeHtml(formatPackageQty(packageRow))}</td>
          <td>${escapeHtml(formatUnitWeight(packageRow))}</td>
          <td>${formatKg(packageRow.totalWeightKg)}</td>
        </tr>
      `
    })
    .join('')

  return `
    ${packageRows}
    <tr class="rapport-total-row">
      <td colspan="4">Sum ${escapeHtml(product.productName)}</td>
      <td>${formatKg(product.totalWeightKg)}</td>
    </tr>
  `
}
JS

echo ""
echo "Done."
echo "Backups created with suffix: .$TIMESTAMP.bak"
