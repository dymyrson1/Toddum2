import { describe, expect, it } from 'vitest'

import {
  buildAnalyticsData,
  getPercent,
  hasOrderContent
} from '../js/analytics/analytics-data.js'

describe('analytics-data', () => {
  const products = ['Burrata', 'Melk']
  const deliveryDays = ['Mandag', 'Tirsdag', 'Onsdag']

  it('detects rows with order content', () => {
    const row = {
      cells: {
        Burrata: {
          items: [{ qty: 1 }]
        }
      }
    }

    expect(hasOrderContent(row, products)).toBe(true)
  })

  it('returns false for rows without order content', () => {
    const row = {
      cells: {}
    }

    expect(hasOrderContent(row, products)).toBe(false)
  })

  it('calculates analytics totals', () => {
    const data = buildAnalyticsData({
      weekLabel: 'Uke 18',
      products,
      deliveryDays,
      rows: [
        {
          id: 'row_1',
          customerName: 'Kunde A',
          deliveryDay: 'Mandag',
          checks: {
            A: true,
            B: false
          },
          cells: {
            Burrata: {
              items: [
                {
                  packageId: 'default_kg',
                  packageName: 'kg',
                  weightKg: 1,
                  label: 'kg',
                  qty: 2
                },
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
        },
        {
          id: 'row_2',
          customerName: '',
          deliveryDay: '',
          checks: {
            A: false,
            B: false
          },
          cells: {
            Melk: {
              items: [
                {
                  packageId: 'default_l',
                  packageName: 'l',
                  weightKg: 1,
                  label: 'l',
                  qty: 3
                }
              ]
            }
          }
        },
        {
          id: 'row_empty',
          customerName: 'Kunde C',
          deliveryDay: 'Tirsdag',
          checks: {
            A: false,
            B: false
          },
          cells: {}
        }
      ]
    })

    expect(data.weekLabel).toBe('Uke 18')
    expect(data.totalRows).toBe(3)
    expect(data.orderRowsCount).toBe(2)
    expect(data.orderLineCount).toBe(3)
    expect(data.totalWeightKg).toBe(10)
    expect(data.packedCount).toBe(1)
    expect(data.deliveredCount).toBe(0)
    expect(data.notPackedCount).toBe(1)
    expect(data.notDeliveredCount).toBe(2)

    expect(data.customerList[0].customerName).toBe('Kunde A')
    expect(data.customerList[0].totalWeightKg).toBe(7)

    expect(data.productList[0].productName).toBe('Burrata')
    expect(data.productList[0].totalWeightKg).toBe(7)

    expect(data.problems.missingCustomer.length).toBe(1)
    expect(data.problems.missingDeliveryDay.length).toBe(1)
    expect(data.problems.packedNotDelivered.length).toBe(1)
  })

  it('calculates percent safely', () => {
    expect(getPercent(1, 2)).toBe(50)
    expect(getPercent(0, 0)).toBe(0)
  })
})
