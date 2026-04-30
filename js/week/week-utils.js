export function getISOWeek(dateInput) {
  const date = new Date(
    Date.UTC(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate())
  )

  const dayNumber = date.getUTCDay() || 7

  date.setUTCDate(date.getUTCDate() + 4 - dayNumber)

  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7)

  return {
    year: date.getUTCFullYear(),
    week
  }
}

export function getWeekId(year, week) {
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function getWeekLabel(week) {
  return `Uke ${week}`
}

export function shiftDateByWeeks(dateInput, weekOffset) {
  const date = new Date(dateInput)

  date.setDate(date.getDate() + weekOffset * 7)

  return date
}