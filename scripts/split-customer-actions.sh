#!/usr/bin/env bash
set -e

WRITE_MODE=false

if [[ "$1" == "--write" ]]; then
  WRITE_MODE=true
fi

TIMESTAMP=$(date +"%Y-%m-%dT%H-%M-%S")

echo ""
echo "Split customer-actions.js into smaller customer action modules"
echo ""

FILES=(
  "js/customers/customer-actions.js"
  "js/customers/customer-create-actions.js"
  "js/customers/customer-update-actions.js"
  "js/customers/customer-order-actions.js"
)

echo "Planned changes:"
for file in "${FILES[@]}"; do
  echo "- update/create: $file"
done

if [[ "$WRITE_MODE" == false ]]; then
  echo ""
  echo "Dry run only. Apply with:"
  echo ""
  echo "  bash scripts/split-customer-actions.sh --write"
  echo ""
  exit 0
fi

mkdir -p js/customers

for file in "${FILES[@]}"; do
  if [[ -f "$file" ]]; then
    cp "$file" "$file.$TIMESTAMP.bak"
  fi
done

cat > js/customers/customer-actions.js <<'JS'
export {
  addCustomerAction,
  ensureCustomerExistsAction
} from './customer-create-actions.js'

export { updateCustomerAction } from './customer-update-actions.js'

export {
  moveCustomerAction,
  removeCustomerAction
} from './customer-order-actions.js'
JS

cat > js/customers/customer-create-actions.js <<'JS'
import { normalizeName } from '../utils/text.js'

import {
  normalizeCustomer,
  normalizeCustomers
} from './customer-utils.js'

import {
  createCustomerFromName,
  customerNameExists,
  findCustomerByName,
  getNextCustomerDeliveryOrder
} from './customer-state-utils.js'

export function ensureCustomerExistsAction(context, name) {
  const { addLog, state } = context
  const cleanName = normalizeName(name)

  if (!cleanName) return null

  const existingCustomer = findCustomerByName(state.customers, cleanName)

  if (existingCustomer) {
    return existingCustomer
  }

  const customer = createCustomerFromName(
    cleanName,
    getNextCustomerDeliveryOrder(state.customers)
  )

  if (!customer) return null

  state.customers.push(customer)
  state.customers = normalizeCustomers(state.customers)

  if (typeof addLog === 'function') {
    addLog('add_customer', {
      actionLabel: 'La til kunde automatisk',
      customerName: customer.name,
      newValue: customer.name
    })
  }

  return customer
}

export function addCustomerAction(context, customerData) {
  const { addLog, persistState, state } = context
  const customer = normalizeCustomer(customerData)

  if (!customer.name) return false

  if (customerNameExists(state.customers, customer.name)) {
    alert('Denne kunden finnes allerede')
    return false
  }

  customer.deliveryOrder =
    customer.deliveryOrder || getNextCustomerDeliveryOrder(state.customers)

  state.customers.push(customer)
  state.customers = normalizeCustomers(state.customers)

  if (typeof addLog === 'function') {
    addLog('add_customer', {
      actionLabel: 'La til kunde',
      customerName: customer.name,
      newValue: customer.name
    })
  }

  persistState()

  return true
}
JS

cat > js/customers/customer-update-actions.js <<'JS'
import { normalizeName } from '../utils/text.js'

import {
  formatCustomerForLog,
  normalizeCustomerPatch,
  normalizeCustomers
} from './customer-utils.js'

import { customerNameExists } from './customer-state-utils.js'

export function updateCustomerAction(context, customerId, patch) {
  const { addLog, persistState, state } = context
  const customer = state.customers.find(item => item.id === customerId)

  if (!customer) return false

  const cleanPatch = normalizeCustomerPatch(patch)

  if (cleanPatch.name !== undefined) {
    const newName = normalizeName(cleanPatch.name)

    if (!newName) {
      alert('Kundenavn kan ikke være tomt')
      return false
    }

    if (customerNameExists(state.customers, newName, customerId)) {
      alert('Denne kunden finnes allerede')
      return false
    }

    cleanPatch.name = newName
  }

  const oldValue = formatCustomerForLog(customer)

  Object.assign(customer, cleanPatch)

  state.customers = normalizeCustomers(state.customers)

  const updatedCustomer = state.customers.find(item => item.id === customerId)
  const newValue = formatCustomerForLog(updatedCustomer || customer)

  if (oldValue === newValue) return true

  if (typeof addLog === 'function') {
    addLog('update_customer', {
      actionLabel: 'Endret kunde',
      customerName: updatedCustomer?.name || customer.name,
      oldValue,
      newValue
    })
  }

  persistState()

  return true
}
JS

cat > js/customers/customer-order-actions.js <<'JS'
import { formatCustomerForLog, normalizeCustomers } from './customer-utils.js'

export function moveCustomerAction(context, customerId, direction) {
  const { addLog, persistState, state } = context
  const customers = normalizeCustomers(state.customers)
  const currentIndex = customers.findIndex(customer => customer.id === customerId)

  if (currentIndex === -1) return false

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

  if (targetIndex < 0 || targetIndex >= customers.length) {
    return false
  }

  const currentCustomer = customers[currentIndex]
  const targetCustomer = customers[targetIndex]

  customers[currentIndex] = targetCustomer
  customers[targetIndex] = currentCustomer

  state.customers = customers.map((customer, index) => ({
    ...customer,
    deliveryOrder: index + 1
  }))

  if (typeof addLog === 'function') {
    addLog('move_customer', {
      actionLabel: 'Endret kunderekkefølge',
      customerName: currentCustomer.name,
      oldValue: `Nr. ${currentIndex + 1}`,
      newValue: `Nr. ${targetIndex + 1}`
    })
  }

  persistState()

  return true
}

export function removeCustomerAction(context, customerId) {
  const { addLog, persistState, state } = context
  const customer = state.customers.find(item => item.id === customerId)

  if (!customer) return false

  const oldValue = formatCustomerForLog(customer)

  state.customers = state.customers.filter(item => item.id !== customerId)

  if (typeof addLog === 'function') {
    addLog('remove_customer', {
      actionLabel: 'Slettet kunde',
      customerName: customer.name,
      oldValue
    })
  }

  persistState()

  return true
}
JS

echo ""
echo "Done."
echo "Backups created with suffix: .$TIMESTAMP.bak"
