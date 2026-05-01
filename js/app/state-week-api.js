import { migrateCellsToOrderRows } from '../orders/order-migration-utils.js'

import {
  ensureWeekExistsInState,
  getCurrentWeekIdFromState,
  getCurrentWeekLabelFromState,
  shiftCurrentDateByWeeksInState,
  updateCurrentYearWeekInState
} from '../week/week-state-utils.js'

export function createStateWeekApi({ state, persistState, normalizeRows }) {
  function getCurrentWeekId() {
    return getCurrentWeekIdFromState(state)
  }

  function getCurrentWeekLabel() {
    return getCurrentWeekLabelFromState(state)
  }

  function ensureCurrentWeek() {
    ensureWeekExistsInState({
      state,
      weekId: getCurrentWeekId(),
      migrateCellsToOrderRows,
      normalizeRows
    })
  }

  function getCurrentRows() {
    ensureCurrentWeek()

    return state.weeks[getCurrentWeekId()].rows
  }

  function goToPreviousWeek() {
    shiftCurrentDateByWeeksInState(state, -1)

    ensureCurrentWeek()
    persistState()
  }

  function goToNextWeek() {
    shiftCurrentDateByWeeksInState(state, 1)

    ensureCurrentWeek()
    persistState()
  }

  function updateCurrentYearWeek() {
    return updateCurrentYearWeekInState(state)
  }

  return {
    getCurrentWeekId,
    getCurrentWeekLabel,
    ensureCurrentWeek,
    getCurrentRows,
    goToPreviousWeek,
    goToNextWeek,
    updateCurrentYearWeek
  }
}
