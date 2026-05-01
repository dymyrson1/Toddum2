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
  'cleanup-refactor-scripts.mjs'
])

const removePatterns = [
  /^split-/,
  /^fix-/,
  /^analyze-/,
  /^move-/,
  /^remove-/,
  /^restore-/,
  /^find-/,
  /^extract-/,
  /^create-project-docs\.mjs$/,
  /^create-refactor-report\.mjs$/,
  /^cleanup-one-off/
]

if (!fs.existsSync(scriptsDir)) {
  console.log('scripts/ folder not found.')
  process.exit(0)
}

const filesToRemove = fs
  .readdirSync(scriptsDir)
  .filter(file => {
    if (keepFiles.has(file)) return false

    return removePatterns.some(pattern => pattern.test(file))
  })
  .sort()

console.log('\nCleanup temporary refactor scripts:\n')

if (filesToRemove.length === 0) {
  console.log('No temporary refactor scripts found.')
  process.exit(0)
}

filesToRemove.forEach(file => {
  console.log(`- scripts/${file}`)
})

if (!isWriteMode) {
  console.log('\nDry run only. Apply with:')
  console.log('\n  node scripts/cleanup-refactor-scripts.mjs --write\n')
  process.exit(0)
}

filesToRemove.forEach(file => {
  fs.rmSync(path.join(scriptsDir, file), {
    force: true
  })
})

console.log('\nDone.')
