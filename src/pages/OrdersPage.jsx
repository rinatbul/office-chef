import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useOrders } from '../hooks/useOrders'
import {
  formatMoney,
  formatOrderWhen,
  getFirstName,
  getOrderDayDiff,
  getOrderStatusMeta,
  isActiveVoting,
  resolveOrderDisplayStatus,
} from '../utils/format'

const FILTERS = [
  { id: 'active', label: 'Активные' },
  { id: 'done', label: 'Завершённые' },
]

const EMPTY_TEXT = {
  active: 'Активных заказов нет',
  done: 'Завершённых заказов нет',
}

const matchesFilter = (order, filterId) => {
  const status = resolveOrderDisplayStatus(order)

  if (filterId === 'done') return status === 'delivered'

  return (
    status === 'open' ||
    status === 'voting' ||
    status === 'awaiting_payment' ||
    status === 'preparing'
  )
}

export const OrdersPage = () => {
  const { data: orders = [], isPending, error } = useOrders()
  const { userId } = useCurrentUser()
  const [filter, setFilter] = useState('active')
  const [yesterdayExpanded, setYesterdayExpanded] = useState(false)

  const filtered = useMemo(
    () => orders.filter((order) => matchesFilter(order, filter)),
    [orders, filter],
  )

  const { todayOrders, yesterdayOrders } = useMemo(() => {
    const today = []
    const yesterday = []

    filtered.forEach((order) => {
      const dayDiff = getOrderDayDiff(order.createdAt)
      if (dayDiff === 0) today.push(order)
      else if (dayDiff === -1) yesterday.push(order)
    })

    return { todayOrders: today, yesterdayOrders: yesterday }
  }, [filtered])

  const visibleYesterday = yesterdayExpanded
    ? yesterdayOrders
    : yesterdayOrders.slice(0, 1)

  const hasAny = todayOrders.length > 0 || yesterdayOrders.length > 0

  const renderOrderCard = (order) => {
    const status = resolveOrderDisplayStatus(order)
    const meta = getOrderStatusMeta(order)
    const voting = isActiveVoting(order)
    const isOrganizer = order.createdBy === userId
    const organizerLabel = isOrganizer
      ? 'вы'
      : getFirstName(order.organizerName || 'коллега')
    const title = order.place || order.title
    const votesCount = order.votes?.length || 0
    const membersCount = order.membersCount || 0
    const footLabel = voting
      ? `${votesCount} проголосовали`
      : `${membersCount} участников`
    const to =
      isOrganizer &&
      !order.votingActive &&
      (status === 'awaiting_payment' || status === 'preparing')
        ? `/orders/${order.id}/summary`
        : voting && !isOrganizer
          ? `/orders/${order.id}/vote`
          : `/orders/${order.id}`

    return (
      <li key={order.id}>
        <Link to={to} className="orders-card">
          <div className="orders-card__top">
            <strong>{title}</strong>
            <span className={`orders-badge orders-badge--${meta.tone}`}>
              {meta.label}
            </span>
          </div>
          <p className="orders-card__meta">
            {formatOrderWhen(order.createdAt, order.time)} · организатор:{' '}
            {organizerLabel}
            {voting && order.acceptUntil ? ` · до ${order.acceptUntil}` : ''}
          </p>
          <div className="orders-card__foot">
            <span>{footLabel}</span>
            <b>{formatMoney(order.estimatedTotal || 0)}</b>
          </div>
        </Link>
      </li>
    )
  }

  return (
    <section className="orders-page">
      <div className="create-order__top">
        <div>
          <h1>Заказы</h1>
        </div>
      </div>

      <div className="orders-filters" role="tablist" aria-label="Фильтр заказов">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            className={`orders-filters__chip${filter === item.id ? ' is-active' : ''}`}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isPending ? <p className="muted">Загрузка…</p> : null}
      {error ? <p className="form-error">{error.message}</p> : null}

      {!isPending && !hasAny ? (
        <div className="orders-empty">{EMPTY_TEXT[filter]}</div>
      ) : null}

      {todayOrders.length > 0 ? (
        <section className="orders-section">
          <h3>Сегодня</h3>
          <ul className="orders-cards">{todayOrders.map(renderOrderCard)}</ul>
        </section>
      ) : null}

      {yesterdayOrders.length > 0 ? (
        <section className="orders-section">
          <div className="home-feed__header">
            <h3>Вчера</h3>
            {yesterdayOrders.length > 1 ? (
              <button
                type="button"
                className={`home-feed__more${yesterdayExpanded ? ' is-expanded' : ''}`}
                onClick={() => setYesterdayExpanded((prev) => !prev)}
              >
                <span>{yesterdayExpanded ? 'Свернуть' : 'Смотреть все'}</span>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path
                    d="M6 9l6 6 6-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : null}
          </div>
          <ul className="orders-cards">{visibleYesterday.map(renderOrderCard)}</ul>
        </section>
      ) : null}
    </section>
  )
}
