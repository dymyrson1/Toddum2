import { describe, expect, it } from 'vitest'

import {
  normalizeOrderCellItem,
  normalizeOrderCellItems,
  normalizeOrderCells
} from '../js/orders/order-cell-utils.js'

const options = [
  {
    id: 'default_kg',
    packageName: 'kg',
    weightKg: 1,
    label: 'kg',
    isDefault: true
  },
  {
    id: 'spann__5',
    packageName: 'spann',
    weightKg: 5,
    label: 'spann - 5 kg',
    isDefault: false
  }
]

describe('order-cell-utils', () => {
  it('normalizes single order cell item by package id', () => {
    const item = normalizeOrderCellItem(
      {
        packageId: 'default_kg',
        qty: '2'
      },
      options
    )

    expect(item).toEqual({
      packageId: 'default_kg',
      packageName: 'kg',
      weightKg: 1,
      label: 'kg',
      qty: 2
    })
  })

  it('drops invalid quantity', () => {
    const item = normalizeOrderCellItem(
      {
        packageId: 'default_kg',
        qty: '0'
      },
      options
    )

    expect(item).toBeNull()
  })

  it('removes duplicated package ids', () => {
    const items = normalizeOrderCellItems(
      [
        { packageId: 'default_kg', qty: 1 },
        { packageId: 'default_kg', qty: 2 }
      ],
      options
    )

    expect(items.length).toBe(1)
    expect(items[0].qty).toBe(1)
  })

  it('normalizes order cells object', () => {
    const cells = normalizeOrderCells(
      {
        Burrata: {
          items: [{ packageId: 'default_kg', qty: 3 }]
        }
      },
      () => options
    )

    expect(cells.Burrata.items[0].qty).toBe(3)
    expect(cells.Burrata.items[0].packageName).toBe('kg')
  })
})