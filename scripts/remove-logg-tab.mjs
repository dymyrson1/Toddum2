import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const isWriteMode = process.argv.includes('--write')
const timestamp = new Date()
  .toISOString()
  .replaceAll(':', '-')
  .replaceAll('.', '-')

const files = {
  indexHtml: path.join(rootDir, 'index.html'),
  tabsRender: path.join(rootDir, 'js/tabs/tabs-render.js'),
  tabsConfig: path.join(rootDir, 'js/tabs/tabs.js'),
  loggView: path.join(rootDir, 'js/views/logg-view.js')
}

const changes = []

updateFile(files.indexHtml, content => {
  let next = content

  // Remove ONLY button with data-tab="logg" or data-tab='logg'
  // Does not match loggDetaljert.
  next = next.replace(
    /\s*<button\b(?=[^>]*\bdata-tab=(["'])logg\1)[\s\S]*?<\/button>\s*/g,
    '\n'
  )

  return normalizeBlankLines(next)
})

updateFile(files.tabsRender, content => {
  let next = content

  // Remove ONLY renderLoggView import.
  next = next.replace(
    /^\s*import\s+\{\s*renderLoggView\s*\}\s+from\s+['"][^'"]*logg-view\.js['"]\s*\n/gm,
    ''
  )

  // Remove ONLY case 'logg': ... break
  // Does not match loggDetaljert.
  next = next.replace(
    /\n?\s*case\s+['"]logg['"]\s*:\s*\n[\s\S]*?\n\s*break\s*\n?/m,
    '\n'
  )

  return normalizeBlankLines(next)
})

updateFile(files.tabsConfig, content => {
  let next = content

  // Optional cleanup if tabs.js has a simple tab object with id: 'logg'.
  // Does not match loggDetaljert.
  next = next.replace(
    /\n?\s*\{\s*id:\s*['"]logg['"][\s\S]*?\},?\s*/gm,
    '\n'
  )

  return normalizeBlankLines(next)
})

deleteFile(files.loggView)

validateResult()

if (!isWriteMode) {
  console.log('\nDry run only. No files changed.')
  console.log('Run this to apply changes:')
  console.log('\n  node scripts/remove-logg-tab.mjs --write\n')
} else {
  console.log('\nDone.')
  console.log('Backups were created next to changed files.')
}

printChanges()

function updateFile(filePath, transform) {
  if (!fs.existsSync(filePath)) {
    return
  }

  const before = fs.readFileSync(filePath, 'utf8')
  const after = transform(before)

  if (before === after) {
    return
  }

  changes.push({
    type: 'update',
    file: path.relative(rootDir, filePath)
  })

  if (!isWriteMode) {
    return
  }

  backupFile(filePath)
  fs.writeFileSync(filePath, after)
}

function deleteFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return
  }

  changes.push({
    type: 'delete',
    file: path.relative(rootDir, filePath)
  })

  if (!isWriteMode) {
    return
  }

  backupFile(filePath)
  fs.rmSync(filePath)
}

function backupFile(filePath) {
  const backupPath = `${filePath}.${timestamp}.bak`

  fs.copyFileSync(filePath, backupPath)
}

function validateResult() {
  const simulatedFiles = {}

  Object.entries(files).forEach(([key, filePath]) => {
    if (!fs.existsSync(filePath)) {
      simulatedFiles[key] = ''
      return
    }

    simulatedFiles[key] = fs.readFileSync(filePath, 'utf8')
  })

  const stillHasSimpleLogg =
    contains(simulatedFiles.indexHtml, /data-tab=["']logg["']/) ||
    contains(simulatedFiles.tabsRender, /renderLoggView/) ||
    contains(simulatedFiles.tabsRender, /case\s+["']logg["']\s*:/) ||
    contains(simulatedFiles.tabsRender, /logg-view\.js/) ||
    contains(simulatedFiles.tabsConfig, /id:\s*["']logg["']/)

  const stillHasDetailedLogg =
    contains(simulatedFiles.indexHtml, /data-tab=["']loggDetaljert["']/) ||
    contains(simulatedFiles.tabsRender, /renderLoggDetaljertView/) ||
    contains(simulatedFiles.tabsRender, /case\s+["']loggDetaljert["']\s*:/)

  console.log('\nValidation:')

  if (stillHasSimpleLogg) {
    console.log('⚠️  Simple Logg references may still exist. Run grep after write.')
  } else {
    console.log('✅ Simple Logg references targeted for removal.')
  }

  if (stillHasDetailedLogg) {
    console.log('✅ Detaljert logg appears to be preserved.')
  } else {
    console.log('⚠️  Detaljert logg was not detected. Check before committing.')
  }
}

function printChanges() {
  if (changes.length === 0) {
    console.log('\nNo changes needed.')
    return
  }

  console.log('\nPlanned changes:\n')

  changes.forEach(change => {
    const label = change.type === 'delete' ? 'delete' : 'update'
    console.log(`- ${label}: ${change.file}`)
  })
}

function contains(value, pattern) {
  return pattern.test(value || '')
}

function normalizeBlankLines(value) {
  return value.replace(/\n{3,}/g, '\n\n')
}
