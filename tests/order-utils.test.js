import { describe, expect, it } from 'vitest'

import {
  createEmptyOrderRow,
  createMigratedOrderRow,
  normalizeOrderRow,
  normalizeOrderRows,
  normalizeRowChecks
} from '../js/orders/order-utils.js'

describe('order-utils', () => {
  it('creates empty order row', () => {
    const row = createEmptyOrderRow()

    expect(row.id).toMatch(/^row_/)
    expect(row.customerName).toBe('')
    expect(row.deliveryDay).toBe('')
    expect(row.merknad).toBe('')
    expect(row.cells).toEqual({})
    expect(row.checks).toEqual({
      A: false,
      B: false
    })
  })

  it('creates migrated order row', () => {
    const row = createMigratedOrderRow('Kunde A')

    expect(row.id).toMatch(/^row_/)
    expect(row.customerName).toBe('Kunde A')
  })

  it('normalizes row checks', () => {
    expect(normalizeRowChecks({ A: 1, B: 0 })).toEqual({
      A: true,
      B: false
    })
  })

  it('normalizes order row', () => {
    const row = normalizeOrderRow(
      {
        customerName: 'Kunde A',
        checks: { A: true }
      },
      (cells) => cells
    )

    expect(row.id).toMatch(/^row_/)
    expect(row.customerName).toBe('Kunde A')
    expect(row.checks).toEqual({
      A: true,
      B: false
    })
  })

  it('normalizes order rows list', () => {
    const rows = normalizeOrderRows(
      [{ customerName: 'A' }, { customerName: 'B' }],
      (cells) => cells
    )

    expect(rows.length).toBe(2)
    expect(rows[0].customerName).toBe('A')
    expect(rows[1].customerName).toBe('B')
  })
})
