import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  addProductAction,
  addProductPackagingOptionAction,
  getPackagingOptionsForProductFromState,
  getPackagingTypesForProductFromState,
  moveProductAction,
  removeProductAction,
  removeProductPackagingOptionAction
} from '../js/products/product-actions.js'

describe('product-actions', () => {
  beforeEach(() => {
    global.alert = vi.fn()
  })

  function createContext(overrides = {}) {
    return {
      state: {
        products: [],
        productPackagingTypes: {},
        weeks: {},
        ...overrides
      },
      addLog: vi.fn(),
      persistState: vi.fn()
    }
  }

  it('adds product with default packaging', () => {
    const context = createContext()

    const result = addProductAction(context, ' Burrata ')

    expect(result).toBe(true)
    expect(context.state.products).toEqual(['Burrata'])
    expect(context.state.productPackagingTypes.Burrata).toBeDefined()
    expect(context.persistState).toHaveBeenCalledTimes(1)
  })

  it('prevents duplicate product', () => {
    const context = createContext({
      products: ['Burrata']
    })

    const result = addProductAction(context, 'Burrata')

    expect(result).toBe(false)
    expect(global.alert).toHaveBeenCalled()
    expect(context.persistState).not.toHaveBeenCalled()
  })

  it('moves product down', () => {
    const context = createContext({
      products: ['A', 'B', 'C']
    })

    const result = moveProductAction(context, 'B', 'down')

    expect(result).toBe(true)
    expect(context.state.products).toEqual(['A', 'C', 'B'])
    expect(context.persistState).toHaveBeenCalledTimes(1)
  })

  it('removes product and its cells from weeks', () => {
    const context = createContext({
      products: ['Burrata', 'Melk'],
      productPackagingTypes: {
        Burrata: [],
        Melk: []
      },
      weeks: {
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
    })

    removeProductAction(context, 'Burrata')

    expect(context.state.products).toEqual(['Melk'])
    expect(context.state.productPackagingTypes.Burrata).toBeUndefined()
    expect(context.state.weeks['2026-W18'].rows[0].cells.Burrata).toBeUndefined()
    expect(context.state.weeks['2026-W18'].rows[0].cells.Melk).toBeDefined()
    expect(context.persistState).toHaveBeenCalledTimes(1)
  })

  it('returns packaging options for product', () => {
    const context = createContext({
      products: ['Burrata'],
      productPackagingTypes: {
        Burrata: [
          {
            id: 'spann__5',
            packageName: 'spann',
            weightKg: 5,
            label: 'spann - 5 kg',
            isDefault: false
          }
        ]
      }
    })

    const options = getPackagingOptionsForProductFromState(context.state, 'Burrata')

    expect(options.map((option) => option.label)).toEqual(['kg', 'spann - 5 kg'])
  })

  it('returns packaging type labels', () => {
    const context = createContext({
      productPackagingTypes: {
        Burrata: [
          {
            id: 'spann__5',
            packageName: 'spann',
            weightKg: 5,
            label: 'spann - 5 kg',
            isDefault: false
          }
        ]
      }
    })

    const labels = getPackagingTypesForProductFromState(context.state, 'Burrata')

    expect(labels).toEqual(['kg', 'spann - 5 kg'])
  })

  it('adds product packaging option', () => {
    const context = createContext({
      products: ['Burrata'],
      productPackagingTypes: {
        Burrata: []
      }
    })

    const result = addProductPackagingOptionAction(context, 'Burrata', 'spann', 5)

    expect(result).toBe(true)
    expect(context.state.productPackagingTypes.Burrata.length).toBe(2)
    expect(context.state.productPackagingTypes.Burrata[1].label).toBe('spann - 5 kg')
    expect(context.persistState).toHaveBeenCalledTimes(1)
  })

  it('removes packaging option from product and weeks', () => {
    const context = createContext({
      products: ['Burrata'],
      productPackagingTypes: {
        Burrata: [
          {
            id: 'spann__5',
            packageName: 'spann',
            weightKg: 5,
            label: 'spann - 5 kg',
            isDefault: false
          }
        ]
      },
      weeks: {
        '2026-W18': {
          rows: [
            {
              cells: {
                Burrata: {
                  items: [
                    {
                      packageId: 'spann__5',
                      packageName: 'spann',
                      weightKg: 5,
                      label: 'spann - 5 kg',
                      qty: 1
                    }
                  ]
                }
              }
            }
          ]
        }
      }
    })

    const result = removeProductPackagingOptionAction(context, 'Burrata', 'spann__5')

    expect(result).toBe(true)
    expect(context.state.productPackagingTypes.Burrata).toEqual([])
    expect(context.state.weeks['2026-W18'].rows[0].cells.Burrata).toBeUndefined()
    expect(context.persistState).toHaveBeenCalledTimes(1)
  })
})
