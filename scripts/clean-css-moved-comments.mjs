import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const cssDir = path.join(rootDir, 'css')
const isWriteMode = process.argv.includes('--write')
const timestamp = new Date()
  .toISOString()
  .replaceAll(':', '-')
  .replaceAll('.', '-')

if (!fs.existsSync(cssDir)) {
  console.log('css/ folder not found.')
  process.exit(0)
}

const cssFiles = fs
  .readdirSync(cssDir)
  .filter(file => file.endsWith('.css'))
  .map(file => path.join(cssDir, file))

const report = []

cssFiles.forEach(file => {
  const before = fs.readFileSync(file, 'utf8')
  const matches = [...before.matchAll(/\/\*\s*moved to css\/[\s\S]*?\*\//g)]

  if (matches.length === 0) return

  const after = before
    .replace(/\/\*\s*moved to css\/[\s\S]*?\*\//g, '')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim()

  report.push({
    file,
    count: matches.length,
    content: `${after}\n`
  })
})

console.log('\nClean CSS moved-comments:\n')

if (report.length === 0) {
  console.log('No moved-comments found.')
  process.exit(0)
}

report.forEach(item => {
  console.log(`- ${path.relative(rootDir, item.file)}: ${item.count} comments`)
})

if (!isWriteMode) {
  console.log('\nDry run only. Apply with:')
  console.log('\n  node scripts/clean-css-moved-comments.mjs --write\n')
  process.exit(0)
}

report.forEach(item => {
  fs.copyFileSync(item.file, `${item.file}.${timestamp}.bak`)
  fs.writeFileSync(item.file, item.content)
})

console.log('\nDone.')
console.log(`Backups created with suffix: .${timestamp}.bak`)
