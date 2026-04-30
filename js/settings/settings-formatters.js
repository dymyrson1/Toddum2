export function formatWeightForUi(weightKg) {
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    return '—'
  }

  const grams = Math.round(weightKg * 1000)

  if (grams < 1000) {
    return `${grams} g`
  }

  if (grams % 1000 === 0) {
    return `${grams / 1000} kg`
  }

  return `${String((grams / 1000).toFixed(2)).replace(/\.?0+$/, '')} kg`
}
