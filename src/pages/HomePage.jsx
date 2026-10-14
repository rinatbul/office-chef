import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useEmployees } from '../hooks/useEmployees'
import { useOrders } from '../hooks/useOrders'
import {
  AVATAR_COLORS,
  formatMoney,
  formatRelativeTime,
  getFirstName,
  getInitials,
  isActiveVoting,
} from '../utils/format'

export const HomePage = () => {
  const { userId, userName } = useCurrentUser()
  const { data: orders = [], isPending } = useOrders()
  const { data: employees = [] } = useEmployees()
  const carouselRef = useRef(null)
  const [slide, setSlide] = useState(0)

  const employeeMap = Object.fromEntries(employees.map((e) => [e.id, e]))

  const votingOrders = orders.filter(isActiveVoting)
  const pendingVotes = votingOrders.filter(
    (order) =>
      order.createdBy !== userId &&
      !(order.votes || []).some((vote) => vote.employeeId === userId),
  )
  const otherOpenOrders = orders.filter(
    (order) => order.status === 'open' && !isActiveVoting(order),
  )
  const activeOrders = [...votingOrders, ...otherOpenOrders]

  const notifications = [
    ...pendingVotes.map((order) => ({
      id: `invite-${order.id}`,
      type: 'invite',
      employee: employeeMap[order.createdBy],
      title: `${getFirstName(employeeMap[order.createdBy]?.name || 'Коллега')} запустил голосование`,
      text: `${order.title}${order.acceptUntil ? ` · проголосуйте до ${order.acceptUntil}` : ''}`,
      feedText: `${employeeMap[order.createdBy]?.name || 'Коллега'} пригласил вас на обед`,
      at: order.createdAt,
      to: `/orders/${order.id}/vote`,
    })),
    ...orders.flatMap((order) =>
      (order.payments || []).map((payment) => ({
        id: payment.id,
        type: 'payment',
        employee: employeeMap[payment.employeeId],
        title: `${getFirstName(employeeMap[payment.employeeId]?.name || 'Коллега')} оплатил долю`,
        text: `${formatMoney(payment.amount)} · ${order.place || order.title}`,
        feedText: `${employeeMap[payment.employeeId]?.name || 'Коллега'} оплатил ${formatMoney(payment.amount)}`,
        at: payment.paidAt,
        to: `/orders/${order.id}`,
      })),
    ),
  ].sort((a, b) => String(b.at).localeCompare(String(a.at)))

  const latestNotification = notifications[0] || null

  useEffect(() => {
    setSlide(0)
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ left: 0 })
    }
  }, [activeOrders.length])

  const handleCarouselScroll = () => {
    const node = carouselRef.current
    if (!node) return
    const width = node.clientWidth || 1
    const next = Math.round(node.scrollLeft / width)
    setSlide(Math.min(Math.max(next, 0), activeOrders.length - 1))
  }

  const goToSlide = (index) => {
    const node = carouselRef.current
    if (!node) return
    node.scrollTo({
      left: index * node.clientWidth,
      behavior: 'smooth',
    })
    setSlide(index)
  }

  const renderOrderCard = (order, options = {}) => {
    const voting = isActiveVoting(order)
    const isInitiator = order.createdBy === userId
    const myVote = (order.votes || []).find((vote) => vote.employeeId === userId)
    const hasVoted = Boolean(myVote)
    const memberIds = [
      ...new Set([
        order.createdBy,
        ...(order.votes || []).map((vote) => vote.employeeId),
        ...(order.items || []).map((item) => item.employeeId),
      ]),
    ]
    const previewMembers = memberIds.slice(0, 4)
    const votesCount = order.votes?.length || 0
    const participantsCount = Math.max(memberIds.length, 1)

    return (
      <article
        key={order.id}
        className={`home-hero-card${options.inCarousel ? ' home-hero-card--slide' : ''}`}
      >
        <div className="home-hero-card__meta">
          <span className="home-hero-card__badge">
            {voting
              ? 'Идёт голосование'
              : order.format === 'walk'
                ? 'Идём пешком'
                : 'Идёт сбор'}
          </span>
          {voting && order.acceptUntil ? (
            <span>до {order.acceptUntil}</span>
          ) : order.time ? (
            <span>к {order.time}</span>
          ) : null}
        </div>
        <h2>{order.title}</h2>
        <div className="home-hero-card__people">
          <div className="avatar-stack">
            {previewMembers.map((id, index) => (
              <span
                key={id}
                className="avatar-stack__item"
                style={{ background: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
              >
                {getInitials(employeeMap[id]?.name || '?')}
              </span>
            ))}
          </div>
          <p>
            {voting
              ? isInitiator
                ? `${votesCount} из ${participantsCount} проголосовали`
                : hasVoted
                  ? 'Вы уже проголосовали'
                  : 'Вы ещё не проголосовали'
              : `${memberIds.length} в заказе`}
          </p>
        </div>
        {voting && !isInitiator && !hasVoted ? (
          <Link className="btn btn-primary btn-block" to={`/orders/${order.id}/vote`}>
            Проголосовать
          </Link>
        ) : (
          <Link className="btn btn-primary btn-block" to={`/orders/${order.id}`}>
            Открыть заказ
          </Link>
        )}
      </article>
    )
  }

  return (
    <section className="home">
      <header className="home-header">
        <h1>Привет, {getFirstName(userName)}</h1>
        <Link to="/profile" className="home-avatar" aria-label="Профиль">
          {getInitials(userName)}
        </Link>
      </header>

      {isPending ? <p className="muted">Загрузка…</p> : null}

      {latestNotification ? (
        <Link to={latestNotification.to} className="home-alert">
          <span className="home-alert__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                d="M12 22a2.2 2.2 0 0 0 2.1-1.5H9.9A2.2 2.2 0 0 0 12 22Zm7-5.5V11a7 7 0 1 0-14 0v5.5L3 18.5V20h18v-1.5l-2-2Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div className="home-alert__copy">
            <strong>{latestNotification.title}</strong>
            <span>{latestNotification.text}</span>
          </div>
          <span className="home-alert__badge">Новое</span>
        </Link>
      ) : null}

      {activeOrders.length > 0 ? (
        <section className="home-carousel" aria-label="Активные обеды">
          <div
            ref={carouselRef}
            className={`home-carousel__track${activeOrders.length === 1 ? ' is-single' : ''}`}
            onScroll={handleCarouselScroll}
          >
            {activeOrders.map((order) => (
              <div key={order.id} className="home-carousel__slide">
                {renderOrderCard(order, { inCarousel: true })}
              </div>
            ))}
          </div>

          {activeOrders.length > 1 ? (
            <div className="home-carousel__dots" role="tablist" aria-label="Слайды">
              {activeOrders.map((order, index) => (
                <button
                  key={order.id}
                  type="button"
                  role="tab"
                  aria-selected={slide === index}
                  aria-label={`Обед ${index + 1}`}
                  className={`home-carousel__dot${slide === index ? ' is-active' : ''}`}
                  onClick={() => goToSlide(index)}
                />
              ))}
            </div>
          ) : null}
        </section>
      ) : (
        <article className="home-hero-card home-hero-card--empty">
          <h2>Пока нет активного заказа</h2>
          <p>Создайте первый — коллеги смогут присоединиться и скинуться.</p>
        </article>
      )}

      <div className="home-actions">
        <Link className="btn btn-primary" to="/orders/new">
          Создать заказ
        </Link>
        <Link className="btn btn-soft" to="/orders">
          Присоединиться
        </Link>
      </div>

      {notifications.length > 0 ? (
        <section className="home-section home-section--feed">
          <div className="home-feed">
            {notifications.map((item) => (
              <Link
                key={item.id}
                to={item.to || '/'}
                className="home-feed__item"
              >
                <span
                  className="home-feed__avatar"
                  style={{
                    background: item.type === 'invite' ? '#c5d9f2' : '#b8e0d2',
                  }}
                >
                  {getInitials(item.employee?.name || '?')}
                </span>
                <div>
                  <p>{item.feedText}</p>
                  <span>{formatRelativeTime(item.at)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  )
}
