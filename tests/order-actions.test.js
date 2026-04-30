import { describe, expect, it, vi } from 'vitest'

import {
  addOrderRowAction,
  deleteOrderCellAction,
  deleteOrderRowAction,
  findOrderRowAction,
  getOrderCellAction,
  updateOrderCellAction,
  updateOrderRowFieldAction,
  updateRowCheckAction
} from '../js/orders/order-actions.js'

const packagingOptions = [
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

describe('order-actions', () => {
  function createContext(rows = []) {
    return {
      state: {
        selectedCell: null
      },
      getCurrentRows: () => rows,
      getPackagingOptionsForProduct: () => packagingOptions,
      ensureCustomerExists: vi.fn(),
      addLog: vi.fn(),
      persistState: vi.fn()
    }
  }

  it('adds order row', () => {
    const rows = []
    const context = createContext(rows)

    const row = addOrderRowAction(context)

    expect(row.id).toMatch(/^row_/)
    expect(rows.length).toBe(1)
    expect(context.addLog).toHaveBeenCalledWith('add_row', {
      actionLabel: 'La til rad'
    })
    expect(context.persistState).toHaveBeenCalledTimes(1)
  })

  it('deletes order row', () => {
    const rows = [
      {
        id: 'row_1',
        customerName: 'Kunde A',
        deliveryDay: 'Mandag'
      }
    ]

    const context = createContext(rows)
    context.state.selectedCell = {
      rowId: 'row_1',
      productName: 'Burrata'
    }

    deleteOrderRowAction(context, 'row_1')

    expect(rows).toEqual([])
    expect(context.state.selectedCell).toBeNull()
    expect(context.persistState).toHaveBeenCalledTimes(1)
  })

  it('updates customerName and ensures customer exists', () => {
    const rows = [
      {
        id: 'row_1',
        customerName: '',
        deliveryDay: ''
      }
    ]

    const context = createContext(rows)

    updateOrderRowFieldAction(context, 'row_1', 'customerName', 'Kunde A')

    expect(rows[0].customerName).toBe('Kunde A')
    expect(context.ensureCustomerExists).toHaveBeenCalledWith('Kunde A')
    expect(context.persistState).toHaveBeenCalledTimes(1)
  })

  it('updates row check', () => {
    const rows = [
      {
        id: 'row_1',
        customerName: 'Kunde A',
        deliveryDay: '',
        checks: {
          A: false,
          B: false
        }
      }
    ]

    const context = createContext(rows)

    updateRowCheckAction(context, 'row_1', 'A', true)

    expect(rows[0].checks.A).toBe(true)
    expect(context.persistState).toHaveBeenCalledTimes(1)
  })

  it('updates order cell', () => {
    const rows = [
      {
        id: 'row_1',
        customerName: 'Kunde A',
        deliveryDay: '',
        cells: {}
      }
    ]

    const context = createContext(rows)

    updateOrderCellAction(context, 'row_1', 'Burrata', {
      items: [
        {
          packageId: 'default_kg',
          qty: 2
        }
      ]
    })

    expect(rows[0].cells.Burrata.items[0]).toEqual({
      packageId: 'default_kg',
      packageName: 'kg',
      weightKg: 1,
      label: 'kg',
      qty: 2
    })
    expect(context.persistState).toHaveBeenCalledTimes(1)
  })

  it('deletes order cell', () => {
    const rows = [
      {
        id: 'row_1',
        customerName: 'Kunde A',
        deliveryDay: '',
        cells: {
          Burrata: {
            items: [
              {
                packageId: 'default_kg',
                packageName: 'kg',
                weightKg: 1,
                label: 'kg',
                qty: 2
              }
            ]
          }
        }
      }
    ]

    const context = createContext(rows)

    deleteOrderCellAction(context, 'row_1', 'Burrata')

    expect(rows[0].cells.Burrata).toBeUndefined()
    expect(context.persistState).toHaveBeenCalledTimes(1)
  })

  it('finds order row', () => {
    const rows = [
      {
        id: 'row_1',
        customerName: 'Kunde A'
      }
    ]

    const context = createContext(rows)

    const row = findOrderRowAction(context, 'row_1')

    expect(row.customerName).toBe('Kunde A')
  })

  it('gets normalized order cell', () => {
    const rows = [
      {
        id: 'row_1',
        cells: {
          Burrata: {
            items: [
              {
                packageId: 'default_kg',
                qty: 3
              }
            ]
          }
        }
      }
    ]

    const context = createContext(rows)

    const cell = getOrderCellAction(context, 'row_1', 'Burrata')

    expect(cell.items[0].qty).toBe(3)
    expect(cell.items[0].packageName).toBe('kg')
  })
})
