export const parseMenuText = (text, employeeId) => {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const items = []

  for (const line of lines) {
    const match = line.match(
      /^(.+?)(?:\s*[-–—:]\s*|\s+)(\d+(?:[.,]\d{1,2})?)\s*(?:₽|руб\.?|р\.?)?$/i,
    )

    if (!match) continue

    const name = match[1].replace(/^[\d.)]+\s*/, '').trim()
    const price = Number(String(match[2]).replace(',', '.'))

    if (!name || Number.isNaN(price) || price <= 0) continue

    items.push({
      employeeId,
      name,
      price: Math.round(price),
    })
  }

  return items
}
