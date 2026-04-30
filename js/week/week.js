import {
  getCurrentWeekLabel,
  goToPreviousWeek,
  goToNextWeek
} from '../state.js'

import { renderTab } from '../tabs/tabs-render.js'

let isAnimating = false

export function initWeekControls() {
  const prevBtn = document.getElementById('prevWeek')
  const nextBtn = document.getElementById('nextWeek')

  if (!prevBtn || !nextBtn) return

  prevBtn.onclick = () => {
    changeWeekWithAnimation('prev')
  }

  nextBtn.onclick = () => {
    changeWeekWithAnimation('next')
  }

  updateWeekLabel()
}

async function changeWeekWithAnimation(direction) {
  if (isAnimating) return

  const content = document.getElementById('tabContent')

  if (!content) {
    changeWeek(direction)
    updateWeekLabel()
    renderTab()
    return
  }

  isAnimating = true
  disableWeekButtons(true)

  const outClass = direction === 'next'
    ? 'week-slide-out-left'
    : 'week-slide-out-right'

  const inClass = direction === 'next'
    ? 'week-slide-in-right'
    : 'week-slide-in-left'

  resetAnimationClasses(content)
  content.classList.add(outClass)

  await wait(180)

  changeWeek(direction)
  updateWeekLabel()
  renderTab()

  const newContent = document.getElementById('tabContent')
  resetAnimationClasses(newContent)
  newContent.classList.add(inClass)

  await wait(220)

  resetAnimationClasses(newContent)
  disableWeekButtons(false)
  isAnimating = false
}

function changeWeek(direction) {
  if (direction === 'next') {
    goToNextWeek()
    return
  }

  goToPreviousWeek()
}

export function updateWeekLabel() {
  const label = document.getElementById('weekLabel')

  if (!label) return

  label.innerText = getCurrentWeekLabel()
}

function disableWeekButtons(disabled) {
  const prevBtn = document.getElementById('prevWeek')
  const nextBtn = document.getElementById('nextWeek')

  if (prevBtn) prevBtn.disabled = disabled
  if (nextBtn) nextBtn.disabled = disabled
}

function resetAnimationClasses(element) {
  if (!element) return

  element.classList.remove(
    'week-slide-out-left',
    'week-slide-out-right',
    'week-slide-in-right',
    'week-slide-in-left'
  )
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}