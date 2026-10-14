import cors from 'cors'
import express from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import {
  getOrderMemberIds,
  resolveDisplayStatus,
  splitBill,
} from './billSplit.js'
import { matchLunches } from './lunchMatcher.js'
import { parseMenuText } from './parseMenu.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, 'db.json')
const PORT = Number(process.env.PORT) || 3001
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || true

const todayLocal = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const readDb = async () => {
  const raw = await fs.readFile(dbPath, 'utf-8')
  return JSON.parse(raw)
}

const writeDb = async (db) => {
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2), 'utf-8')
}

const ensurePreferenceDates = async () => {
  const db = await readDb()
  const today = todayLocal()
  let changed = false
  for (const preference of db.preferences) {
    if (preference.date !== today) {
      preference.date = today
      changed = true
    }
  }
  if (changed) {
    await writeDb(db)
  }
}

const app = express()
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
  }),
)
app.use(express.json({ limit: '1mb' }))

const METHOD_TYPES = new Set(['kaspi', 'card'])

const sanitizePaymentMethods = (list) => {
  const methods = (Array.isArray(list) ? list : [])
    .map((item) => {
      const details = String(item?.details || '').trim()
      const type = METHOD_TYPES.has(item?.type) ? item.type : 'kaspi'
      if (!details) return null

      const method = {
        id: String(item?.id || uuidv4()),
        type,
        details,
        isDefault: Boolean(item?.isDefault),
      }

      if (type === 'card') {
        const cardHolder = String(item?.cardHolder || '').trim()
        const cardExpiry = String(item?.cardExpiry || '').trim()
        const last4 = String(item?.last4 || '').replace(/\D/g, '').slice(-4)
        if (cardHolder) method.cardHolder = cardHolder
        if (cardExpiry) method.cardExpiry = cardExpiry
        if (last4) method.last4 = last4
      }

      return method
    })
    .filter(Boolean)

  if (methods.length === 0) return []

  if (!methods.some((item) => item.isDefault)) {
    methods[0].isDefault = true
  }

  return methods.map((item, index) => ({
    ...item,
    isDefault:
      item.isDefault &&
      methods.findIndex((method) => method.isDefault) === index,
  }))
}

const normalizePaymentMethods = (employee) => {
  if (Array.isArray(employee.paymentMethods)) {
    return sanitizePaymentMethods(employee.paymentMethods)
  }

  const legacy = String(employee.paymentInfo || employee.cardHint || '').trim()
  if (!legacy) return []

  return [
    {
      id: `legacy-${employee.id}`,
      type: /^\+?\d[\d\s\-()]+$/.test(legacy) ? 'kaspi' : 'card',
      details: legacy,
      isDefault: true,
    },
  ]
}

const defaultPaymentDetails = (methods) => {
  const primary = methods.find((item) => item.isDefault) || methods[0]
  return primary?.details || ''
}

const toEmployeeDto = (employee) => {
  const paymentMethods = normalizePaymentMethods(employee)
  const paymentInfo =
    defaultPaymentDetails(paymentMethods) ||
    employee.paymentInfo ||
    employee.cardHint ||
    ''

  return {
    id: employee.id,
    name: employee.name,
    paymentInfo,
    cardHint: employee.cardHint || paymentInfo,
    company: employee.company || 'Kaspi Design',
    office: employee.office || 'БЦ Нурлы Тау',
    paymentMethods,
  }
}

app.get('/api/employees', async (_req, res) => {
  const db = await readDb()
  res.json(db.employees.map(toEmployeeDto))
})

app.get('/api/employees/:id', async (req, res) => {
  const db = await readDb()
  const employee = db.employees.find((item) => item.id === req.params.id)
  if (!employee) {
    res.status(404).json({ message: 'Пользователь не найден' })
    return
  }
  res.json(toEmployeeDto(employee))
})

app.patch('/api/employees/:id', async (req, res) => {
  const name = String(req.body?.name || '').trim()
  const paymentInfo = String(req.body?.paymentInfo || '').trim()
  const company = String(req.body?.company || '').trim()
  const office = String(req.body?.office || '').trim()
  const hasPaymentMethods = Array.isArray(req.body?.paymentMethods)

  if (!name) {
    res.status(400).json({ message: 'Укажите ФИО' })
    return
  }

  if (name.length < 2) {
    res.status(400).json({ message: 'ФИО слишком короткое' })
    return
  }

  const db = await readDb()
  const employee = db.employees.find((item) => item.id === req.params.id)
  if (!employee) {
    res.status(404).json({ message: 'Пользователь не найден' })
    return
  }

  const normalized = name.toLowerCase()
  const duplicate = db.employees.find(
    (item) =>
      item.id !== employee.id &&
      String(item.name).trim().toLowerCase() === normalized,
  )
  if (duplicate) {
    res.status(400).json({ message: 'Такое имя уже занято' })
    return
  }

  employee.name = name

  if (hasPaymentMethods) {
    const paymentMethods = sanitizePaymentMethods(req.body.paymentMethods)
    employee.paymentMethods = paymentMethods
    const details = defaultPaymentDetails(paymentMethods)
    employee.paymentInfo = details
    employee.cardHint = details
  } else {
    employee.paymentInfo = paymentInfo
    employee.cardHint = paymentInfo
    if (paymentInfo) {
      const existing = normalizePaymentMethods(employee)
      if (existing.length === 0) {
        employee.paymentMethods = [
          {
            id: uuidv4(),
            type: /^\+?\d[\d\s\-()]+$/.test(paymentInfo) ? 'kaspi' : 'card',
            details: paymentInfo,
            isDefault: true,
          },
        ]
      } else {
        employee.paymentMethods = existing.map((item) =>
          item.isDefault ? { ...item, details: paymentInfo } : item,
        )
      }
    }
  }

  if (company) employee.company = company
  if (office) employee.office = office
  await writeDb(db)
  res.json(toEmployeeDto(employee))
})

app.post('/api/auth/login', async (req, res) => {
  const name = String(req.body?.name || '').trim()
  const password = String(req.body?.password || '')

  if (!name) {
    res.status(400).json({ message: 'Укажите имя' })
    return
  }

  if (name.length < 2) {
    res.status(400).json({ message: 'Имя слишком короткое' })
    return
  }

  if (!password) {
    res.status(400).json({ message: 'Укажите пароль' })
    return
  }

  const db = await readDb()
  const normalized = name.toLowerCase()
  let employee = db.employees.find(
    (item) => String(item.name).trim().toLowerCase() === normalized,
  )

  if (!employee) {
    employee = {
      id: uuidv4(),
      name,
      password,
      paymentInfo: '',
      cardHint: '',
      paymentMethods: [],
    }
    db.employees.push(employee)
    await writeDb(db)
  } else if (!employee.password) {
    employee.password = password
    await writeDb(db)
  }

  res.json(toEmployeeDto(employee))
})


app.get('/api/orders', async (_req, res) => {
  const db = await readDb()
  const list = db.orders
    .map((order) => {
      const split = splitBill(order, db.employees)
      const displayStatus = resolveDisplayStatus(order, split)
      const organizer = db.employees.find((e) => e.id === order.createdBy)
      return {
        ...order,
        itemsCount: order.items?.length || 0,
        membersCount: Math.max(
          getOrderMemberIds(order).length,
          order.participantsTarget || 0,
        ),
        estimatedTotal: split.grandTotal,
        displayStatus,
        organizerName: organizer?.name || 'коллега',
      }
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  res.json(list)
})

app.get('/api/orders/:id', async (req, res) => {
  const db = await readDb()
  const order = db.orders.find((o) => o.id === req.params.id)
  if (!order) {
    res.status(404).json({ message: 'Заказ не найден' })
    return
  }
  res.json(order)
})

app.post('/api/orders', async (req, res) => {
  const {
    title,
    place,
    time,
    acceptUntil,
    createdBy,
    deliveryFee,
    discountPercent,
    paymentInfo,
    format,
    budgetPerPerson,
    participantsTarget,
    chooseMode,
  } = req.body || {}

  if (!title || !createdBy) {
    res.status(400).json({ message: 'Нужны title и createdBy' })
    return
  }

  const mode = chooseMode === 'direct' ? 'direct' : 'voting'
  const placeValue = String(place || '').trim()
  const voteOptions =
    mode === 'voting'
      ? [
          ...(placeValue
            ? [{ id: uuidv4(), title: placeValue }]
            : []),
          { id: uuidv4(), title: 'Суши «Сакура»' },
          { id: uuidv4(), title: 'Пицца Дзано' },
          { id: uuidv4(), title: 'Чайхана «Алтын»' },
        ].filter(
          (option, index, list) =>
            list.findIndex((item) => item.title === option.title) === index,
        )
      : []

  const inviteCode = `AL-${Math.floor(1000 + Math.random() * 9000)}`
  const db = await readDb()
  const order = {
    id: uuidv4(),
    title: String(title).trim(),
    place: mode === 'direct' ? placeValue : placeValue,
    time: String(time || '').trim(),
    acceptUntil: String(acceptUntil || '').trim(),
    createdBy,
    deliveryFee: Number(deliveryFee) || 0,
    discountPercent: Number(discountPercent) || 0,
    paymentInfo: String(paymentInfo || '').trim(),
    format: format === 'walk' ? 'walk' : 'delivery',
    budgetPerPerson: Number(budgetPerPerson) || 0,
    participantsTarget: Number(participantsTarget) || 0,
    chooseMode: mode,
    votingActive: mode === 'voting',
    voteOptions,
    votes: [],
    inviteCode,
    walkMeta: format === 'walk' ? '7 мин · 550 м' : '',
    meetingNote:
      format === 'walk'
        ? 'выходим за 5 мин до обеда из холла, 1 этаж. Оплата на месте: каждый платит за себя.'
        : 'собираем позиции и оплачиваем инициатору до оформления доставки.',
    status: 'open',
    createdAt: new Date().toISOString(),
    items: [],
    payments: [],
  }

  db.orders.unshift(order)
  await writeDb(db)
  res.status(201).json(order)
})

app.post('/api/orders/:id/ai-options', async (req, res) => {
  const db = await readDb()
  const order = db.orders.find((o) => o.id === req.params.id)
  if (!order) {
    res.status(404).json({ message: 'Заказ не найден' })
    return
  }

  if (!order.votingActive) {
    res.status(400).json({ message: 'Голосование уже завершено' })
    return
  }

  const suggestions = [
    'Боул-бар',
    'Плов-центр',
    'Рамен Club',
    'Green Salad Bar',
    'Burger Lab',
  ]
  const existing = new Set((order.voteOptions || []).map((item) => item.title))
  const added = []

  for (const title of suggestions) {
    if (existing.has(title)) continue
    const option = { id: uuidv4(), title }
    order.voteOptions.push(option)
    added.push(option)
    if (added.length >= 2) break
  }

  await writeDb(db)
  res.json({ added, order })
})

app.post('/api/orders/:id/end-vote', async (req, res) => {
  const { employeeId } = req.body || {}
  if (!employeeId) {
    res.status(400).json({ message: 'Нужен employeeId' })
    return
  }

  const db = await readDb()
  const order = db.orders.find((o) => o.id === req.params.id)
  if (!order) {
    res.status(404).json({ message: 'Заказ не найден' })
    return
  }

  if (order.createdBy !== employeeId) {
    res.status(403).json({ message: 'Завершить голосование может только организатор' })
    return
  }

  if (!order.votingActive || order.chooseMode !== 'voting') {
    res.status(400).json({ message: 'Голосование по этому заказу не активно' })
    return
  }

  const counts = new Map()
  for (const vote of order.votes || []) {
    counts.set(vote.optionId, (counts.get(vote.optionId) || 0) + 1)
  }

  let winnerId = null
  let winnerCount = -1
  for (const [id, count] of counts.entries()) {
    if (count > winnerCount) {
      winnerCount = count
      winnerId = id
    }
  }

  order.votingActive = false
  const winner = (order.voteOptions || []).find((item) => item.id === winnerId)
  if (winner) {
    order.place = winner.title
  }

  await writeDb(db)
  res.json(order)
})

app.post('/api/orders/:id/vote', async (req, res) => {
  const { employeeId, optionId } = req.body || {}
  if (!employeeId || !optionId) {
    res.status(400).json({ message: 'Нужны employeeId и optionId' })
    return
  }

  const db = await readDb()
  const order = db.orders.find((o) => o.id === req.params.id)
  if (!order) {
    res.status(404).json({ message: 'Заказ не найден' })
    return
  }

  if (!order.votingActive || order.chooseMode !== 'voting') {
    res.status(400).json({ message: 'Голосование по этому заказу не активно' })
    return
  }

  const option = (order.voteOptions || []).find((item) => item.id === optionId)
  if (!option) {
    res.status(400).json({ message: 'Вариант места не найден' })
    return
  }

  if (!Array.isArray(order.votes)) {
    order.votes = []
  }

  const existing = order.votes.find((vote) => vote.employeeId === employeeId)
  if (existing) {
    existing.optionId = optionId
    existing.votedAt = new Date().toISOString()
  } else {
    order.votes.push({
      id: uuidv4(),
      employeeId,
      optionId,
      votedAt: new Date().toISOString(),
    })
  }

  const counts = new Map()
  for (const vote of order.votes) {
    counts.set(vote.optionId, (counts.get(vote.optionId) || 0) + 1)
  }

  let winnerId = null
  let winnerCount = -1
  for (const [id, count] of counts.entries()) {
    if (count > winnerCount) {
      winnerCount = count
      winnerId = id
    }
  }

  const target = order.participantsTarget || 0
  if (target > 0 && order.votes.length >= target) {
    order.votingActive = false
    const winner = (order.voteOptions || []).find((item) => item.id === winnerId)
    if (winner) {
      order.place = winner.title
    }
  }

  await writeDb(db)
  res.json(order)
})

app.post('/api/orders/:id/items', async (req, res) => {
  const { employeeId, name, price } = req.body || {}
  if (!employeeId || !name || price == null) {
    res.status(400).json({ message: 'Нужны employeeId, name, price' })
    return
  }

  const db = await readDb()
  const order = db.orders.find((o) => o.id === req.params.id)
  if (!order) {
    res.status(404).json({ message: 'Заказ не найден' })
    return
  }

  const item = {
    id: uuidv4(),
    employeeId,
    name: String(name).trim(),
    price: Math.round(Number(price)),
  }

  order.items.push(item)
  await writeDb(db)
  res.status(201).json(item)
})

app.delete('/api/orders/:id/items/:itemId', async (req, res) => {
  const employeeId = String(req.query.employeeId || req.body?.employeeId || '')
  if (!employeeId) {
    res.status(400).json({ message: 'Нужен employeeId' })
    return
  }

  const db = await readDb()
  const order = db.orders.find((o) => o.id === req.params.id)
  if (!order) {
    res.status(404).json({ message: 'Заказ не найден' })
    return
  }

  const item = order.items.find((i) => i.id === req.params.itemId)
  if (!item) {
    res.status(404).json({ message: 'Позиция не найдена' })
    return
  }

  if (item.employeeId !== employeeId) {
    res.status(403).json({ message: 'Удалить можно только свою позицию' })
    return
  }

  order.items = order.items.filter((i) => i.id !== req.params.itemId)
  await writeDb(db)
  res.json({ ok: true })
})

app.post('/api/orders/:id/parse', async (req, res) => {
  const { text, employeeId } = req.body || {}
  if (!text || !employeeId) {
    res.status(400).json({ message: 'Нужны text и employeeId' })
    return
  }

  const parsed = parseMenuText(text, employeeId)
  if (parsed.length === 0) {
    res.status(400).json({
      message:
        'Не удалось распознать позиции. Формат: «Название 450» или «Название — 450».',
    })
    return
  }

  const db = await readDb()
  const order = db.orders.find((o) => o.id === req.params.id)
  if (!order) {
    res.status(404).json({ message: 'Заказ не найден' })
    return
  }

  const items = parsed.map((item) => ({ ...item, id: uuidv4() }))
  order.items.push(...items)
  await writeDb(db)
  res.status(201).json({ added: items.length, items })
})

app.get('/api/orders/:id/split', async (req, res) => {
  const db = await readDb()
  const order = db.orders.find((o) => o.id === req.params.id)
  if (!order) {
    res.status(404).json({ message: 'Заказ не найден' })
    return
  }
  if (!Array.isArray(order.payments)) {
    order.payments = []
  }
  const split = splitBill(order, db.employees)
  res.json({
    ...split,
    displayStatus: resolveDisplayStatus(order, split),
  })
})

app.post('/api/orders/:id/checkout', async (req, res) => {
  const { employeeId } = req.body || {}
  if (!employeeId) {
    res.status(400).json({ message: 'Нужен employeeId' })
    return
  }

  const db = await readDb()
  const order = db.orders.find((o) => o.id === req.params.id)
  if (!order) {
    res.status(404).json({ message: 'Заказ не найден' })
    return
  }

  if (order.createdBy !== employeeId) {
    res.status(403).json({ message: 'Оплатить заказ может только инициатор' })
    return
  }

  if (order.status === 'cancelled') {
    res.status(400).json({ message: 'Заказ отменён' })
    return
  }

  if (order.status === 'delivered') {
    res.status(400).json({ message: 'Заказ уже доставлен' })
    return
  }

  order.status = 'preparing'
  order.checkedOutAt = new Date().toISOString()
  order.votingActive = false
  await writeDb(db)

  const split = splitBill(order, db.employees)
  res.json({
    order,
    split: {
      ...split,
      displayStatus: resolveDisplayStatus(order, split),
    },
  })
})

app.post('/api/orders/:id/pay', async (req, res) => {
  const { employeeId, method } = req.body || {}
  if (!employeeId) {
    res.status(400).json({ message: 'Нужен employeeId' })
    return
  }

  const payMethod = ['kaspi', 'card'].includes(method) ? method : 'kaspi'

  const db = await readDb()
  const order = db.orders.find((o) => o.id === req.params.id)
  if (!order) {
    res.status(404).json({ message: 'Заказ не найден' })
    return
  }

  if (!Array.isArray(order.payments)) {
    order.payments = []
  }

  if (employeeId === order.createdBy) {
    res.status(400).json({
      message: 'Инициатор получает переводы и оплачивает заказ сам',
    })
    return
  }

  const split = splitBill(order, db.employees)
  const row = split.rows.find((item) => item.employeeId === employeeId)

  if (!row) {
    res.status(400).json({ message: 'Сначала добавьте свои позиции в заказ' })
    return
  }

  if (row.paid) {
    res.status(400).json({ message: 'Вы уже отметили оплату' })
    return
  }

  const payment = {
    id: uuidv4(),
    employeeId,
    amount: row.total,
    method: payMethod,
    channel: 'in_app',
    paidAt: new Date().toISOString(),
  }

  order.payments.push(payment)

  if (order.status === 'open') {
    order.status = 'awaiting_payment'
  }

  await writeDb(db)
  res.status(201).json({
    payment,
    split: splitBill(order, db.employees),
  })
})

app.get('/api/preferences', async (req, res) => {
  const db = await readDb()
  const date = req.query.date || todayLocal()
  const list = db.preferences
    .filter((p) => p.date === date)
    .map((p) => ({
      ...p,
      employee: db.employees.find((e) => e.id === p.employeeId) || null,
    }))
  res.json(list)
})

app.post('/api/preferences', async (req, res) => {
  const { employeeId, cuisine, cuisines, format, intensity, notes } =
    req.body || {}
  const cuisineList = Array.isArray(cuisines)
    ? cuisines.map((item) => String(item).trim()).filter(Boolean)
    : []
  const cuisineValue =
    cuisineList.length > 0
      ? cuisineList.join(', ')
      : String(cuisine || '').trim()

  if (!employeeId || !cuisineValue || !format || !intensity) {
    res
      .status(400)
      .json({ message: 'Нужны employeeId, cuisine/cuisines, format, intensity' })
    return
  }

  const db = await readDb()
  const date = todayLocal()
  const existing = db.preferences.find(
    (p) => p.employeeId === employeeId && p.date === date,
  )

  const payload = {
    employeeId,
    date,
    cuisine: cuisineValue,
    cuisines: cuisineList.length > 0 ? cuisineList : [cuisineValue],
    format,
    intensity,
    notes: String(notes || '').trim(),
  }

  if (existing) {
    Object.assign(existing, payload)
    await writeDb(db)
    res.json(existing)
    return
  }

  const preference = { id: uuidv4(), ...payload }
  db.preferences.push(preference)
  await writeDb(db)
  res.status(201).json(preference)
})

app.post('/api/preferences/ai-pick', async (req, res) => {
  const {
    employeeId,
    cuisines = [],
    format,
    intensity,
    notes = '',
  } = req.body || {}

  if (!employeeId || !format || !intensity) {
    res.status(400).json({ message: 'Нужны employeeId, format, intensity' })
    return
  }

  const cuisineList = Array.isArray(cuisines) ? cuisines : []
  const catalog = [
    {
      id: 'ai1',
      title: 'Суши «Сакура»',
      cuisines: ['Японская'],
      intensity: 'легко',
      format: 'доставка',
      eta: '35 мин',
      priceRange: '2 500–4 500 ₸',
      reason: 'лёгкие роллы и супы под ваш запрос',
      fitHint: 'компромисс: не всем нравятся роллы',
      tone: 'peach',
    },
    {
      id: 'ai2',
      title: 'Боул-бар Green',
      cuisines: ['Боулы и салаты'],
      intensity: 'легко',
      format: 'доставка',
      eta: '25 мин',
      priceRange: '2 200–3 800 ₸',
      reason: 'свежие боулы без острого',
      fitHint: 'лёгкий вариант без острого',
      tone: 'mint',
    },
    {
      id: 'ai3',
      title: 'Пицца Дзано',
      cuisines: ['Итальянская'],
      intensity: 'сытно',
      format: 'доставка',
      eta: '40 мин',
      priceRange: '3 000–5 000 ₸',
      reason: 'сытный вариант на компанию',
      fitHint: 'дешевле на 600 ₸ на человека',
      tone: 'yellow',
    },
    {
      id: 'ai4',
      title: 'Чайхана «Алтын»',
      cuisines: ['Узбекская'],
      intensity: 'сытно',
      format: 'пешком',
      eta: 'пешком 7 мин',
      priceRange: '2 000–3 500 ₸',
      reason: 'рядом с офисом, можно сходить вместе',
      fitHint: 'можно дойти пешком за 7 минут',
      tone: 'yellow',
    },
    {
      id: 'ai5',
      title: 'Хинкальная №1',
      cuisines: ['Грузинская'],
      intensity: 'обычно',
      format: 'пешком',
      eta: 'пешком 10 мин',
      priceRange: '2 400–4 000 ₸',
      reason: 'средний формат и тёплые блюда',
      fitHint: 'тёплые блюда рядом с офисом',
      tone: 'peach',
    },
    {
      id: 'ai6',
      title: 'Рамен Club',
      cuisines: ['Японская'],
      intensity: 'обычно',
      format: 'доставка',
      eta: '30 мин',
      priceRange: '2 800–4 200 ₸',
      reason: 'тёплый рамен без орехов',
      fitHint: 'тёплый вариант под заметку',
      tone: 'yellow',
    },
    {
      id: 'ai7',
      title: 'Salad & Soup',
      cuisines: ['Боулы и салаты', 'Любая'],
      intensity: 'легко',
      format: 'доставка',
      eta: '20 мин',
      priceRange: '1 800–3 200 ₸',
      reason: 'лёгкий обед по ограничениям',
      fitHint: 'подходит под ограничения в заметке',
      tone: 'mint',
    },
    {
      id: 'ai8',
      title: 'Плов-центр',
      cuisines: ['Узбекская', 'Любая'],
      intensity: 'сытно',
      format: 'пешком',
      eta: 'пешком 7 мин',
      priceRange: '2 000–3 500 ₸',
      reason: 'сытно и недалеко от офиса',
      fitHint: 'можно дойти пешком за 7 минут',
      tone: 'mint',
    },
  ]

  const maxRaw = 112
  const teamSize = 7

  const scored = catalog
    .map((place) => {
      let score = 0
      const reasons = []

      if (cuisineList.length === 0 || cuisineList.includes('Любая')) {
        score += 10
      } else if (place.cuisines.some((item) => cuisineList.includes(item))) {
        score += 40
        reasons.push('совпадает кухня')
      }

      if (place.intensity === intensity) {
        score += 30
        reasons.push('нужная насыщенность')
      } else if (
        (intensity === 'обычно' && place.intensity !== intensity) ||
        (place.intensity === 'обычно' && intensity !== 'обычно')
      ) {
        score += 10
      }

      if (place.format === format) {
        score += 25
        reasons.push(format === 'доставка' ? 'доставка в офис' : 'можно пешком')
      }

      if (notes && /тепло|тёпл/i.test(notes) && /рамен|плов|хинкал|суп/i.test(place.title + place.reason)) {
        score += 12
        reasons.push('тёплое блюдо')
      }

      if (notes && /не остр|без остр/i.test(notes)) {
        score += 5
      }

      const matchPercent = Math.min(98, Math.max(55, Math.round((score / maxRaw) * 100)))
      const fitCount = Math.min(teamSize, Math.max(3, Math.round((matchPercent / 100) * teamSize)))

      return {
        ...place,
        score,
        matchPercent,
        fitCount,
        teamSize,
        fitNote: `Подходит ${fitCount} из ${teamSize} · ${place.fitHint}`,
        reasons: reasons.length > 0 ? reasons : [place.reason],
      }
    })
    .filter((place) => place.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const picks =
    scored.length > 0
      ? scored
      : catalog.slice(0, 3).map((place, index) => ({
          ...place,
          score: 40 - index * 5,
          matchPercent: 78 - index * 7,
          fitCount: 5 - index,
          teamSize,
          fitNote: `Подходит ${5 - index} из ${teamSize} · ${place.fitHint}`,
          reasons: [place.reason],
        }))

  const db = await readDb()
  const date = todayLocal()
  const existing = db.preferences.find(
    (p) => p.employeeId === employeeId && p.date === date,
  )
  const preferencePayload = {
    employeeId,
    date,
    cuisine: cuisineList.join(', ') || 'Любая',
    cuisines: cuisineList.length > 0 ? cuisineList : ['Любая'],
    format,
    intensity,
    notes: String(notes || '').trim(),
    aiPicks: picks,
  }

  if (existing) {
    Object.assign(existing, preferencePayload)
  } else {
    db.preferences.push({ id: uuidv4(), ...preferencePayload })
  }
  await writeDb(db)

  res.json({
    summary: `Подобрали ${picks.length} варианта под ваши ответы`,
    picks,
  })
})

app.post('/api/match', async (_req, res) => {
  const db = await readDb()
  const result = matchLunches(db.preferences, db.employees)
  db.matches.unshift({
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    ...result,
  })
  await writeDb(db)
  res.json(result)
})

await ensurePreferenceDates()

app.listen(PORT, () => {
  console.log(`Office Chef API → http://localhost:${PORT}`)
})
