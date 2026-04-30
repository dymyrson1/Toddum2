import { describe, expect, it } from 'vitest'

import {
  createDefaultPackagingOption,
  createPackagingOption,
  getDefaultPackagingOptionForProduct,
  normalizePackagingOptions,
  parsePackagingOption
} from '../js/products/packaging-utils.js'

describe('packaging-utils', () => {
  it('creates default kg option', () => {
    const option = createDefaultPackagingOption()

    expect(option.packageName).toBe('kg')
    expect(option.weightKg).toBe(1)
    expect(option.isDefault).toBe(true)
  })

  it('creates custom packaging option', () => {
    const option = createPackagingOption('spann', 5)

    expect(option.packageName).toBe('spann')
    expect(option.weightKg).toBe(5)
    expect(option.label).toBe('spann - 5 kg')
    expect(option.isDefault).toBe(false)
  })

  it('parses gram packaging string', () => {
    const option = parsePackagingOption('500 g')

    expect(option.packageName).toBe('500 g')
    expect(option.weightKg).toBe(0.5)
  })

  it('parses kg packaging string', () => {
    const option = parsePackagingOption('2 kg')

    expect(option.packageName).toBe('2 kg')
    expect(option.weightKg).toBe(2)
  })

  it('returns liter default for Melk', () => {
    const option = getDefaultPackagingOptionForProduct('Melk')

    expect(option.packageName).toBe('l')
    expect(option.label).toBe('l')
  })

  it('normalizes packaging options and removes duplicated default', () => {
    const options = normalizePackagingOptions([
      createDefaultPackagingOption(),
      createPackagingOption('spann', 5),
      createPackagingOption('spann', 5)
    ])

    expect(options.length).toBe(2)
    expect(options[0].isDefault).toBe(true)
    expect(options[1].packageName).toBe('spann')
  })
})