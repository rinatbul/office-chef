import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useOrders } from '../hooks/useOrders'
import {
  formatMoney,
  formatOrderWhen,
  getFirstName,
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

  const filtered = useMemo(
    () => orders.filter((order) => matchesFilter(order, filter)),
    [orders, filter],
  )

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

      {!isPending && filtered.length === 0 ? (
        <div className="orders-empty">{EMPTY_TEXT[filter]}</div>
      ) : null}

      <ul className="orders-cards">
        {filtered.map((order) => {
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
        })}
      </ul>
    </section>
  )
}
