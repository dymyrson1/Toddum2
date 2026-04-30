import { describe, expect, it } from 'vitest'

import {
  createProductModalItem,
  getFirstAvailableOption,
  normalizeProductModalItems,
  readProductModalItems,
  removeProductModalItem,
  updateProductModalItemOption,
  updateProductModalItemQty
} from '../js/modal/product-modal-data.js'

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

describe('product-modal-data', () => {
  it('normalizes modal items against available options', () => {
    const items = normalizeProductModalItems(
      [
        {
          packageId: 'default_kg',
          qty: 2
        },
        {
          packageId: 'unknown',
          qty: 3
        }
      ],
      options
    )

    expect(items).toEqual([
      {
        packageId: 'default_kg',
        packageName: 'kg',
        weightKg: 1,
        label: 'kg',
        qty: 2
      }
    ])
  })

  it('reads only valid modal items', () => {
    const items = readProductModalItems(
      [
        {
          packageId: 'default_kg',
          qty: '2'
        },
        {
          packageId: 'default_kg',
          qty: '4'
        },
        {
          packageId: 'spann__5',
          qty: '0'
        }
      ],
      options
    )

    expect(items).toEqual([
      {
        packageId: 'default_kg',
        packageName: 'kg',
        weightKg: 1,
        label: 'kg',
        qty: 2
      }
    ])
  })

  it('finds first available option', () => {
    const option = getFirstAvailableOption(
      [
        {
          packageId: 'default_kg'
        }
      ],
      options
    )

    expect(option.id).toBe('spann__5')
  })

  it('creates modal item from option', () => {
    expect(createProductModalItem(options[0])).toEqual({
      packageId: 'default_kg',
      packageName: 'kg',
      weightKg: 1,
      label: 'kg',
      qty: ''
    })
  })

  it('updates item option', () => {
    const items = [
      {
        packageId: 'default_kg',
        packageName: 'kg',
        weightKg: 1,
        label: 'kg',
        qty: '2'
      }
    ]

    const updated = updateProductModalItemOption(items, 0, options[1])

    expect(updated).toBe(true)
    expect(items[0]).toEqual({
      packageId: 'spann__5',
      packageName: 'spann',
      weightKg: 5,
      label: 'spann - 5 kg',
      qty: '2'
    })
  })

  it('updates item qty', () => {
    const items = [
      {
        packageId: 'default_kg',
        qty: ''
      }
    ]

    const updated = updateProductModalItemQty(items, 0, '3')

    expect(updated).toBe(true)
    expect(items[0].qty).toBe('3')
  })

  it('removes modal item', () => {
    const items = [
      {
        packageId: 'default_kg'
      }
    ]

    const removed = removeProductModalItem(items, 0)

    expect(removed).toBe(true)
    expect(items).toEqual([])
  })
})
