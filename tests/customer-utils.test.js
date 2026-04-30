import { describe, expect, it } from 'vitest'

import {
  createCustomerId,
  formatCustomerForLog,
  normalizeCustomer,
  normalizeCustomerPatch,
  normalizeCustomers
} from '../js/customers/customer-utils.js'

describe('customer-utils', () => {
  it('normalizes string customer', () => {
    const customer = normalizeCustomer(' Test Kunde ')

    expect(customer.name).toBe('Test Kunde')
    expect(customer.id).toBe('customer_testkunde')
    expect(customer.deliveryOrder).toBe(0)
  })

  it('normalizes customer object', () => {
    const customer = normalizeCustomer({
      name: ' Kunde A ',
      contactPerson: ' Ola ',
      phone: ' 123 ',
      address: ' Gate 1 ',
      deliveryOrder: '2'
    })

    expect(customer.name).toBe('Kunde A')
    expect(customer.contactPerson).toBe('Ola')
    expect(customer.phone).toBe('123')
    expect(customer.address).toBe('Gate 1')
    expect(customer.deliveryOrder).toBe(2)
  })

  it('normalizes customer list and resets delivery order', () => {
    const customers = normalizeCustomers([
      { name: 'B', deliveryOrder: 2 },
      { name: 'A', deliveryOrder: 1 }
    ])

    expect(customers.map(customer => customer.name)).toEqual(['A', 'B'])
    expect(customers.map(customer => customer.deliveryOrder)).toEqual([1, 2])
  })

  it('normalizes customer patch', () => {
    const patch = normalizeCustomerPatch({
      name: ' New Name ',
      phone: ' 999 ',
      deliveryOrder: '3'
    })

    expect(patch).toEqual({
      name: 'New Name',
      phone: '999',
      deliveryOrder: 3
    })
  })

  it('creates stable customer id', () => {
    expect(createCustomerId('Test Kunde')).toBe('customer_testkunde')
  })

  it('formats customer for log', () => {
    const value = formatCustomerForLog({
      name: 'Kunde A',
      contactPerson: 'Ola',
      phone: '123',
      address: 'Gate 1',
      deliveryOrder: 4
    })

    expect(value).toBe('Kunde A / Ola / 123 / Gate 1 / Nr. 4')
  })
})