import {
  getISOWeek,
  getWeekId,
  getWeekLabel,
  shiftDateByWeeks
} from './week-utils.js'

export function updateCurrentYearWeekInState(state) {
  const result = getISOWeek(state.currentDate)

  state.currentYear = result.year
  state.currentWeek = result.week
}

export function getCurrentWeekIdFromState(state) {
  return getWeekId(state.currentYear, state.currentWeek)
}

export function getCurrentWeekLabelFromState(state) {
  return getWeekLabel(state.currentWeek)
}

export function shiftCurrentDateByWeeksInState(state, weekOffset) {
  state.currentDate = shiftDateByWeeks(state.currentDate, weekOffset)

  updateCurrentYearWeekInState(state)
}

export function ensureWeekExistsInState({
  state,
  weekId,
  migrateCellsToOrderRows,
  normalizeRows
}) {
  if (!state.weeks[weekId]) {
    state.weeks[weekId] = {
      rows: []
    }
  }

  if (!Array.isArray(state.weeks[weekId].rows)) {
    state.weeks[weekId].rows = migrateCellsToOrderRows(
      state.weeks[weekId].cells || {}
    )

    delete state.weeks[weekId].cells
  }

  state.weeks[weekId].rows = normalizeRows(state.weeks[weekId].rows)
}