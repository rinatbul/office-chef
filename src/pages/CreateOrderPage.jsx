import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useCreateOrder } from '../hooks/useOrders'

const buildInitial = (state) => {
  if (!state?.fromAi) {
    return {
      title: '',
      format: 'walk',
      place: '',
      time: '12:30',
      chooseMode: 'voting',
    }
  }

  const format = state.format === 'delivery' ? 'delivery' : 'walk'
  return {
    title: state.title || `Обед · ${state.place || ''}`.trim(),
    format,
    place: state.place || '',
    time: '12:30',
    chooseMode: state.chooseMode || 'direct',
  }
}

export const CreateOrderPage = () => {
  const { userId } = useCurrentUser()
  const createOrder = useCreateOrder()
  const navigate = useNavigate()
  const { state } = useLocation()
  const [form, setForm] = useState(() => buildInitial(state))
  const [error, setError] = useState('')

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFormatChange = (format) => {
    setField('format', format)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.title.trim()) {
      setError('Укажите название')
      return
    }

    if (!form.time) {
      setError('Укажите время обеда')
      return
    }

    if (form.chooseMode === 'direct' && !form.place.trim()) {
      setError(
        form.format === 'delivery'
          ? 'Укажите, откуда доставить'
          : 'Укажите место',
      )
      return
    }

    try {
      const order = await createOrder.mutateAsync({
        title: form.title.trim(),
        place: form.place.trim(),
        time: form.time,
        acceptUntil: form.time,
        format: form.format,
        chooseMode: form.chooseMode,
        createdBy: userId,
        deliveryFee: form.format === 'delivery' ? 250 : 0,
        discountPercent: 0,
      })
      navigate(`/orders/${order.id}`, { replace: true })
    } catch (err) {
      setError(err.message)
    }
  }

  const isDelivery = form.format === 'delivery'
  const backTo = state?.fromAi ? '/matcher/results' : '/'

  return (
    <section className="create-order">
      <div className="create-order__top">
        <Link to={backTo} className="auth-back auth-back--plain" aria-label="Назад">
          <span aria-hidden="true">‹</span>
        </Link>
        <div>
          <p className="create-order__eyebrow">Офисный Шеф</p>
          <h1>Новый заказ</h1>
        </div>
      </div>

      <form className="create-order__form" onSubmit={handleSubmit}>
        <label className="auth-form__field">
          <span className="create-order__label">Название</span>
          <input
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="Название мероприятия"
          />
        </label>

        <div className="create-order__block">
          <span className="create-order__label">Формат обеда</span>
          <div className="choice-grid">
            <button
              type="button"
              className={`choice-card${isDelivery ? ' is-active' : ''}`}
              onClick={() => handleFormatChange('delivery')}
            >
              <strong>Доставка в офис</strong>
              <span>Привезёт курьер</span>
            </button>
            <button
              type="button"
              className={`choice-card${!isDelivery ? ' is-active' : ''}`}
              onClick={() => handleFormatChange('walk')}
            >
              <strong>Пойти пешком</strong>
              <span>Вместе в заведение</span>
            </button>
          </div>
        </div>

        <label className="auth-form__field">
          <span className="create-order__label">
            {isDelivery ? 'Откуда доставить' : 'Куда идём'}
          </span>
          <input
            value={form.place}
            onChange={(e) => setField('place', e.target.value)}
            placeholder={
              isDelivery
                ? 'Например, Sushi Hub'
                : 'Например Чайхана «Алтын»'
            }
          />
        </label>

        <label className="auth-form__field">
          <span className="create-order__label">Время обеда</span>
          <input
            className="time-picker"
            type="time"
            value={form.time}
            onChange={(e) => setField('time', e.target.value)}
            step="300"
          />
        </label>

        <div className="create-order__block">
          <span className="create-order__label">Как выбираем место</span>
          <div className="choice-grid">
            <button
              type="button"
              className={`choice-card${form.chooseMode === 'voting' ? ' is-active' : ''}`}
              onClick={() => setField('chooseMode', 'voting')}
            >
              <strong>Голосование</strong>
              <span>Выберет команда</span>
            </button>
            <button
              type="button"
              className={`choice-card${form.chooseMode === 'direct' ? ' is-active' : ''}`}
              onClick={() => setField('chooseMode', 'direct')}
            >
              <strong>Сразу укажу</strong>
              <span>Без голосования</span>
            </button>
          </div>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={createOrder.isPending}
        >
          {createOrder.isPending ? 'Создаём…' : 'Создать заказ'}
        </button>
      </form>
    </section>
  )
}
