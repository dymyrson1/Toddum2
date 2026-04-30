import { describe, expect, it } from 'vitest'

import {
  getISOWeek,
  getWeekId,
  getWeekLabel,
  shiftDateByWeeks
} from '../js/week/week-utils.js'

describe('week-utils', () => {
  it('creates week id with leading zero', () => {
    expect(getWeekId(2026, 5)).toBe('2026-W05')
    expect(getWeekId(2026, 12)).toBe('2026-W12')
  })

  it('creates week label', () => {
    expect(getWeekLabel(17)).toBe('Uke 17')
  })

  it('calculates ISO week for a normal date', () => {
    const result = getISOWeek(new Date('2026-04-30T12:00:00'))

    expect(result.year).toBe(2026)
    expect(result.week).toBe(18)
  })

  it('shifts date by weeks without mutating the original date', () => {
    const original = new Date('2026-04-30T12:00:00')
    const shifted = shiftDateByWeeks(original, 1)

    expect(shifted.getDate()).not.toBe(original.getDate())
    expect(original.getDate()).toBe(30)
  })
})
