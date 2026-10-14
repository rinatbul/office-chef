import { Link } from 'react-router-dom'
import { formatMoney, getFirstName } from '../utils/format'

const methodLabel = (method) => {
  if (method === 'card') return 'Карта'
  if (method === 'kaspi') return 'Kaspi'
  return 'В приложении'
}

export const PaymentPanel = ({
  split,
  currentUserId,
  orderId,
}) => {
  if (!split?.rows?.length) {
    return null
  }

  const myRow = split.rows.find((row) => row.employeeId === currentUserId)
  const isInitiator = split.initiator?.id === currentUserId
  const paymentInfo =
    split.initiator?.paymentInfo || split.paymentInfo || 'Реквизиты уточните у инициатора'
  const paidMembers = (split.rows || []).filter(
    (row) => !row.isInitiator && row.paid,
  )
  const pendingMembers = (split.rows || []).filter(
    (row) => !row.isInitiator && !row.paid,
  )
  const progress =
    split.expectedAmount > 0
      ? Math.min(100, Math.round((split.collectedAmount / split.expectedAmount) * 100))
      : 0

  if (isInitiator) {
    return (
      <div className="payment-panel payment-panel--initiator">
        <div className="payment-panel__copy">
          <h3>Сбор оплаты в приложении</h3>
          <p>
            Коллеги платят долю прямо в Офисном Шефе. Когда деньги соберутся,
            оформите заказ у ресторана.
          </p>
          <div className="payment-panel__progress" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="payment-panel__stats">
            <div>
              <span>Собрано</span>
              <strong>
                {formatMoney(split.collectedAmount)} / {formatMoney(split.expectedAmount)}
              </strong>
            </div>
            <div>
              <span>Ждём оплаты</span>
              <strong>{split.pendingCount} чел.</strong>
            </div>
          </div>
          {paidMembers.length > 0 ? (
            <ul className="payment-panel__feed">
              {paidMembers.map((row) => (
                <li key={row.employeeId}>
                  <span>{getFirstName(row.name)} оплатил(а)</span>
                  <b>
                    {formatMoney(row.total)}
                    {row.paymentMethod ? ` · ${methodLabel(row.paymentMethod)}` : ''}
                  </b>
                </li>
              ))}
            </ul>
          ) : null}
          {pendingMembers.length > 0 ? (
            <p className="payment-panel__pending">
              Ещё не оплатили:{' '}
              {pendingMembers.map((row) => getFirstName(row.name)).join(', ')}
            </p>
          ) : null}
          <p className="payment-panel__requisites">
            Ваши реквизиты в профиле: <strong>{paymentInfo}</strong>
          </p>
        </div>
        {orderId ? (
          <Link className="btn btn-primary payment-panel__btn" to={`/orders/${orderId}/summary`}>
            Итог и оплата ресторану
          </Link>
        ) : null}
      </div>
    )
  }

  if (!myRow) {
    return (
      <div className="payment-panel">
        <div className="payment-panel__copy">
          <h3>Оплата</h3>
          <p>Добавьте свои позиции — затем сможете оплатить долю инициатору в приложении.</p>
        </div>
      </div>
    )
  }

  if (myRow.paid) {
    return (
      <div className="payment-panel payment-panel--paid">
        <div className="payment-panel__copy">
          <h3>Оплачено в приложении</h3>
          <p>
            Вы перевели <strong>{formatMoney(myRow.total)}</strong> инициатору{' '}
            <strong>{split.initiator?.name || 'заказа'}</strong>
            {myRow.paymentMethod
              ? ` через ${methodLabel(myRow.paymentMethod)}`
              : ''}
            . Он оформит общий заказ.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="payment-panel">
      <div className="payment-panel__copy">
        <h3>Оплатить долю в приложении</h3>
        <p>
          К оплате <strong>{formatMoney(myRow.total)}</strong> — инициатору{' '}
          <strong>{split.initiator?.name || 'заказа'}</strong>. Демо-оплата для
          жюри, без реального списания.
        </p>
      </div>
      {orderId ? (
        <Link className="btn btn-primary payment-panel__btn" to={`/orders/${orderId}/pay`}>
          Оплатить {formatMoney(myRow.total)}
        </Link>
      ) : null}
    </div>
  )
}
