export function createEntityId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function createRowId() {
  return createEntityId('row')
}

export function createLogId() {
  return createEntityId('log')
}
