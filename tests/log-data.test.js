import { describe, expect, it } from 'vitest'

import {
  clampLogPage,
  formatLogObject,
  getActionType,
  getLogDetails,
  getPagedLogs,
  getPaginationRange,
  getTotalLogPages,
  sortLogsByDate
} from '../js/logs/log-data.js'

describe('log-data', () => {
  it('sorts logs by createdAt descending', () => {
    const logs = sortLogsByDate([
      {
        id: '1',
        createdAt: '2026-04-29T10:00:00.000Z'
      },
      {
        id: '2',
        createdAt: '2026-04-30T10:00:00.000Z'
      }
    ])

    expect(logs.map((log) => log.id)).toEqual(['2', '1'])
  })

  it('creates log details', () => {
    const details = getLogDetails({
      customerName: 'Kunde A',
      deliveryDay: 'Mandag',
      productName: 'Burrata',
      oldValue: '1kg',
      newValue: '2kg',
      note: 'Test'
    })

    expect(details).toEqual([
      {
        label: 'Kunde',
        value: 'Kunde A'
      },
      {
        label: 'Leveringsdag',
        value: 'Mandag'
      },
      {
        label: 'Produkt',
        value: 'Burrata'
      },
      {
        label: 'Før',
        value: '1kg'
      },
      {
        label: 'Etter',
        value: '2kg'
      },
      {
        label: 'Notat',
        value: 'Test'
      }
    ])
  })

  it('formats log object', () => {
    expect(
      formatLogObject({
        customerName: 'Kunde A',
        deliveryDay: 'Mandag',
        productName: 'Burrata'
      })
    ).toBe('Kunde A · Mandag · Burrata')

    expect(formatLogObject({})).toBe('—')
  })

  it('detects action type', () => {
    expect(getActionType('add_customer')).toEqual({
      label: 'Ny',
      className: 'is-add'
    })

    expect(getActionType('remove_product')).toEqual({
      label: 'Slettet',
      className: 'is-delete'
    })

    expect(getActionType('update_cell')).toEqual({
      label: 'Endret',
      className: 'is-update'
    })

    expect(getActionType('unknown')).toEqual({
      label: 'Logg',
      className: 'is-neutral'
    })
  })

  it('calculates pagination', () => {
    expect(getTotalLogPages(0, 10)).toBe(1)
    expect(getTotalLogPages(21, 10)).toBe(3)
    expect(clampLogPage(0, 3)).toBe(1)
    expect(clampLogPage(5, 3)).toBe(3)
  })

  it('gets paged logs', () => {
    const logs = Array.from({ length: 25 }, (_, index) => ({
      id: String(index + 1)
    }))

    expect(getPagedLogs(logs, 2, 10).map((log) => log.id)).toEqual([
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
      '20'
    ])
  })

  it('gets pagination range', () => {
    expect(getPaginationRange(25, 2, 10)).toEqual({
      from: 11,
      to: 20
    })

    expect(getPaginationRange(0, 1, 10)).toEqual({
      from: 0,
      to: 0
    })
  })
})
