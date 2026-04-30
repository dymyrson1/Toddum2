import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const jsDir = path.join(rootDir, 'js')
const entryFiles = [
  path.join(rootDir, 'js/app.js'),
  path.join(rootDir, 'js/state.js')
]

const ignoredPatterns = [
  '/node_modules/',
  '/tests/',
  '/scripts/',
  '/dist/'
]

const allJsFiles = getAllJsFiles(jsDir)
const importedFiles = new Set()
const visitedFiles = new Set()

entryFiles.forEach(entryFile => {
  if (fs.existsSync(entryFile)) {
    walkImports(entryFile)
  }
})

const unusedFiles = allJsFiles
  .filter(file => !importedFiles.has(file))
  .filter(file => !entryFiles.includes(file))
  .sort()

if (unusedFiles.length === 0) {
  console.log('✅ No unused JS files found.')
  process.exit(0)
}

console.log('Potentially unused JS files:\n')

unusedFiles.forEach(file => {
  console.log(`- ${path.relative(rootDir, file)}`)
})

console.log('\nReview these manually before deleting.')
process.exit(0)

function walkImports(filePath) {
  const normalizedFilePath = normalizePath(filePath)

  if (visitedFiles.has(normalizedFilePath)) return

  visitedFiles.add(normalizedFilePath)
  importedFiles.add(normalizedFilePath)

  const content = fs.readFileSync(normalizedFilePath, 'utf8')
  const importPaths = extractImportPaths(content)

  importPaths.forEach(importPath => {
    const resolvedFile = resolveImportPath(normalizedFilePath, importPath)

    if (!resolvedFile) return

    importedFiles.add(resolvedFile)
    walkImports(resolvedFile)
  })
}

function extractImportPaths(content) {
  const result = []
  const patterns = [
    /import\s+[^'"]*from\s+['"]([^'"]+)['"]/g,
    /import\s+['"]([^'"]+)['"]/g,
    /export\s+[^'"]*from\s+['"]([^'"]+)['"]/g
  ]

  patterns.forEach(pattern => {
    let match

    while ((match = pattern.exec(content)) !== null) {
      result.push(match[1])
    }
  })

  return result
}

function resolveImportPath(fromFile, importPath) {
  if (!importPath.startsWith('.')) return null

  const fromDir = path.dirname(fromFile)
  const rawPath = path.resolve(fromDir, importPath)

  const candidates = [
    rawPath,
    `${rawPath}.js`,
    path.join(rawPath, 'index.js')
  ]

  const found = candidates.find(candidate => fs.existsSync(candidate))

  if (!found) {
    console.warn(
      `⚠️ Could not resolve import "${importPath}" from ${path.relative(
        rootDir,
        fromFile
      )}`
    )

    return null
  }

  return normalizePath(found)
}

function getAllJsFiles(dir) {
  if (!fs.existsSync(dir)) return []

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap(entry => {
      const fullPath = path.join(dir, entry.name)

      if (ignoredPatterns.some(pattern => fullPath.includes(pattern))) {
        return []
      }

      if (entry.isDirectory()) {
        return getAllJsFiles(fullPath)
      }

      if (entry.isFile() && entry.name.endsWith('.js')) {
        return [normalizePath(fullPath)]
      }

      return []
    })
}

function normalizePath(filePath) {
  return path.resolve(filePath)
}