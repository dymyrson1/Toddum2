import { describe, expect, it } from 'vitest'

import {
  moveProductInList,
  normalizeProducts,
  productExists,
  removeProductFromWeeks
} from '../js/products/product-utils.js'

describe('product-utils', () => {
  it('normalizes product list', () => {
    expect(normalizeProducts([' Burrata ', '', null, 'Melk'])).toEqual([
      'Burrata',
      'Melk'
    ])
  })

  it('checks product existence', () => {
    expect(productExists(['Burrata', 'Melk'], 'Burrata')).toBe(true)
    expect(productExists(['Burrata', 'Melk'], 'Straciatella')).toBe(false)
  })

  it('moves product up', () => {
    const result = moveProductInList(['A', 'B', 'C'], 'B', 'up')

    expect(result.moved).toBe(true)
    expect(result.products).toEqual(['B', 'A', 'C'])
  })

  it('moves product down', () => {
    const result = moveProductInList(['A', 'B', 'C'], 'B', 'down')

    expect(result.moved).toBe(true)
    expect(result.products).toEqual(['A', 'C', 'B'])
  })

  it('does not move product outside list', () => {
    const result = moveProductInList(['A', 'B'], 'A', 'up')

    expect(result.moved).toBe(false)
    expect(result.products).toEqual(['A', 'B'])
  })

  it('removes product cells from weeks', () => {
    const weeks = {
      '2026-W18': {
        rows: [
          {
            cells: {
              Burrata: { items: [{ qty: 1 }] },
              Melk: { items: [{ qty: 2 }] }
            }
          }
        ]
      }
    }

    removeProductFromWeeks(weeks, 'Burrata')

    expect(weeks['2026-W18'].rows[0].cells.Burrata).toBeUndefined()
    expect(weeks['2026-W18'].rows[0].cells.Melk).toBeDefined()
  })
})
