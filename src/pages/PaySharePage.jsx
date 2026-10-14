import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useEmployee } from '../hooks/useEmployees'
import { useOrder, useOrderSplit, usePayOrderShare } from '../hooks/useOrders'
import { formatMoney, getFirstName } from '../utils/format'

const METHODS = [
  { id: 'card', title: 'Карта', apiMethod: 'card' },
  { id: 'apple', title: 'Apple Pay', apiMethod: 'kaspi' },
]

const getCardLabel = (profile) => {
  const source = profile?.paymentInfo || profile?.cardHint || ''
  const digits = String(source).replace(/\D/g, '')
  if (digits.length >= 4) {
    return `Карта •• ${digits.slice(-4)}`
  }
  return 'Карта •• 4821'
}

export const PaySharePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { userId } = useCurrentUser()
  const { data: order, isPending, error } = useOrder(id)
  const { data: split } = useOrderSplit(id)
  const { data: profile } = useEmployee(userId)
  const payShare = usePayOrderShare(id)

  const [method, setMethod] = useState('card')
  const [phase, setPhase] = useState('form')
  const [actionError, setActionError] = useState('')

  const myRow = useMemo(
    () => split?.rows?.find((row) => row.employeeId === userId),
    [split, userId],
  )

  useEffect(() => {
    if (myRow?.paid) setPhase('done')
  }, [myRow?.paid])

  if (isPending) {
    return <p className="muted">Загрузка оплаты…</p>
  }

  if (error) {
    return <p className="form-error">{error.message}</p>
  }

  if (!order) {
    return <p className="form-error">Заказ не найден</p>
  }

  if (order.createdBy === userId) {
    return <Navigate to={`/orders/${order.id}/summary`} replace />
  }

  if (!myRow) {
    return (
      <section className="pay-share">
        <div className="create-order__top">
          <Link
            to={`/orders/${order.id}`}
            className="auth-back auth-back--plain"
            aria-label="Назад"
          >
            <span aria-hidden="true">‹</span>
          </Link>
          <div>
            <p className="create-order__eyebrow">{order.title}</p>
            <h1>Ваша часть</h1>
          </div>
        </div>
        <article className="pay-share__card">
          <p>Сначала добавьте позиции в заказ — затем сможете оплатить долю.</p>
          <Link
            className="btn btn-primary btn-block pay-share__cta"
            to={`/orders/${order.id}`}
          >
            К заказу
          </Link>
        </article>
      </section>
    )
  }

  const initiatorName = getFirstName(split?.initiator?.name || 'инициатору')
  const amount = myRow.total
  const selectedMethod = METHODS.find((item) => item.id === method) || METHODS[0]

  const handlePay = async () => {
    setActionError('')
    setPhase('processing')
    await new Promise((resolve) => setTimeout(resolve, 1200))

    try {
      await payShare.mutateAsync({
        employeeId: userId,
        method: selectedMethod.apiMethod,
      })
      setPhase('done')
    } catch (err) {
      setPhase('form')
      setActionError(err.message)
    }
  }

  return (
    <section className="pay-share">
      <div className="create-order__top">
        <Link
          to={`/orders/${order.id}`}
          className="auth-back auth-back--plain"
          aria-label="Назад"
        >
          <span aria-hidden="true">‹</span>
        </Link>
        <div>
          <p className="create-order__eyebrow">{order.title}</p>
          <h1>Ваша часть</h1>
        </div>
      </div>

      {phase === 'form' ? (
        <>
          <article className="pay-share__card pay-share__breakdown">
            <div>
              <span>Ваши блюда</span>
              <strong>{formatMoney(myRow.itemsTotal)}</strong>
            </div>
            {myRow.deliveryShare > 0 ? (
              <div>
                <span>Доля доставки</span>
                <strong>{formatMoney(myRow.deliveryShare)}</strong>
              </div>
            ) : null}
            {myRow.discount > 0 ? (
              <div className="is-discount">
                <span>Скидка</span>
                <strong>−{Number(myRow.discount).toLocaleString('ru-RU')} ₸</strong>
              </div>
            ) : null}
            <div className="pay-share__total">
              <span>К оплате</span>
              <strong>{formatMoney(amount)}</strong>
            </div>
          </article>

          <section className="pay-share__methods-block">
            <h2>Способ оплаты</h2>
            <div className="pay-methods">
              {METHODS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`pay-method${method === item.id ? ' is-active' : ''}`}
                  onClick={() => setMethod(item.id)}
                >
                  <strong>
                    {item.id === 'card' ? getCardLabel(profile) : item.title}
                  </strong>
                  {method === item.id ? (
                    <em className="pay-method__badge">Выбрано</em>
                  ) : null}
                </button>
              ))}
            </div>
          </section>

          <p className="pay-share__note">
            Деньги поступят организатору, который оплатит заказ в ресторане.
            Статус изменится после подтверждения банком.
          </p>

          {actionError ? <p className="form-error">{actionError}</p> : null}

          <button
            type="button"
            className="btn btn-primary btn-block pay-share__cta"
            onClick={handlePay}
          >
            Оплатить {formatMoney(amount)}
          </button>
        </>
      ) : null}

      {phase === 'processing' ? (
        <article className="pay-share__card pay-share__processing">
          <div className="pay-share__spinner" aria-hidden="true" />
          <h2>Отправляем платёж…</h2>
          <p>
            {selectedMethod.id === 'card' ? getCardLabel(profile) : selectedMethod.title}{' '}
            · {formatMoney(amount)}
          </p>
        </article>
      ) : null}

      {phase === 'done' ? (
        <article className="pay-share__card pay-share__success">
          <div className="pay-share__check" aria-hidden="true">
            ✓
          </div>
          <h2>Оплачено</h2>
          <p>
            {formatMoney(amount)} переведены организатору {initiatorName}. Он увидит
            поступление в сборе средств.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-block pay-share__cta"
            onClick={() => navigate(`/orders/${order.id}`, { replace: true })}
          >
            Вернуться к заказу
          </button>
        </article>
      ) : null}
    </section>
  )
}
