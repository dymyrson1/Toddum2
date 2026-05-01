import fs from 'node:fs'

patchTableEvents()
patchContextMenuEvents()
removeUnusedDisableDirectives()

console.log('Done. table event split patched.')

function patchTableEvents() {
  const file = 'js/table/table-events.js'

  if (!fs.existsSync(file)) {
    console.error(`${file} not found`)
    process.exit(1)
  }

  let content = fs.readFileSync(file, 'utf8')

  if (!content.includes("from './context-menu.js'")) {
    content = content.replace(
      "import { renderTable } from './table-render.js'",
      "import { renderTable } from './table-render.js'\nimport { closeContextMenu } from './context-menu.js'"
    )
  }

  if (!content.includes('let tableEventsInitialized = false')) {
    content = content.replace(
      "import { handleTableContextMenu } from './table-contextmenu-events.js'",
      "import { handleTableContextMenu } from './table-contextmenu-events.js'\n\nlet tableEventsInitialized = false"
    )
  }

  fs.writeFileSync(file, content)
}

function patchContextMenuEvents() {
  const file = 'js/table/table-contextmenu-events.js'

  if (!fs.existsSync(file)) {
    console.error(`${file} not found`)
    process.exit(1)
  }

  let content = fs.readFileSync(file, 'utf8')

  content = content.replace(
    "import { openContextMenu } from './context-menu.js'",
    "import { closeContextMenu, openContextMenu } from './context-menu.js'"
  )

  fs.writeFileSync(file, content)
}

function removeUnusedDisableDirectives() {
  const files = [
    'js/table/table-change-events.js',
    'js/table/table-click-events.js',
    'js/table/table-contextmenu-events.js'
  ]

  files.forEach(file => {
    if (!fs.existsSync(file)) return

    const content = fs
      .readFileSync(file, 'utf8')
      .replace(/^\/\* eslint-disable no-unused-vars \*\/\n\n?/, '')

    fs.writeFileSync(file, content)
  })
}
