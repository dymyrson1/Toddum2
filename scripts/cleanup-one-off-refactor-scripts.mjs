import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const scriptsDir = path.join(rootDir, 'scripts')
const isWriteMode = process.argv.includes('--write')

const keepFiles = new Set([
  'check-unused-files.mjs',
  'check-large-files.mjs',
  'check-css-audit.mjs',
  'check-css-groups.mjs',
  'firebase-migrate.mjs',
  'firebase-seed.mjs',
  'cleanup-one-off-refactor-scripts.mjs'
])

const oneOffPatterns = [
  /^split-.*\.(sh|mjs)$/,
  /^fix-.*\.(sh|mjs)$/,
  /^move-.*\.(sh|mjs)$/,
  /^remove-.*\.(sh|mjs)$/,
  /^restore-.*\.(sh|mjs)$/,
  /^find-.*\.(sh|mjs)$/,
  /^extract-css-groups\.mjs$/,
  /^cleanup-.*\.sh$/
]

if (!fs.existsSync(scriptsDir)) {
  console.log('scripts/ directory not found.')
  process.exit(0)
}

const filesToDelete = fs
  .readdirSync(scriptsDir)
  .filter(file => {
    if (keepFiles.has(file)) return false

    return oneOffPatterns.some(pattern => pattern.test(file))
  })
  .sort()

console.log('\nCleanup one-off refactor scripts:\n')

if (filesToDelete.length === 0) {
  console.log('No one-off scripts found.')
  process.exit(0)
}

console.log('Files to delete:\n')

filesToDelete.forEach(file => {
  console.log(`- scripts/${file}`)
})

if (!isWriteMode) {
  console.log('\nDry run only. Apply with:')
  console.log('\n  node scripts/cleanup-one-off-refactor-scripts.mjs --write\n')
  process.exit(0)
}

filesToDelete.forEach(file => {
  fs.rmSync(path.join(scriptsDir, file), {
    force: true
  })
})

console.log('\nDone.')
