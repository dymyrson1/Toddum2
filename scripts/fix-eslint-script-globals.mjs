import fs from 'node:fs'

const file = 'eslint.config.js'
const isWriteMode = process.argv.includes('--write')

if (!fs.existsSync(file)) {
  console.error('eslint.config.js not found')
  process.exit(1)
}

const before = fs.readFileSync(file, 'utf8')

if (before.includes("alert: 'readonly'") && before.includes("confirm: 'readonly'")) {
  console.log('ESLint script globals already include alert/confirm.')
  process.exit(0)
}

const after = before.replace(
  /files:\s*\['scripts\/\*\*\/\*\.mjs'\][\s\S]*?globals:\s*\{([\s\S]*?)console:\s*'readonly',?/,
  match => {
    if (match.includes("alert: 'readonly'")) return match

    return match.replace(
      /console:\s*'readonly',?/,
      `console: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',`
    )
  }
)

if (after === before) {
  console.error('Could not patch eslint.config.js automatically.')
  process.exit(1)
}

console.log('Planned change:')
console.log('- add alert/confirm globals for scripts/**/*.mjs in eslint.config.js')

if (!isWriteMode) {
  console.log('\nDry run only. Apply with:')
  console.log('node scripts/fix-eslint-script-globals.mjs --write')
  process.exit(0)
}

fs.writeFileSync(file, after)
console.log('Done.')
