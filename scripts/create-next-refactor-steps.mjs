import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const docsDir = path.join(rootDir, 'docs')
const reportPath = path.join(docsDir, 'NEXT-REFACTOR-STEPS.md')
const isWriteMode = process.argv.includes('--write')

const files = getProjectFiles()
const cssFiles = files
  .filter(file => file.endsWith('.css'))
  .map(getFileInfo)
  .sort((a, b) => b.lines - a.lines)

const jsFiles = files
  .filter(file => file.endsWith('.js') || file.endsWith('.mjs'))
  .filter(file => !file.includes('node_modules/'))
  .map(getFileInfo)
  .sort((a, b) => b.lines - a.lines)

const largeCss = cssFiles.filter(file => file.lines >= 250)
const largeJs = jsFiles.filter(file => file.lines >= 180)

const riskyCoreFiles = [
  'js/app/state-api.js',
  'js/state.js',
  'js/firebase.js',
  'js/app/persistence-controller.js',
  'js/app/state-loader.js'
]
  .map(file => {
    const fullPath = path.join(rootDir, file)

    if (!fs.existsSync(fullPath)) return null

    return getFileInfo(fullPath)
  })
  .filter(Boolean)

const safeNextCandidates = largeJs.filter(file => {
  const relative = file.relative

  if (relative.startsWith('scripts/')) return false
  if (riskyCoreFiles.some(core => core.relative === relative)) return false
  if (relative.includes('/state-api')) return false
  if (relative.includes('/firebase')) return false

  return true
})

const report = [
  '# Next Refactor Steps',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Summary',
  '',
  '```text',
  `CSS files >= 250 lines: ${largeCss.length}`,
  `JS files >= 180 lines:  ${largeJs.length}`,
  `Safe JS candidates:    ${safeNextCandidates.length}`,
  '```',
  '',
  '## Large CSS files',
  '',
  renderFileTable(largeCss),
  '',
  '## Large JS files',
  '',
  renderFileTable(largeJs),
  '',
  '## Risky core files',
  '',
  renderFileTable(riskyCoreFiles),
  '',
  '## Safe next JS candidates',
  '',
  renderFileTable(safeNextCandidates),
  '',
  '## Recommendation',
  '',
  buildRecommendation({
    largeCss,
    largeJs,
    safeNextCandidates
  }),
  ''
].join('\n')

console.log('\nCreate next refactor steps report:\n')
console.log('- docs/NEXT-REFACTOR-STEPS.md')

if (!isWriteMode) {
  console.log('\nDry run only. Apply with:')
  console.log('\n  node scripts/create-next-refactor-steps.mjs --write\n')
  process.exit(0)
}

fs.mkdirSync(docsDir, { recursive: true })
fs.writeFileSync(reportPath, report)

console.log('\nDone.')

function getProjectFiles() {
  return getAllFiles(rootDir).filter(file => {
    const relative = path.relative(rootDir, file)

    if (relative.startsWith('node_modules/')) return false
    if (relative.startsWith('.git/')) return false
    if (relative.endsWith('.bak')) return false
    if (relative.endsWith('package-lock.json')) return false

    return true
  })
}

function getAllFiles(dir) {
  if (!fs.existsSync(dir)) return []

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name)

    if (entry.name === 'node_modules' || entry.name === '.git') {
      return []
    }

    if (entry.isDirectory()) {
      return getAllFiles(fullPath)
    }

    if (entry.isFile()) {
      return [fullPath]
    }

    return []
  })
}

function getFileInfo(file) {
  const content = fs.readFileSync(file, 'utf8')

  return {
    relative: path.relative(rootDir, file),
    lines: content.split('\n').length,
    kb: fs.statSync(file).size / 1024
  }
}

function renderFileTable(items) {
  if (items.length === 0) {
    return '```text\nNo files in this category.\n```'
  }

  return [
    '```text',
    ...items.map(file => {
      return `${String(file.lines).padStart(5)} lines | ${file.kb
        .toFixed(1)
        .padStart(6)} KB | ${file.relative}`
    }),
    '```'
  ].join('\n')
}

function buildRecommendation({ largeCss, safeNextCandidates }) {
  if (safeNextCandidates.length > 0) {
    const top = safeNextCandidates[0]

    return [
      '```text',
      `Next safest JS target: ${top.relative}`,
      '',
      'Reason:',
      '- it is still relatively large;',
      '- it is not a risky core state/Firebase file;',
      '- it can probably be split with lower risk than CSS.',
      '```'
    ].join('\n')
  }

  if (largeCss.length > 0) {
    const top = largeCss[0]

    return [
      '```text',
      `Next main target: ${top.relative}`,
      '',
      'Reason:',
      '- JS architecture is mostly cleaned;',
      '- CSS is now the main remaining technical debt;',
      '- proceed only with small, isolated CSS cleanup steps.',
      '```'
    ].join('\n')
  }

  return [
    '```text',
    'No obvious large refactor target remains.',
    'Focus on bug fixes, UX improvements, and tests.',
    '```'
  ].join('\n')
}
