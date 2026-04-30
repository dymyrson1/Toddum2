import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  addCustomerAction,
  ensureCustomerExistsAction,
  moveCustomerAction,
  removeCustomerAction,
  updateCustomerAction
} from '../js/customers/customer-actions.js'

describe('customer-actions', () => {
  beforeEach(() => {
    global.alert = vi.fn()
  })

  function createContext(customers = []) {
    return {
      state: {
        customers
      },
      addLog: vi.fn(),
      persistState: vi.fn()
    }
  }

  it('ensures customer exists by creating missing customer', () => {
    const context = createContext([])

    const customer = ensureCustomerExistsAction(context, ' Kunde A ')

    expect(customer.name).toBe('Kunde A')
    expect(context.state.customers.length).toBe(1)
    expect(context.state.customers[0].deliveryOrder).toBe(1)
    expect(context.addLog).toHaveBeenCalledWith('add_customer', {
      actionLabel: 'La til kunde automatisk',
      customerName: 'Kunde A',
      newValue: 'Kunde A'
    })
  })

  it('returns existing customer without creating duplicate', () => {
    const context = createContext([
      {
        id: 'customer_kundea',
        name: 'Kunde A',
        deliveryOrder: 1
      }
    ])

    const customer = ensureCustomerExistsAction(context, 'Kunde A')

    expect(customer.name).toBe('Kunde A')
    expect(context.state.customers.length).toBe(1)
    expect(context.addLog).not.toHaveBeenCalled()
  })

  it('adds customer and persists state', () => {
    const context = createContext([])

    const result = addCustomerAction(context, {
      name: 'Kunde A',
      phone: '123'
    })

    expect(result).toBe(true)
    expect(context.state.customers.length).toBe(1)
    expect(context.state.customers[0].name).toBe('Kunde A')
    expect(context.persistState).toHaveBeenCalledTimes(1)
  })

  it('prevents duplicate customer', () => {
    const context = createContext([
      {
        id: 'customer_kundea',
        name: 'Kunde A',
        deliveryOrder: 1
      }
    ])

    const result = addCustomerAction(context, {
      name: 'Kunde A'
    })

    expect(result).toBe(false)
    expect(global.alert).toHaveBeenCalled()
    expect(context.persistState).not.toHaveBeenCalled()
  })

  it('updates customer', () => {
    const context = createContext([
      {
        id: 'customer_kundea',
        name: 'Kunde A',
        contactPerson: '',
        phone: '',
        address: '',
        deliveryOrder: 1
      }
    ])

    const result = updateCustomerAction(context, 'customer_kundea', {
      phone: '999',
      address: 'Gate 1'
    })

    expect(result).toBe(true)
    expect(context.state.customers[0].phone).toBe('999')
    expect(context.state.customers[0].address).toBe('Gate 1')
    expect(context.persistState).toHaveBeenCalledTimes(1)
  })

  it('moves customer down', () => {
    const context = createContext([
      {
        id: 'customer_a',
        name: 'A',
        deliveryOrder: 1
      },
      {
        id: 'customer_b',
        name: 'B',
        deliveryOrder: 2
      }
    ])

    const result = moveCustomerAction(context, 'customer_a', 'down')

    expect(result).toBe(true)
    expect(context.state.customers.map((customer) => customer.name)).toEqual(['B', 'A'])
    expect(context.state.customers.map((customer) => customer.deliveryOrder)).toEqual([
      1, 2
    ])
    expect(context.persistState).toHaveBeenCalledTimes(1)
  })

  it('removes customer', () => {
    const context = createContext([
      {
        id: 'customer_a',
        name: 'A',
        deliveryOrder: 1
      }
    ])

    const result = removeCustomerAction(context, 'customer_a')

    expect(result).toBe(true)
    expect(context.state.customers).toEqual([])
    expect(context.persistState).toHaveBeenCalledTimes(1)
  })
})
