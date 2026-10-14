const scorePair = (a, b) => {
  let score = 0
  const reasons = []

  if (a.cuisine === b.cuisine) {
    score += 40
    reasons.push(`оба хотят «${a.cuisine}»`)
  } else if (
    (a.cuisine === 'салаты' && b.intensity === 'легко') ||
    (b.cuisine === 'салаты' && a.intensity === 'легко')
  ) {
    score += 15
    reasons.push('лёгкий формат пересекается')
  }

  if (a.format === b.format) {
    score += 35
    reasons.push(`формат: ${a.format}`)
  }

  if (a.intensity === b.intensity) {
    score += 20
    reasons.push(`насыщенность: ${a.intensity}`)
  } else if (
    (a.intensity === 'обычно' || b.intensity === 'обычно') &&
    a.intensity !== b.intensity
  ) {
    score += 8
  }

  return { score, reasons }
}

const groupLabel = (prefs) => {
  const cuisines = [...new Set(prefs.map((p) => p.cuisine))]
  const formats = [...new Set(prefs.map((p) => p.format))]
  const placeHint =
    formats[0] === 'пешком'
      ? 'прогулка рядом с офисом'
      : formats[0] === 'кафе'
        ? 'соседнее кафе'
        : 'общий заказ с доставкой'

  return {
    title:
      cuisines.length === 1
        ? `${cuisines[0]} · ${formats[0]}`
        : `Микс: ${cuisines.join(' / ')}`,
    suggestion: placeHint,
  }
}

const todayLocal = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const matchLunches = (preferences, employees) => {
  const today = todayLocal()
  const pool = preferences
    .filter((p) => p.date === today)
    .map((p) => ({
      ...p,
      employee: employees.find((e) => e.id === p.employeeId),
    }))
    .filter((p) => p.employee)

  if (pool.length === 0) {
    return {
      date: today,
      summary: 'Пока никто не отметил предпочтения на сегодня.',
      groups: [],
    }
  }

  const unused = new Set(pool.map((p) => p.employeeId))
  const groups = []

  while (unused.size > 0) {
    const seedId = [...unused][0]
    const seed = pool.find((p) => p.employeeId === seedId)
    unused.delete(seedId)

    const candidates = [...unused]
      .map((id) => {
        const other = pool.find((p) => p.employeeId === id)
        const { score, reasons } = scorePair(seed, other)
        return { other, score, reasons }
      })
      .filter((c) => c.score >= 20)
      .sort((a, b) => b.score - a.score)

    const members = [seed]
    const allReasons = []

    for (const candidate of candidates.slice(0, 3)) {
      if (members.length >= 4) break
      members.push(candidate.other)
      unused.delete(candidate.other.employeeId)
      allReasons.push(...candidate.reasons)
    }

    const label = groupLabel(members)
    const uniqueReasons = [...new Set(allReasons)].slice(0, 3)

    groups.push({
      id: `g-${groups.length + 1}`,
      ...label,
      size: members.length,
      members: members.map((m) => ({
        employeeId: m.employeeId,
        name: m.employee.name,
        cuisine: m.cuisine,
        format: m.format,
        intensity: m.intensity,
        notes: m.notes || '',
      })),
      reasons:
        uniqueReasons.length > 0
          ? uniqueReasons
          : ['собрали компанию по свободным слотам'],
    })
  }

  return {
    date: today,
    summary: `Собрано ${groups.length} обеденных компаний из ${pool.length} человек.`,
    groups,
  }
}
