import {
  getCurrentWeekId,
  goToPreviousWeek,
  goToNextWeek
} from '../state.js'

import { renderOrdersTab } from '../table/table-render.js'
import { animateWeekChange } from './week-anim.js'

export function initWeekControls() {
  const prevBtn = document.getElementById('prevWeek')
  const nextBtn = document.getElementById('nextWeek')

  if (!prevBtn || !nextBtn) return

  prevBtn.onclick = () => {
    disableWeekButtons(true)

    animateWeekChange('prev', () => {
      goToPreviousWeek()
      updateLabel()
      renderOrdersTab()
      disableWeekButtons(false)
    })
  }

  nextBtn.onclick = () => {
    disableWeekButtons(true)

    animateWeekChange('next', () => {
      goToNextWeek()
      updateLabel()
      renderOrdersTab()
      disableWeekButtons(false)
    })
  }

  updateLabel()
}

function updateLabel() {
  const label = document.getElementById('weekLabel')
  if (!label) return

  label.innerText = getCurrentWeekId()
}

function disableWeekButtons(disabled) {
  const prevBtn = document.getElementById('prevWeek')
  const nextBtn = document.getElementById('nextWeek')

  if (prevBtn) prevBtn.disabled = disabled
  if (nextBtn) nextBtn.disabled = disabled
}