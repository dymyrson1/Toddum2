import { renderSettingsLayout as renderSettingsLayoutHtml } from './settings-layout-render.js'

export {
  getCustomerNameForConfirmation,
  renderCustomersList
} from './settings-customers-render.js'

export { renderProductsList } from './settings-products-render.js'
export { renderPackagingList } from './settings-packaging-render.js'

export function renderSettingsLayout(container) {
  renderSettingsLayoutHtml(container)
}
