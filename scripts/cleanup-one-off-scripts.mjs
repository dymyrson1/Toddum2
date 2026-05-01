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
  'check-architecture.mjs',
  'firebase-migrate.mjs',
  'firebase-seed.mjs',
  'cleanup-one-off-scripts.mjs'
])

const removablePatterns = [
  /^split-/,
  /^fix-/,
  /^analyze-/,
  /^move-/,
  /^restore-/,
  /^remove-/,
  /^find-/,
  /^extract-/,
  /^create-project-docs\.mjs$/,
  /^cleanup-one-off-refactor-scripts\.mjs$/
]

if (!fs.existsSync(scriptsDir)) {
  console.log('scripts/ directory not found.')
  process.exit(0)
}

const filesToDelete = fs
  .readdirSync(scriptsDir)
  .filter(file => {
    if (keepFiles.has(file)) return false

    return removablePatterns.some(pattern => pattern.test(file))
  })
  .sort()

console.log('\nCleanup one-off scripts:\n')

if (filesToDelete.length === 0) {
  console.log('No one-off scripts found.')
  process.exit(0)
}

filesToDelete.forEach(file => {
  console.log(`- scripts/${file}`)
})

if (!isWriteMode) {
  console.log('\nDry run only. Apply with:')
  console.log('\n  node scripts/cleanup-one-off-scripts.mjs --write\n')
  process.exit(0)
}

filesToDelete.forEach(file => {
  fs.rmSync(path.join(scriptsDir, file), {
    force: true
  })
})

console.log('\nDone.')
