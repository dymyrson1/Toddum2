import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const rootDir = process.cwd()
const docsDir = path.join(rootDir, 'docs')
const reportPath = path.join(docsDir, 'CSS-CLEANUP-REPORT.md')
const isWriteMode = process.argv.includes('--write')

const sections = [
  {
    title: 'CSS file sizes',
    command: 'npm run check:sizes'
  },
  {
    title: 'CSS audit',
    command: 'npm run check:css'
  },
  {
    title: 'CSS group audit',
    command: 'npm run check:css:groups'
  },
  {
    title: 'Potentially unused CSS classes',
    command: 'npm run check:css:unused'
  }
]

const report = [
  '# CSS Cleanup Report',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Recommended cleanup strategy',
  '',
  'Do not bulk-delete CSS classes automatically.',
  '',
  'Recommended order:',
  '',
  '```text',
  '1. Remove exact duplicate blocks.',
  '2. Remove duplicate declarations inside same block.',
  '3. Remove empty CSS blocks.',
  '4. Review unused class candidates manually.',
  '5. Only then extract small isolated CSS components.',
  '```',
  '',
  ...sections.flatMap(section => [
    `## ${section.title}`,
    '',
    codeBlock(run(section.command)),
    ''
  ])
].join('\n')

console.log('\nCreate CSS cleanup report:\n')
console.log('- docs/CSS-CLEANUP-REPORT.md')

if (!isWriteMode) {
  console.log('\nDry run only. Apply with:')
  console.log('\n  node scripts/create-css-cleanup-report.mjs --write\n')
  process.exit(0)
}

fs.mkdirSync(docsDir, { recursive: true })
fs.writeFileSync(reportPath, report)

console.log('\nDone.')

function run(command) {
  try {
    return execSync(command, {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    })
  } catch (error) {
    return [
      `Command failed: ${command}`,
      '',
      error.stdout || '',
      error.stderr || ''
    ].join('\n')
  }
}

function codeBlock(value) {
  return ['```text', String(value || '').trim(), '```'].join('\n')
}
