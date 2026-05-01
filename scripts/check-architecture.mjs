import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()

const maxJsLines = 260

const allowedLargeJsFiles = new Set([
  'js/app/state-api.js',
  'scripts/firebase-migrate.mjs',
  'scripts/firebase-seed.mjs'
])

const allowedScripts = new Set([
  'check-unused-files.mjs',
  'check-large-files.mjs',
  'check-css-audit.mjs',
  'check-css-groups.mjs',
  'check-architecture.mjs',
  'firebase-migrate.mjs',
  'firebase-seed.mjs',
  'create-project-docs.mjs',
  'cleanup-one-off-refactor-scripts.mjs'
])

const problems = []

checkBackupFiles()
checkLargeJsFiles()
checkForbiddenImports()
checkSimpleLogTabRemoved()
checkOneOffScripts()
checkStateFacade()

printResult()

function checkBackupFiles() {
  const backupFiles = getAllFiles(rootDir).filter(file => {
    return file.endsWith('.bak')
  })

  backupFiles.forEach(file => {
    problems.push({
      type: 'backup-file',
      message: `Backup file should not be committed: ${relative(file)}`
    })
  })
}

function checkLargeJsFiles() {
  const jsFiles = getAllFiles(path.join(rootDir, 'js'))
    .filter(file => file.endsWith('.js'))

  const scriptFiles = getAllFiles(path.join(rootDir, 'scripts'))
    .filter(file => file.endsWith('.mjs'))

  ;[...jsFiles, ...scriptFiles].forEach(file => {
    const rel = relative(file)
    const lines = readLines(file).length

    if (allowedLargeJsFiles.has(rel)) return

    if (lines > maxJsLines) {
      problems.push({
        type: 'large-js-file',
        message: `${rel} has ${lines} lines. Limit is ${maxJsLines}.`
      })
    }
  })
}

function checkForbiddenImports() {
  const jsFiles = getAllFiles(path.join(rootDir, 'js'))
    .filter(file => file.endsWith('.js'))

  const forbiddenPatterns = [
    {
      pattern: /from\s+['"][^'"]*app\/runtime-state\.js['"]/,
      message: 'Do not import runtime-state directly. Import from state.js facade.'
    },
    {
      pattern: /from\s+['"][^'"]*app\/persistence-controller\.js['"]/,
      message: 'Do not import persistence-controller directly outside state-api.'
    },
    {
      pattern: /from\s+['"][^'"]*app\/state-loader\.js['"]/,
      message: 'Do not import state-loader directly outside state-api.'
    }
  ]

  jsFiles.forEach(file => {
    const rel = relative(file)

    if (rel === 'js/app/state-api.js') return
    if (rel === 'js/state.js') return

    const content = fs.readFileSync(file, 'utf8')

    forbiddenPatterns.forEach(rule => {
      if (rule.pattern.test(content)) {
        problems.push({
          type: 'forbidden-import',
          message: `${rel}: ${rule.message}`
        })
      }
    })
  })
}

function checkSimpleLogTabRemoved() {
  const targets = [
    'index.html',
    'js/tabs/tabs-render.js',
    'js/tabs/tabs.js'
  ]

  targets.forEach(target => {
    const file = path.join(rootDir, target)

    if (!fs.existsSync(file)) return

    const content = fs.readFileSync(file, 'utf8')

    if (/data-tab=["']logg["']/.test(content)) {
      problems.push({
        type: 'simple-log-tab',
        message: `${target}: simple Logg tab still exists.`
      })
    }

    if (/renderLoggView/.test(content)) {
      problems.push({
        type: 'simple-log-render',
        message: `${target}: renderLoggView reference still exists.`
      })
    }

    if (/case\s+['"]logg['"]\s*:/.test(content)) {
      problems.push({
        type: 'simple-log-case',
        message: `${target}: case 'logg' still exists.`
      })
    }
  })
}

function checkOneOffScripts() {
  const scriptsDir = path.join(rootDir, 'scripts')

  if (!fs.existsSync(scriptsDir)) return

  fs.readdirSync(scriptsDir)
    .filter(file => {
      return file.endsWith('.mjs') || file.endsWith('.sh')
    })
    .forEach(file => {
      if (allowedScripts.has(file)) return

      if (
        /^split-/.test(file) ||
        /^fix-/.test(file) ||
        /^move-/.test(file) ||
        /^remove-/.test(file) ||
        /^restore-/.test(file) ||
        /^find-/.test(file) ||
        /^extract-/.test(file)
      ) {
        problems.push({
          type: 'one-off-script',
          message: `One-off script should be removed after use: scripts/${file}`
        })
      }
    })
}

function checkStateFacade() {
  const stateFile = path.join(rootDir, 'js/state.js')

  if (!fs.existsSync(stateFile)) return

  const lines = readLines(stateFile)

  if (lines.length > 80) {
    problems.push({
      type: 'state-facade-size',
      message: `js/state.js has ${lines.length} lines. It should stay as a small facade.`
    })
  }

  const content = fs.readFileSync(stateFile, 'utf8')

  if (!content.includes("export") || !content.includes("state-api")) {
    problems.push({
      type: 'state-facade',
      message: 'js/state.js does not look like a facade over app/state-api.js.'
    })
  }
}

function printResult() {
  if (problems.length === 0) {
    console.log('✅ Architecture check passed.')
    return
  }

  console.log('Architecture check found problems:\n')

  problems.forEach(problem => {
    console.log(`- [${problem.type}] ${problem.message}`)
  })

  process.exit(1)
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

function readLines(file) {
  return fs.readFileSync(file, 'utf8').split('\n')
}

function relative(file) {
  return path.relative(rootDir, file)
}
