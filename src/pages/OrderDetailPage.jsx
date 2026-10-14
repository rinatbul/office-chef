import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AddItemForm } from '../components/AddItemForm'
import { ItemsTable } from '../components/ItemsTable'
import { ParseMenuForm } from '../components/ParseMenuForm'
import { PaymentPanel } from '../components/PaymentPanel'
import { SplitTable } from '../components/SplitTable'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useEmployees } from '../hooks/useEmployees'
import {
  useAddOrderItem,
  useCompleteOrder,
  useDeleteOrderItem,
  useEndOrderVote,
  useOrder,
  useOrderSplit,
  useParseOrderMenu,
  useSuggestAiOptions,
} from '../hooks/useOrders'
import {
  AVATAR_COLORS,
  formatRelativeTime,
  getInitials,
} from '../utils/format'

export const OrderDetailPage = () => {
  const { id } = useParams()
  const { data: order, isPending, error } = useOrder(id)
  const { data: split } = useOrderSplit(id)
  const { data: employees = [] } = useEmployees()
  const { userId } = useCurrentUser()
  const addItem = useAddOrderItem(id)
  const deleteItem = useDeleteOrderItem(id)
  const parseMenu = useParseOrderMenu(id)
  const suggestAi = useSuggestAiOptions(id)
  const endVote = useEndOrderVote(id)
  const completeOrder = useCompleteOrder(id)
  const [copied, setCopied] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState(null)
  const [aiError, setAiError] = useState('')
  const [endVoteError, setEndVoteError] = useState('')
  const [completeError, setCompleteError] = useState('')

  const employeeMap = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e])),
    [employees],
  )

  const handleCopyInvite = async () => {
    if (!order?.inviteCode) return
    try {
      await navigator.clipboard.writeText(order.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const handleAiSuggest = async () => {
    setAiError('')
    setAiSuggestions(null)
    try {
      const result = await suggestAi.mutateAsync()
      setAiSuggestions(result.added || [])
    } catch (err) {
      setAiError(err.message)
    }
  }

  const handleEndVote = async () => {
    setEndVoteError('')
    try {
      await endVote.mutateAsync(userId)
    } catch (err) {
      setEndVoteError(err.message)
    }
  }

  const handleCompleteOrder = async () => {
    setCompleteError('')
    try {
      await completeOrder.mutateAsync(userId)
    } catch (err) {
      setCompleteError(err.message)
    }
  }

  if (isPending) {
    return <p className="muted">Загрузка заказа…</p>
  }

  if (error) {
    return <p className="form-error">{error.message}</p>
  }

  if (!order) {
    return <p className="form-error">Заказ не найден</p>
  }

  const isOrganizer = order.createdBy === userId
  const canCloseOrder =
    isOrganizer &&
    !order.votingActive &&
    order.status !== 'delivered' &&
    order.status !== 'cancelled'
  const memberIds = [
    ...new Set([
      order.createdBy,
      ...(order.votes || []).map((vote) => vote.employeeId),
      ...(order.items || []).map((item) => item.employeeId),
    ]),
  ]
  const participantsCount = Math.max(memberIds.length, 1)
  const votesCount = order.votes?.length || 0
  const voteProgress = Math.min(
    100,
    Math.round((votesCount / participantsCount) * 100),
  )
  const previewMembers = memberIds.slice(0, 5)

  const activity = [
    ...(order.votes || []).map((vote) => {
      const option = (order.voteOptions || []).find((item) => item.id === vote.optionId)
      return {
        id: vote.id,
        text: `${employeeMap[vote.employeeId]?.name || 'Коллега'} проголосовал за «${option?.title || 'место'}»`,
        at: vote.votedAt,
      }
    }),
    ...(order.items || []).slice(-3).map((item) => ({
      id: item.id,
      text: `${employeeMap[item.employeeId]?.name || 'Коллега'} добавил «${item.name}»`,
      at: order.createdAt,
    })),
  ]
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, 4)

  return (
    <section className="order-detail">
      <div className="create-order__top">
        <Link to="/orders" className="auth-back auth-back--plain" aria-label="Назад">
          <span aria-hidden="true">‹</span>
        </Link>
        <div>
          <p className="create-order__eyebrow">
            Организатор: {isOrganizer ? 'вы' : employeeMap[order.createdBy]?.name || 'коллега'}
          </p>
          <h1>{order.title}</h1>
        </div>
      </div>

      {isOrganizer && order.format === 'delivery' && !order.votingActive ? (
        <Link
          className="btn btn-primary btn-block order-detail__primary"
          to={`/orders/${order.id}/summary`}
        >
          Итог заказа
        </Link>
      ) : null}

      <article className="od-card">
        <div className="od-card__row">
          <h2>Участники · {memberIds.length}</h2>
          <div className="avatar-stack">
            {previewMembers.map((memberId, index) => (
              <span
                key={memberId}
                className="avatar-stack__item avatar-stack__item--light"
                style={{ background: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
              >
                {getInitials(employeeMap[memberId]?.name || '?')}
              </span>
            ))}
          </div>
        </div>
        <div className="od-invite">
          <span>Приглашение</span>
          <button type="button" className="od-invite__chip" onClick={handleCopyInvite}>
            {order.inviteCode || 'AL-0000'} · {copied ? 'Скопировано' : 'Копировать'}
          </button>
        </div>
      </article>

      {order.chooseMode === 'voting' ? (
        <article className="od-card">
          <div className="od-card__row">
            <h2>{order.votingActive ? 'Голосование идёт' : 'Голосование завершено'}</h2>
            {order.acceptUntil ? (
              <span className="od-pill od-pill--warn">до {order.acceptUntil}</span>
            ) : null}
          </div>
          <div className="od-progress">
            <span style={{ width: `${voteProgress}%` }} />
          </div>
          <p className="od-card__note">
            Проголосовали {votesCount}
            {memberIds.length > 0 ? ` из ${memberIds.length}` : ''} · голоса видны
            всем
          </p>
          {!isOrganizer && order.votingActive ? (
            <Link className="btn btn-primary btn-block" to={`/orders/${order.id}/vote`}>
              Проголосовать
            </Link>
          ) : null}
        </article>
      ) : null}

      <article className="od-card od-card--accent">
        <div className="od-card__row">
          <h2>{order.format === 'walk' ? 'Идём пешком' : 'Доставка в офис'}</h2>
          {order.walkMeta ? (
            <span className="od-pill od-pill--ok">{order.walkMeta}</span>
          ) : null}
        </div>
        <p className="od-card__text">
          {order.place || 'Место ещё выбирается'}
          {order.time ? ` · к ${order.time}` : ''}
          {order.meetingNote ? `. ${order.meetingNote}` : ''}
        </p>
      </article>

      {activity.length > 0 ? (
        <section className="od-section">
          <h3>Активность</h3>
          <article className="od-card od-activity">
            {activity.map((item) => (
              <p key={item.id}>
                {item.text}
                <span>{formatRelativeTime(item.at)}</span>
              </p>
            ))}
          </article>
        </section>
      ) : null}

      {order.votingActive ? (
        <div className="ai-suggest">
          <button
            type="button"
            className="btn btn-soft btn-block"
            onClick={handleAiSuggest}
            disabled={suggestAi.isPending}
          >
            {suggestAi.isPending ? 'Подбираем…' : 'Предложить ИИ-варианты'}
          </button>

          {aiError ? <p className="form-error">{aiError}</p> : null}

          {aiSuggestions ? (
            <article className="ai-suggest__card">
              <div className="ai-suggest__head">
                <span className="ai-suggest__badge">ИИ</span>
                <div>
                  <strong>
                    {aiSuggestions.length > 0
                      ? `Добавили ${aiSuggestions.length} варианта`
                      : 'Новых вариантов нет'}
                  </strong>
                  <p>
                    {aiSuggestions.length > 0
                      ? 'Места добавлены в голосование — можно выбрать их в опросе'
                      : 'Все предложенные места уже есть в списке'}
                  </p>
                </div>
              </div>
              {aiSuggestions.length > 0 ? (
                <ul className="ai-suggest__list">
                  {aiSuggestions.map((item, index) => (
                    <li key={item.id} className="ai-suggest__item">
                      <span
                        className={`ai-suggest__icon ai-suggest__icon--${index % 2 === 0 ? 'peach' : 'mint'}`}
                        aria-hidden="true"
                      />
                      <strong>{item.title}</strong>
                      <em>в голосовании</em>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ) : null}

          {isOrganizer ? (
            <>
              {endVoteError ? <p className="form-error">{endVoteError}</p> : null}
              <button
                type="button"
                className="btn btn-primary btn-block order-detail__primary"
                onClick={handleEndVote}
                disabled={endVote.isPending}
              >
                {endVote.isPending ? 'Завершаем…' : 'Завершить голосование'}
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {canCloseOrder ? (
        <div className="ai-suggest">
          {completeError ? <p className="form-error">{completeError}</p> : null}
          <button
            type="button"
            className="btn btn-primary btn-block order-detail__primary"
            onClick={handleCompleteOrder}
            disabled={completeOrder.isPending}
          >
            {completeOrder.isPending ? 'Закрываем…' : 'Закрыть заказ'}
          </button>
        </div>
      ) : null}

      {order.format === 'delivery' ? (
        <>
          <section className="od-section">
            <h3>Ваш заказ</h3>
            <AddItemForm
              employeeId={userId}
              isPending={addItem.isPending}
              onSubmit={(payload) => addItem.mutateAsync(payload)}
            />
            <ParseMenuForm
              employeeId={userId}
              isPending={parseMenu.isPending}
              onSubmit={(payload) => parseMenu.mutateAsync(payload)}
            />
          </section>

          {(order.items || []).length > 0 ? (
            <>
              <section className="od-section">
                <h3>Позиции</h3>
                <article className="od-card od-card--flush">
                  <ItemsTable
                    items={order.items || []}
                    employees={employees}
                    currentUserId={userId}
                    isDeleting={deleteItem.isPending}
                    onDelete={(itemId) =>
                      deleteItem.mutate({ itemId, employeeId: userId })
                    }
                  />
                </article>
              </section>

              <section className="od-section">
                <h3>Разделение чека</h3>
                <article className="od-card">
                  <SplitTable split={split} />
                </article>
              </section>

              <section className="od-section">
                <h3>Оплата инициатору</h3>
                <PaymentPanel
                  split={split}
                  currentUserId={userId}
                  orderId={order.id}
                />
              </section>
            </>
          ) : null}
        </>
      ) : (
        <article className="od-card od-card--soft">
          <h2>Оплата на месте</h2>
          <p className="od-card__text">
            Это поход в заведение: позиции в приложении не собираем. Каждый
            платит за себя на месте.
          </p>
        </article>
      )}
    </section>
  )
}
