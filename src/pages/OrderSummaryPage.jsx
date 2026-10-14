import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useCurrentUser } from '../hooks/useCurrentUser'
import {
  useCheckoutOrder,
  useOrder,
  useOrderSplit,
} from '../hooks/useOrders'
import {
  AVATAR_COLORS,
  formatMoney,
  getFirstName,
  getInitials,
} from '../utils/format'

export const OrderSummaryPage = () => {
  const { id } = useParams()
  const { userId } = useCurrentUser()
  const { data: order, isPending, error } = useOrder(id)
  const { data: split } = useOrderSplit(id)
  const checkout = useCheckoutOrder(id)
  const [step, setStep] = useState('summary')
  const [actionError, setActionError] = useState('')

  const members = useMemo(() => split?.memberSummary || [], [split])
  const missing = useMemo(() => split?.missingMembers || [], [split])

  if (isPending) {
    return <p className="muted">Загрузка итога…</p>
  }

  if (error) {
    return <p className="form-error">{error.message}</p>
  }

  if (!order) {
    return <p className="form-error">Заказ не найден</p>
  }

  if (order.createdBy !== userId) {
    return <Navigate to={`/orders/${order.id}`} replace />
  }

  const placeLabel = order.place || order.title
  const alreadyCheckedOut =
    order.status === 'preparing' || order.status === 'delivered'

  const handleCheckout = async () => {
    setActionError('')
    try {
      await checkout.mutateAsync(userId)
      setStep('done')
    } catch (err) {
      setActionError(err.message)
    }
  }

  return (
    <section className="order-summary">
      <div className="create-order__top">
        <Link
          to={`/orders/${order.id}`}
          className="auth-back auth-back--plain"
          aria-label="Назад"
        >
          <span aria-hidden="true">‹</span>
        </Link>
        <div>
          <p className="create-order__eyebrow">
            {placeLabel}
            {order.time ? ` · ${order.time}` : ''}
          </p>
          <h1>Итог заказа</h1>
        </div>
      </div>

      {step === 'summary' || step === 'pay' ? (
        <>
          <article className="os-card">
            <ul className="os-members">
              {members.map((member, index) => (
                <li key={member.employeeId} className="os-member">
                  <span
                    className="os-member__avatar"
                    style={{
                      background: AVATAR_COLORS[index % AVATAR_COLORS.length],
                    }}
                  >
                    {getInitials(member.name)}
                  </span>
                  <div className="os-member__info">
                    <strong>{getFirstName(member.name)}</strong>
                    <span>
                      {member.hasItems
                        ? (member.itemNames || []).join(', ')
                        : 'Не выбрал(а) блюдо'}
                    </span>
                  </div>
                  <b className="os-member__sum">
                    {member.hasItems ? formatMoney(member.itemsTotal) : '—'}
                  </b>
                </li>
              ))}
            </ul>
          </article>

          {missing.length > 0 ? (
            <div className="os-warn">
              {missing.map((person) => getFirstName(person.name)).join(', ')} ещё не{' '}
              {missing.length === 1 ? 'выбрал(а) блюдо' : 'выбрали блюдо'}
            </div>
          ) : null}

          <article className="os-card os-totals">
            <div className="os-totals__row">
              <span>Позиции</span>
              <strong>{formatMoney(split?.subtotal || 0)}</strong>
            </div>
            {(split?.deliveryFee || 0) > 0 ? (
              <div className="os-totals__row">
                <span>
                  Доставка (поровну на {split?.deliverySplitCount || 1})
                </span>
                <strong>{formatMoney(split.deliveryFee)}</strong>
              </div>
            ) : null}
            {(split?.discountAmount || 0) > 0 ? (
              <div className="os-totals__row os-totals__row--discount">
                <span>Скидка</span>
                <strong>−{Number(split.discountAmount).toLocaleString('ru-RU')} ₸</strong>
              </div>
            ) : null}
            <div className="os-totals__row os-totals__row--grand">
              <span>Ориентировочно к оплате</span>
              <strong>{formatMoney(split?.grandTotal || 0)}</strong>
            </div>
          </article>

          <p className="os-note">
            Сумма предварительная: итог подтвердит ресторан
          </p>
        </>
      ) : null}

      {step === 'pay' || step === 'done' ? (
        <article className="os-card os-pay">
          {step === 'done' || alreadyCheckedOut ? (
            <>
              <h2>Заказ оформлен</h2>
              <p>
                Статус: готовится. Коллеги видят заказ в списке, вы оплатили
                доставку из другого приложения.
              </p>
              <div className="payment-panel__stats">
                <div>
                  <span>Собрано от коллег</span>
                  <strong>
                    {formatMoney(split?.collectedAmount || 0)} /{' '}
                    {formatMoney(split?.expectedAmount || 0)}
                  </strong>
                </div>
                <div>
                  <span>Ждём оплаты</span>
                  <strong>{split?.pendingCount || 0} чел.</strong>
                </div>
              </div>
              <Link className="btn btn-primary btn-block order-summary__cta" to="/orders">
                К списку заказов
              </Link>
            </>
          ) : (
            <>
              <h2>Оплата заказа</h2>
              <p>
                Оплатите {formatMoney(split?.grandTotal || 0)} в приложении
                доставки. После этого заказ перейдёт в статус «Готовится».
              </p>
              <p className="payment-panel__requisites">
                Ваши реквизиты для коллег:{' '}
                <strong>
                  {split?.initiator?.paymentInfo || 'укажите в профиле'}
                </strong>
              </p>
              {actionError ? <p className="form-error">{actionError}</p> : null}
              <button
                type="button"
                className="btn btn-primary btn-block order-summary__cta"
                disabled={checkout.isPending}
                onClick={handleCheckout}
              >
                {checkout.isPending
                  ? 'Оформляем…'
                  : `Оплатить ${formatMoney(split?.grandTotal || 0)}`}
              </button>
            </>
          )}
        </article>
      ) : null}

      {step === 'summary' ? (
        <button
          type="button"
          className="btn btn-primary btn-block order-summary__cta"
          onClick={() => setStep(alreadyCheckedOut ? 'done' : 'pay')}
        >
          Перейти к оплате
        </button>
      ) : null}
    </section>
  )
}
