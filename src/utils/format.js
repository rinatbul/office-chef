const WEEKDAYS = [
  'Воскресенье',
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
]

const MONTHS = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

export const getInitials = (name = '') => {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export const getFirstName = (name = '') => {
  return name.split(' ').filter(Boolean)[0] || name
}

export const formatHomeDate = (date = new Date()) => {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`
}

export const formatRelativeTime = (iso) => {
  if (!iso) return ''
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.max(1, Math.round(diffMs / 60000))
  if (minutes < 60) return `${minutes} мин. назад`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} ч. назад`
  const days = Math.round(hours / 24)
  return `${days} дн. назад`
}

export const formatMoney = (value) => {
  return `${Number(value || 0).toLocaleString('ru-RU')} ₸`
}

export const getOrderDayDiff = (iso, now = new Date()) => {
  if (!iso) return null
  const date = new Date(iso)
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startThat = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.round((startThat - startToday) / 86400000)
}

export const formatOrderWhen = (iso, time) => {
  const timeLabel = time || '—'
  if (!iso) return timeLabel

  const dayDiff = getOrderDayDiff(iso)

  if (dayDiff === 0) return `Сегодня, ${timeLabel}`
  if (dayDiff === 1) return `Завтра, ${timeLabel}`
  if (dayDiff === -1) return `Вчера, ${timeLabel}`

  const date = new Date(iso)
  return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${timeLabel}`
}

export const ORDER_STATUS_META = {
  voting: { label: 'Идёт голосование', tone: 'voting' },
  open: { label: 'Ждёт участников', tone: 'neutral' },
  awaiting_payment: { label: 'Ожидает оплаты', tone: 'danger' },
  preparing: { label: 'Готовится', tone: 'warn' },
  delivered: { label: 'Завершён', tone: 'ok' },
  cancelled: { label: 'Отменён', tone: 'muted' },
}

export const isActiveVoting = (order) =>
  (order?.status === 'open' || !order?.status) &&
  order?.votingActive &&
  order?.chooseMode === 'voting'

export const resolveOrderDisplayStatus = (order) => {
  if (order?.displayStatus) return order.displayStatus
  if (isActiveVoting(order)) return 'voting'
  return order?.status || 'open'
}

export const getOrderStatusMeta = (order) => {
  const status = resolveOrderDisplayStatus(order)
  return ORDER_STATUS_META[status] || ORDER_STATUS_META.open
}

export const AVATAR_COLORS = ['#f4b59a', '#f2d27a', '#9fd4c1', '#9bb7f0', '#e8a0bf', '#b8d47a']
