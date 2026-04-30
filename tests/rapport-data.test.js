import { describe, expect, it } from 'vitest'

import { buildRapportData, getFallbackWeight } from '../js/rapport/rapport-data.js'

describe('rapport-data', () => {
  it('builds production report totals grouped by product and package', () => {
    const report = buildRapportData({
      weekLabel: 'Uke 18',
      products: ['Burrata', 'Melk'],
      rows: [
        {
          cells: {
            Burrata: {
              items: [
                {
                  packageName: 'kg',
                  label: 'kg',
                  qty: 2,
                  weightKg: 1
                },
                {
                  packageName: 'spann',
                  label: 'spann - 5 kg',
                  qty: 1,
                  weightKg: 5
                }
              ]
            },
            Melk: {
              items: [
                {
                  packageName: 'l',
                  label: 'l',
                  qty: 3,
                  weightKg: 1
                }
              ]
            }
          }
        },
        {
          cells: {
            Burrata: {
              items: [
                {
                  packageName: 'kg',
                  label: 'kg',
                  qty: 4,
                  weightKg: 1
                }
              ]
            }
          }
        }
      ]
    })

    expect(report.weekLabel).toBe('Uke 18')
    expect(report.productCount).toBe(2)
    expect(report.packageLineCount).toBe(3)
    expect(report.totalWeightKg).toBe(14)

    const burrata = report.products.find((product) => product.productName === 'Burrata')
    const melk = report.products.find((product) => product.productName === 'Melk')

    expect(burrata.totalWeightKg).toBe(11)
    expect(melk.totalWeightKg).toBe(3)

    const kgRow = burrata.packageRows.find((row) => row.packageName === 'kg')
    const spannRow = burrata.packageRows.find((row) => row.packageName === 'spann')

    expect(kgRow.qty).toBe(6)
    expect(kgRow.totalWeightKg).toBe(6)
    expect(spannRow.qty).toBe(1)
    expect(spannRow.totalWeightKg).toBe(5)
  })

  it('returns empty report when there are no order items', () => {
    const report = buildRapportData({
      weekLabel: 'Uke 18',
      products: ['Burrata'],
      rows: [{ cells: {} }]
    })

    expect(report.productCount).toBe(0)
    expect(report.packageLineCount).toBe(0)
    expect(report.totalWeightKg).toBe(0)
    expect(report.products).toEqual([])
  })

  it('uses fallback weights from labels', () => {
    expect(getFallbackWeight({ label: '125g' })).toBe(0.125)
    expect(getFallbackWeight({ label: '5kg' })).toBe(5)
    expect(getFallbackWeight({ label: 'l' })).toBe(1)
    expect(getFallbackWeight({ label: 'unknown' })).toBe(1)
  })
})
