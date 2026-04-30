import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const isWriteMode = process.argv.includes('--write')
const timestamp = new Date()
  .toISOString()
  .replaceAll(':', '-')
  .replaceAll('.', '-')

const indexPath = path.join(rootDir, 'index.html')
const mainCssPath = path.join(rootDir, 'css/main.css')

const changes = []

if (!fs.existsSync(indexPath)) {
  console.error('index.html not found')
  process.exit(1)
}

if (!fs.existsSync(mainCssPath)) {
  console.error('css/main.css not found')
  process.exit(1)
}

const indexHtml = fs.readFileSync(indexPath, 'utf8')
const mainCss = fs.readFileSync(mainCssPath, 'utf8')

const restoredHtml = restoreWeekNavInHtml(indexHtml)
const restoredCss = removeWeekNavCss(mainCss)

if (restoredHtml !== indexHtml) {
  changes.push('index.html')
}

if (restoredCss !== mainCss) {
  changes.push('css/main.css')
}

console.log('\nRestore week navigation position:\n')

if (changes.length === 0) {
  console.log('No changes needed. Week navigation does not appear to be centered in app-top.')
  process.exit(0)
}

console.log('Planned changes:')
changes.forEach(file => console.log(`- update: ${file}`))

if (!isWriteMode) {
  console.log('\nDry run only. Apply with:')
  console.log('\n  node scripts/restore-week-nav-position.mjs --write\n')
  process.exit(0)
}

backup(indexPath)
backup(mainCssPath)

fs.writeFileSync(indexPath, restoredHtml)
fs.writeFileSync(mainCssPath, restoredCss)

console.log('\nDone.')
console.log('Backups created:')
console.log(`- index.html.${timestamp}.bak`)
console.log(`- css/main.css.${timestamp}.bak`)

function restoreWeekNavInHtml(html) {
  const appTopWeekNavBlock = findElementBlock(html, 'div', block => {
    return /\bclass=["'][^"']*\bapp-top-week-nav\b[^"']*["']/.test(block.openTag)
  })

  if (!appTopWeekNavBlock) {
    return html
  }

  const innerWeekBlock = getInnerHtml(appTopWeekNavBlock.raw).trim()

  if (!innerWeekBlock) {
    return html
  }

  const appTopBlock = findElementBlock(html, 'div', block => {
    return /\bclass=["'][^"']*\bapp-top\b[^"']*["']/.test(block.openTag)
  })

  if (!appTopBlock) {
    return html
  }

  let nextHtml =
    html.slice(0, appTopWeekNavBlock.start) +
    '\n' +
    html.slice(appTopWeekNavBlock.end)

  const removedLength = appTopWeekNavBlock.end - appTopWeekNavBlock.start
  const appTopEndAfterRemoval =
    appTopWeekNavBlock.start < appTopBlock.end
      ? appTopBlock.end - removedLength + 1
      : appTopBlock.end

  const restoredBlock = `

      ${normalizeIndent(innerWeekBlock, 6)}
`

  nextHtml =
    nextHtml.slice(0, appTopEndAfterRemoval) +
    restoredBlock +
    nextHtml.slice(appTopEndAfterRemoval)

  return nextHtml.replace(/\n{4,}/g, '\n\n\n')
}

function removeWeekNavCss(css) {
  const marker = '/* app top week navigation */'

  if (!css.includes(marker)) {
    return css
  }

  const beforeMarker = css.slice(0, css.indexOf(marker)).trimEnd()

  return `${beforeMarker}\n`
}

function findElementBlock(html, tagName, predicate) {
  let index = 0

  while (index < html.length) {
    const openIndex = html.indexOf(`<${tagName}`, index)

    if (openIndex === -1) return null

    const block = readElementBlockAt(html, openIndex, tagName)

    if (block && predicate(block)) {
      return block
    }

    index = openIndex + tagName.length + 1
  }

  return null
}

function readElementBlockAt(html, openIndex, tagName) {
  const openTagEnd = html.indexOf('>', openIndex)

  if (openTagEnd === -1) return null

  const openTag = html.slice(openIndex, openTagEnd + 1)
  const pattern = new RegExp(`<\\/?${tagName}\\b[^>]*>`, 'gi')

  pattern.lastIndex = openIndex

  let depth = 0
  let match

  while ((match = pattern.exec(html)) !== null) {
    const tag = match[0]
    const isClosing = tag.startsWith(`</${tagName}`)

    if (isClosing) {
      depth -= 1

      if (depth === 0) {
        const end = pattern.lastIndex

        return {
          start: openIndex,
          end,
          openTag,
          raw: html.slice(openIndex, end)
        }
      }
    } else {
      depth += 1
    }
  }

  return null
}

function getInnerHtml(rawBlock) {
  const firstClose = rawBlock.indexOf('>')
  const lastOpen = rawBlock.lastIndexOf('</div>')

  if (firstClose === -1 || lastOpen === -1) return ''

  return rawBlock.slice(firstClose + 1, lastOpen)
}

function normalizeIndent(value, spaces) {
  const lines = value.split('\n')
  const nonEmptyLines = lines.filter(line => line.trim())

  const minIndent = Math.min(
    ...nonEmptyLines.map(line => {
      const match = line.match(/^\s*/)

      return match ? match[0].length : 0
    })
  )

  const prefix = ' '.repeat(spaces)

  return lines
    .map(line => {
      if (!line.trim()) return ''
      return `${prefix}${line.slice(minIndent)}`
    })
    .join('\n')
}

function backup(filePath) {
  fs.copyFileSync(filePath, `${filePath}.${timestamp}.bak`)
}
