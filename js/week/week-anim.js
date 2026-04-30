export function animateWeekChange(direction, onMiddle) {
  const container = document.getElementById('tableContainer')

  if (!container) {
    onMiddle()
    return
  }

  const animationClasses = [
    'week-slide-out-left',
    'week-slide-out-right',
    'week-slide-in-left',
    'week-slide-in-right'
  ]

  const outClass = direction === 'next'
    ? 'week-slide-out-left'
    : 'week-slide-out-right'

  const inClass = direction === 'next'
    ? 'week-slide-in-right'
    : 'week-slide-in-left'

  container.classList.remove(...animationClasses)
  container.classList.add(outClass)

  setTimeout(() => {
    container.classList.remove(outClass)

    onMiddle()

    const updatedContainer = document.getElementById('tableContainer')
    if (!updatedContainer) return

    updatedContainer.classList.remove(...animationClasses)
    updatedContainer.classList.add(inClass)

    setTimeout(() => {
      updatedContainer.classList.remove(inClass)
    }, 240)
  }, 180)
}