import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const rootDir = process.cwd()
const docsDir = path.join(rootDir, 'docs')
const reportPath = path.join(docsDir, 'REFACTORING-CURRENT.md')
const isWriteMode = process.argv.includes('--write')

console.log('\nCreate current refactoring report\n')

const report = [
  '# Current Refactoring Report',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Largest project files',
  '',
  codeBlock(runCommand('npm run check:sizes')),
  '',
  '## Test status',
  '',
  codeBlock(runCommand('npm test')),
  '',
  '## Lint status',
  '',
  codeBlock(runCommand('npm run lint')),
  '',
  '## Unused JS files',
  '',
  codeBlock(runCommand('npm run check:unused')),
  '',
  '## Architecture check',
  '',
  codeBlock(runCommand('npm run check:architecture', true)),
  '',
  '## Remaining one-off scripts',
  '',
  codeBlock(listOneOffScripts()),
  '',
  '## Backup files',
  '',
  codeBlock(listBackupFiles()),
  '',
  '## JS module structure',
  '',
  codeBlock(printTree('js', 3)),
  '',
  '## Scripts structure',
  '',
  codeBlock(printTree('scripts', 2)),
  ''
].join('\n')

console.log('Planned change:')
console.log('- create/update: docs/REFACTORING-CURRENT.md')

if (!isWriteMode) {
  console.log('\nDry run only. Apply with:')
  console.log('\n  node scripts/create-refactor-report.mjs --write\n')
  process.exit(0)
}

fs.mkdirSync(docsDir, { recursive: true })
fs.writeFileSync(reportPath, report)

console.log('\nDone.')
console.log('- docs/REFACTORING-CURRENT.md')

function runCommand(command, allowFail = false) {
  try {
    return execSync(command, {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    })
  } catch (error) {
    if (!allowFail) {
      return [
        `Command failed: ${command}`,
        '',
        error.stdout || '',
        error.stderr || ''
      ].join('\n')
    }

    return [
      `Command failed: ${command}`,
      '',
      error.stdout || '',
      error.stderr || ''
    ].join('\n')
  }
}

function listOneOffScripts() {
  const scriptsDir = path.join(rootDir, 'scripts')

  if (!fs.existsSync(scriptsDir)) {
    return 'scripts/ directory not found.'
  }

  const files = fs
    .readdirSync(scriptsDir)
    .filter(file => {
      return (
        /^split-/.test(file) ||
        /^fix-/.test(file) ||
        /^analyze-/.test(file) ||
        /^move-/.test(file) ||
        /^remove-/.test(file) ||
        /^restore-/.test(file) ||
        /^find-/.test(file) ||
        /^extract-/.test(file)
      )
    })
    .sort()

  if (files.length === 0) {
    return 'No one-off scripts found.'
  }

  return files.map(file => `scripts/${file}`).join('\n')
}

function listBackupFiles() {
  const files = getAllFiles(rootDir)
    .filter(file => file.endsWith('.bak'))
    .map(file => path.relative(rootDir, file))
    .sort()

  if (files.length === 0) {
    return 'No backup files found.'
  }

  return files.join('\n')
}

function printTree(relativeDir, maxDepth) {
  const dir = path.join(rootDir, relativeDir)

  if (!fs.existsSync(dir)) {
    return `${relativeDir}/ not found.`
  }

  return buildTree(dir, 0, maxDepth).join('\n')
}

function buildTree(dir, depth, maxDepth) {
  if (depth > maxDepth) return []

  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.name !== 'node_modules' && entry.name !== '.git')
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1
      if (!a.isDirectory() && b.isDirectory()) return 1

      return a.name.localeCompare(b.name)
    })

  const lines = []

  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name)
    const prefix = '  '.repeat(depth)

    lines.push(`${prefix}${entry.isDirectory() ? '📁' : '📄'} ${entry.name}`)

    if (entry.isDirectory()) {
      lines.push(...buildTree(fullPath, depth + 1, maxDepth))
    }
  })

  return lines
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

function codeBlock(value) {
  return ['```text', String(value || '').trim(), '```'].join('\n')
}
