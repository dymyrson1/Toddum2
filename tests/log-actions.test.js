import { describe, expect, it, vi } from 'vitest'

import { addLogAction, clearLogsAction } from '../js/logs/log-actions.js'

describe('log-actions', () => {
  it('adds log entry to the beginning of logs', () => {
    const context = {
      state: {
        logs: []
      },
      getCurrentWeekId: () => '2026-W18',
      getCurrentWeekLabel: () => 'Uke 18'
    }

    addLogAction(context, 'test_action', {
      actionLabel: 'Test action',
      customerName: 'Kunde A',
      newValue: 'New'
    })

    expect(context.state.logs.length).toBe(1)
    expect(context.state.logs[0].action).toBe('test_action')
    expect(context.state.logs[0].actionLabel).toBe('Test action')
    expect(context.state.logs[0].customerName).toBe('Kunde A')
    expect(context.state.logs[0].newValue).toBe('New')
    expect(context.state.logs[0].weekId).toBe('2026-W18')
    expect(context.state.logs[0].weekLabel).toBe('Uke 18')
  })

  it('clears logs and persists state', () => {
    const persistState = vi.fn()

    const context = {
      state: {
        logs: [{ id: 'log_1' }]
      },
      persistState
    }

    clearLogsAction(context)

    expect(context.state.logs).toEqual([])
    expect(persistState).toHaveBeenCalledTimes(1)
  })
})
