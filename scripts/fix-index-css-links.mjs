import fs from 'node:fs'

const indexFile = 'index.html'
const tabsRenderFile = 'js/tabs/tabs-render.js'

if (!fs.existsSync(indexFile)) {
  console.error('index.html not found')
  process.exit(1)
}

const version = new Date()
  .toISOString()
  .slice(0, 16)
  .replaceAll('-', '')
  .replace('T', '')
  .replace(':', '')

const cssOrder = [
  'layout.css',
  'main.css',
  'buttons.css',
  'forms.css',
  'tabs.css',
  'week.css',
  'table.css',
  'modal.css',
  'context-menu.css',
  'settings.css',
  'analytics.css',
  'rapport.css',
  'levering.css',
  'logg.css',
  'animations.css',
  'mobile.css',
  'theme.css'
].filter(file => fs.existsSync(`css/${file}`))

let html = fs.readFileSync(indexFile, 'utf8')

html = html.replace(
  /^\s*<link rel="stylesheet" href="css\/[^"]+\.css(?:\?v=[^"]*)?" \/>\s*$/gm,
  ''
)

const cssLinks = cssOrder
  .map(file => `  <link rel="stylesheet" href="css/${file}?v=${version}" />`)
  .join('\n')

html = html.replace('</head>', `${cssLinks}\n</head>`)

html = html.replace(
  /\s*<button\s+data-tab=["']logg["'][\s\S]*?<\/button>/g,
  ''
)

html = html.replace(
  /src="js\/app\.js(?:\?v=[^"]*)?"/,
  `src="js/app.js?v=${version}"`
)

fs.writeFileSync(indexFile, html)

if (fs.existsSync(tabsRenderFile)) {
  let tabsRender = fs.readFileSync(tabsRenderFile, 'utf8')

  tabsRender = tabsRender.replace(
    /^\s*import\s+\{\s*renderLoggView\s*\}\s+from\s+['"][^'"]+logg-view\.js['"]\s*$/gm,
    ''
  )

  tabsRender = tabsRender.replace(
    /\s*case ['"]logg['"]:\s*[\r\n]+\s*renderLoggView\(container\)\s*[\r\n]+\s*break/g,
    ''
  )

  fs.writeFileSync(tabsRenderFile, tabsRender)
}

console.log('Done.')
console.log(`CSS files linked: ${cssOrder.join(', ')}`)
console.log(`Cache version: ${version}`)
