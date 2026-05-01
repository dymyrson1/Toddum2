import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const filePath = path.join(rootDir, 'js/app/state-api.js')

if (!fs.existsSync(filePath)) {
  console.error('js/app/state-api.js not found')
  process.exit(1)
}

const content = fs.readFileSync(filePath, 'utf8')
const lines = content.split('\n')

console.log('\nAnalyze js/app/state-api.js\n')
console.log(`Lines: ${lines.length}`)
console.log(`Size:  ${(fs.statSync(filePath).size / 1024).toFixed(1)} KB`)

printSection('Imports', getImports(content))
printSection('Exports', getExports(content))
printSection('Local functions', getLocalFunctions(content))
printSection('Likely API groups', getApiGroups(content))
printRecommendation(content)

function printSection(title, items) {
  console.log(`\n${title}:\n`)

  if (items.length === 0) {
    console.log('- none')
    return
  }

  items.forEach(item => console.log(`- ${item}`))
}

function getImports(value) {
  return [...value.matchAll(/^import[\s\S]*?from\s+['"][^'"]+['"]/gm)].map(match =>
    normalizeLine(match[0])
  )
}

function getExports(value) {
  const namedExports = [...value.matchAll(/export\s+function\s+([a-zA-Z0-9_]+)/g)].map(
    match => match[1]
  )

  const exportBlocks = [...value.matchAll(/export\s+\{[\s\S]*?\}/g)].map(match =>
    normalizeLine(match[0])
  )

  return [...exportBlocks, ...namedExports]
}

function getLocalFunctions(value) {
  return [...value.matchAll(/^function\s+([a-zA-Z0-9_]+)/gm)].map(match => match[1])
}

function getApiGroups(value) {
  const groups = [
    {
      name: 'state/init/persistence',
      patterns: ['initState', 'persistState', 'loadRuntimeStateFromFirebase']
    },
    {
      name: 'week',
      patterns: [
        'getCurrentWeekId',
        'getCurrentWeekLabel',
        'ensureCurrentWeek',
        'getCurrentRows',
        'goToPreviousWeek',
        'goToNextWeek',
        'updateCurrentYearWeek'
      ]
    },
    {
      name: 'orders',
      patterns: [
        'addOrderRow',
        'deleteOrderRow',
        'updateOrderRowField',
        'updateOrderCell',
        'deleteOrderCell',
        'updateRowCheck',
        'findOrderRow',
        'getOrderCell'
      ]
    },
    {
      name: 'customers',
      patterns: [
        'getCustomerName',
        'getCustomerByName',
        'ensureCustomerExists',
        'addCustomer',
        'updateCustomer',
        'moveCustomer',
        'removeCustomer'
      ]
    },
    {
      name: 'products/packaging',
      patterns: [
        'addProduct',
        'removeProduct',
        'moveProduct',
        'getPackagingOptionsForProduct',
        'getPackagingTypesForProduct',
        'addProductPackagingOption',
        'removeProductPackagingOption'
      ]
    },
    {
      name: 'logs',
      patterns: ['addLog', 'clearLogs']
    },
    {
      name: 'normalization/internal',
      patterns: [
        'ensureCustomersFromOrderRows',
        'ensureProductPackagingTypes',
        'normalizeAllWeekData',
        'normalizeRows',
        'normalizeRowCells',
        'createActionContext'
      ]
    }
  ]

  return groups.map(group => {
    const found = group.patterns.filter(pattern => {
      return new RegExp(`\\b${pattern}\\b`).test(value)
    })

    return `${group.name}: ${found.length ? found.join(', ') : 'none'}`
  })
}

function printRecommendation(value) {
  const lines = value.split('\n').length
  const hasLogs = /\baddLog\b|\bclearLogs\b/.test(value)
  const hasCreateActionContext = /\bcreateActionContext\b/.test(value)

  console.log('\nRecommendation:\n')

  if (lines <= 220) {
    console.log('- state-api.js is not critical by size. Split is optional.')
  } else {
    console.log('- state-api.js is still a split candidate.')
  }

  if (hasCreateActionContext) {
    console.log('- createActionContext should probably stay close to state-api or move to state-api-context.js.')
  }

  console.log('- safest split target: move wrapper API functions, not internal initialization logic.')
  console.log('- suggested modules:')
  console.log('  - js/app/state-week-api.js')
  console.log('  - js/app/state-order-api.js')
  console.log('  - js/app/state-customer-api.js')
  console.log('  - js/app/state-product-api.js')

  if (hasLogs) {
    console.log('  - js/app/state-log-api.js')
  }

  console.log('- keep js/state.js as public facade.')
}

function normalizeLine(value) {
  return value.replace(/\s+/g, ' ').trim()
}
