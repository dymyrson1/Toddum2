import fs from 'node:fs'

const packageFile = 'package.json'
const eslintFile = 'eslint.config.js'

if (!fs.existsSync(packageFile)) {
  console.error('package.json not found')
  process.exit(1)
}

const packageJson = JSON.parse(fs.readFileSync(packageFile, 'utf8'))

packageJson.scripts.lint =
  'eslint "js/**/*.js" "tests/**/*.js" "scripts/**/*.mjs" "*.js" --max-warnings=50'

packageJson.scripts['lint:strict'] =
  'eslint "js/**/*.js" "tests/**/*.js" "scripts/**/*.mjs" "*.js" --max-warnings=0'

fs.writeFileSync(packageFile, `${JSON.stringify(packageJson, null, 2)}\n`)

if (fs.existsSync(eslintFile)) {
  let eslintConfig = fs.readFileSync(eslintFile, 'utf8')

  if (!eslintConfig.includes("'**/*.sh'")) {
    eslintConfig = eslintConfig.replace(
      "'**/*.bak'",
      "'**/*.bak',\n      '**/*.sh'"
    )
  }

  fs.writeFileSync(eslintFile, eslintConfig)
}

console.log('Done. ESLint now ignores shell scripts and only lints JS/MJS files.')
