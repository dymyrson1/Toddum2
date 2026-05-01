import fs from 'node:fs'

patchTableBodyRender()
patchTableCellRender()

console.log('Done. table row render split patched.')

function patchTableBodyRender() {
  const file = 'js/table/table-body-render.js'

  if (!fs.existsSync(file)) {
    console.error(`${file} not found`)
    process.exit(1)
  }

  let content = fs.readFileSync(file, 'utf8')

  if (!content.includes("from '../state.js'")) {
    content = `import { state } from '../state.js'\n${content}`
  }

  fs.writeFileSync(file, content)
}

function patchTableCellRender() {
  const file = 'js/table/table-cell-render.js'

  if (!fs.existsSync(file)) {
    console.error(`${file} not found`)
    process.exit(1)
  }

  let content = fs.readFileSync(file, 'utf8')

  content = content.replace(
    "import { getCustomerName, state } from '../state.js'",
    "import { state } from '../state.js'"
  )

  fs.writeFileSync(file, content)
}
