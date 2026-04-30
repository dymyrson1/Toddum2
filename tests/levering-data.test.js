import { describe, expect, it } from 'vitest'

import {
  buildLeveringData,
  findCustomerForRow,
  formatDeliveryItem,
  getDeliveryItems,
  getDeliveryOrder,
  getVisibleDeliveryGroups,
  hasOrderContent
} from '../js/levering/levering-data.js'

describe('levering-data', () => {
  const customers = [
    {
      name: 'Kunde B',
      address: 'Gate 2',
      phone: '222',
      contactPerson: 'Ola',
      deliveryOrder: 2
    },
    {
      name: 'Kunde A',
      address: 'Gate 1',
      phone: '111',
      contactPerson: 'Kari',
      deliveryOrder: 1
    }
  ]

  const deliveryDays = ['Mandag', 'Tirsdag']

  it('finds customer by normalized row name', () => {
    const customer = findCustomerForRow(customers, ' kunde a ')

    expect(customer.name).toBe('Kunde A')
  })

  it('returns delivery order or null', () => {
    expect(getDeliveryOrder({ deliveryOrder: 3 })).toBe(3)
    expect(getDeliveryOrder({ deliveryOrder: 0 })).toBeNull()
    expect(getDeliveryOrder(null)).toBeNull()
  })

  it('detects order content', () => {
    expect(
      hasOrderContent({
        cells: {
          Burrata: {
            items: [{ qty: 1 }]
          }
        }
      })
    ).toBe(true)

    expect(
      hasOrderContent({
        cells: {}
      })
    ).toBe(false)
  })

  it('formats delivery item', () => {
    expect(formatDeliveryItem({ qty: 2, packageName: 'kg', label: 'kg' })).toBe('2kg')

    expect(formatDeliveryItem({ qty: 3, packageName: 'l', label: 'l' })).toBe('3l')

    expect(
      formatDeliveryItem({
        qty: 1,
        packageName: 'spann',
        label: 'spann - 5 kg'
      })
    ).toBe('1 spann')
  })

  it('gets delivery items from row', () => {
    const items = getDeliveryItems({
      cells: {
        Burrata: {
          items: [
            {
              qty: 2,
              packageName: 'kg',
              label: 'kg'
            }
          ]
        }
      }
    })

    expect(items).toEqual([
      {
        productName: 'Burrata',
        itemText: '2kg'
      }
    ])
  })

  it('builds delivery data sorted by delivery order and grouped by day', () => {
    const data = buildLeveringData({
      customers,
      deliveryDays,
      rows: [
        {
          id: 'row_b',
          customerName: 'Kunde B',
          deliveryDay: 'Tirsdag',
          checks: {
            A: true,
            B: false
          },
          cells: {
            Burrata: {
              items: [{ qty: 1, packageName: 'kg', label: 'kg' }]
            }
          }
        },
        {
          id: 'row_a',
          customerName: 'Kunde A',
          deliveryDay: 'Mandag',
          checks: {
            A: true,
            B: true
          },
          cells: {
            Melk: {
              items: [{ qty: 2, packageName: 'l', label: 'l' }]
            }
          }
        }
      ]
    })

    expect(data.deliveries.map((delivery) => delivery.customerName)).toEqual([
      'Kunde A',
      'Kunde B'
    ])

    expect(data.groups.map((group) => group.day)).toEqual(['Mandag', 'Tirsdag'])
    expect(data.groups[0].deliveries[0].customerName).toBe('Kunde A')
  })

  it('filters visible groups', () => {
    const groups = [
      {
        day: 'Mandag',
        deliveries: []
      },
      {
        day: 'Tirsdag',
        deliveries: []
      }
    ]

    expect(getVisibleDeliveryGroups(groups, 'Alle').length).toBe(2)
    expect(getVisibleDeliveryGroups(groups, 'Mandag')).toEqual([groups[0]])
  })
})
