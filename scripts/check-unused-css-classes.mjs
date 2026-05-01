import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const cssDir = path.join(rootDir, 'css')

const ignoredClasses = new Set([
  'active',
  'hidden',
  'selected',
  'disabled',
  'checked',
  'error',
  'success',
  'warning',
  'info',
  'danger'
])

const ignoredPrefixes = [
  'is-',
  'week-slide-',
  'delivery-row-',
  'row-status-',
  'log-type-'
]

const cssFiles = getFiles(cssDir, '.css')
const sourceFiles = [
  path.join(rootDir, 'index.html'),
  ...getFiles(path.join(rootDir, 'js'), '.js')
].filter(file => fs.existsSync(file))

const sourceText = sourceFiles
  .map(file => fs.readFileSync(file, 'utf8'))
  .join('\n')

const cssClasses = collectCssClasses(cssFiles)
const unused = cssClasses.filter(item => {
  if (ignoredClasses.has(item.className)) return false

  if (ignoredPrefixes.some(prefix => item.className.startsWith(prefix))) {
    return false
  }

  return !sourceText.includes(item.className)
})

console.log('\nPotentially unused CSS classes:\n')

if (unused.length === 0) {
  console.log('✅ No potentially unused CSS classes found.')
  process.exit(0)
}

unused.forEach(item => {
  console.log(`${item.file}:${item.line}  .${item.className}`)
})

console.log('\nNote:')
console.log('This is an audit only. Do not delete all of these blindly.')
console.log('Some classes may be created dynamically or used by browser states/media rules.')

function collectCssClasses(files) {
  const result = []
  const seen = new Set()

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8')
    const relativePath = path.relative(rootDir, file)

    const matches = content.matchAll(/\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g)

    for (const match of matches) {
      const className = match[1]
      const key = `${relativePath}:${className}`

      if (seen.has(key)) continue

      seen.add(key)

      result.push({
        className,
        file: relativePath,
        line: getLineNumber(content, match.index)
      })
    }
  })

  return result.sort((a, b) => {
    return a.file.localeCompare(b.file) || a.line - b.line
  })
}

function getFiles(dir, extension) {
  if (!fs.existsSync(dir)) return []

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      return getFiles(fullPath, extension)
    }

    if (entry.isFile() && entry.name.endsWith(extension)) {
      return [fullPath]
    }

    return []
  })
}

function getLineNumber(content, index) {
  return content.slice(0, index).split('\n').length
}
