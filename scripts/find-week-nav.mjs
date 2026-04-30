import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const files = ['index.html', ...getFiles(path.join(rootDir, 'js'))]

const patterns = [
  /week/gi,
  /uke/gi,
  /forrige/gi,
  /neste/gi,
  /prev/gi,
  /next/gi,
  /current/gi,
  /tilbake/gi,
  /fram/gi,
  /frem/gi
]

files.forEach(file => {
  const fullPath = path.join(rootDir, file)

  if (!fs.existsSync(fullPath)) return

  const lines = fs.readFileSync(fullPath, 'utf8').split('\n')

  lines.forEach((line, index) => {
    if (patterns.some(pattern => pattern.test(line))) {
      console.log(`${file}:${index + 1}: ${line.trim()}`)
    }

    patterns.forEach(pattern => {
      pattern.lastIndex = 0
    })
  })
})

function getFiles(dir) {
  if (!fs.existsSync(dir)) return []

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name)
    const relativePath = path.relative(rootDir, fullPath)

    if (entry.isDirectory()) {
      return getFiles(fullPath)
    }

    if (entry.isFile() && entry.name.endsWith('.js')) {
      return [relativePath]
    }

    return []
  })
}
