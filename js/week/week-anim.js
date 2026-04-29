export function animateWeekChange(direction, onMiddle) {
  const container = document.getElementById('tableContainer')

  if (!container) {
    onMiddle()
    return
  }

  const outClass = direction === 'next'
    ? 'week-slide-out-left'
    : 'week-slide-out-right'

  const inClass = direction === 'next'
    ? 'week-slide-in-right'
    : 'week-slide-in-left'

  container.classList.remove(
    'week-slide-out-left',
    'week-slide-out-right',
    'week-slide-in-left',
    'week-slide-in-right'
  )

  container.classList.add(outClass)

  setTimeout(() => {
    onMiddle()

    const newContainer = document.getElementById('tableContainer')
    if (!newContainer) return

    newContainer.classList.add(inClass)

    setTimeout(() => {
      newContainer.classList.remove(inClass)
    }, 220)
  }, 180)
}