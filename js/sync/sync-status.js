export function setSyncStatus(type, text) {
  const el = document.getElementById('firebaseStatus')
  if (!el) return

  el.className = `sync-status ${type}`
  el.textContent = text
}
