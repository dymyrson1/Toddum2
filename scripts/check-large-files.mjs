import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const targetDirs = ['js', 'css']
const maxResults = 25

const files = targetDirs
  .flatMap(dir => getFiles(path.join(rootDir, dir)))
  .map(file => {
    const content = fs.readFileSync(file, 'utf8')
    const stat = fs.statSync(file)

    return {
      file,
      relativePath: path.relative(rootDir, file),
      bytes: stat.size,
      lines: content.split('\n').length
    }
  })
  .sort((a, b) => b.lines - a.lines)
  .slice(0, maxResults)

console.log('Largest project files:\n')

files.forEach(file => {
  const kb = (file.bytes / 1024).toFixed(1)

  console.log(`${String(file.lines).padStart(5)} lines | ${kb.padStart(6)} KB | ${file.relativePath}`)
})

function getFiles(dir) {
  if (!fs.existsSync(dir)) return []

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      return getFiles(fullPath)
    }

    if (
      entry.isFile() &&
      (entry.name.endsWith('.js') || entry.name.endsWith('.css'))
    ) {
      return [fullPath]
    }

    return []
  })
}