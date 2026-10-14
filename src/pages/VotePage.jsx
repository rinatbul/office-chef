import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useOrder, useVoteOrder } from '../hooks/useOrders'

export const VotePage = () => {
  const { id } = useParams()
  const { userId } = useCurrentUser()
  const { data: order, isPending, error } = useOrder(id)
  const voteOrder = useVoteOrder(id)
  const navigate = useNavigate()
  const [selected, setSelected] = useState('')
  const [formError, setFormError] = useState('')

  const myVote = order?.votes?.find((vote) => vote.employeeId === userId)
  const activeOptionId = selected || myVote?.optionId || ''
  const hasSelection = Boolean(activeOptionId)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    if (!activeOptionId) {
      setFormError('Выберите место')
      return
    }

    try {
      await voteOrder.mutateAsync({
        employeeId: userId,
        optionId: activeOptionId,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setFormError(err.message)
    }
  }

  if (isPending) {
    return <p className="muted">Загрузка голосования…</p>
  }

  if (error || !order) {
    return <p className="form-error">{error?.message || 'Заказ не найден'}</p>
  }

  return (
    <section className="vote-page">
      <div className="create-order__top">
        <Link to="/" className="auth-back" aria-label="Назад">
          <span aria-hidden="true">‹</span>
        </Link>
        <div>
          <p className="create-order__eyebrow">Голосование</p>
          <h1>{order.title}</h1>
        </div>
      </div>

      <p className="muted">
        {order.acceptUntil
          ? `Проголосуйте до ${order.acceptUntil}`
          : 'Выберите место для обеда'}
      </p>

      <form className="vote-page__form" onSubmit={handleSubmit}>
        <div className="vote-options">
          {(order.voteOptions || []).map((option) => {
            const votesCount = (order.votes || []).filter(
              (vote) => vote.optionId === option.id,
            ).length
            const isActive = activeOptionId === option.id

            return (
              <button
                key={option.id}
                type="button"
                className={`choice-card choice-card--wide vote-option${isActive ? ' is-active' : ''}`}
                onClick={() => setSelected(option.id)}
              >
                <span className="vote-option__copy">
                  <strong>{option.title}</strong>
                  <span>{votesCount} голос.</span>
                </span>
                {isActive ? (
                  <span className="vote-option__check" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="14" height="14">
                      <path
                        d="M5 12.5l4.5 4.5L19 7.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>

        {formError ? <p className="form-error">{formError}</p> : null}

        <button
          type="submit"
          className={`btn btn-block${hasSelection ? ' btn-primary' : ' btn-soft'}`}
          disabled={voteOrder.isPending || !order.votingActive}
        >
          {voteOrder.isPending
            ? 'Отправляем…'
            : myVote
              ? 'Изменить голос'
              : 'Проголосовать'}
        </button>
      </form>
    </section>
  )
}
