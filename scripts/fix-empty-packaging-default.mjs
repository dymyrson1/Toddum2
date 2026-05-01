import fs from 'node:fs'

const file = 'js/products/product-actions.js'
const isWriteMode = process.argv.includes('--write')

if (!fs.existsSync(file)) {
  console.error(`${file} not found`)
  process.exit(1)
}

const before = fs.readFileSync(file, 'utf8')

const oldCode = `  if (!state.productPackagingTypes[cleanProduct]) {
    state.productPackagingTypes[cleanProduct] = [createDefaultPackagingOption()]
  }`

const newCode = `  if (
    !Array.isArray(state.productPackagingTypes[cleanProduct]) ||
    state.productPackagingTypes[cleanProduct].length === 0
  ) {
    state.productPackagingTypes[cleanProduct] = [createDefaultPackagingOption()]
  }`

if (!before.includes(oldCode)) {
  console.error('Expected code block not found. No changes made.')
  process.exit(1)
}

const after = before.replace(oldCode, newCode)

console.log('Planned change:')
console.log('- ensure empty packaging option arrays receive default kg/l before adding custom packaging')

if (!isWriteMode) {
  console.log('\nDry run only. Apply with:')
  console.log('node scripts/fix-empty-packaging-default.mjs --write')
  process.exit(0)
}

fs.writeFileSync(file, after)
console.log('Done.')
