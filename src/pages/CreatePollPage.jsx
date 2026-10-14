import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useCreateOrder } from '../hooks/useOrders'

const CUISINES = [
  'Японская',
  'Итальянская',
  'Узбекская',
  'Грузинская',
  'Боулы и салаты',
  'Любая',
]

const INTENSITIES = [
  { id: 'легко', title: 'Лёгкое' },
  { id: 'обычно', title: 'Средне' },
  { id: 'сытно', title: 'Сытно' },
]

const FORMATS = [
  { id: 'delivery', title: 'Доставка в офис', hint: 'приедет к обеду' },
  { id: 'walk', title: 'Сходить вместе', hint: 'до 10 минут пешком' },
]

export const CreatePollPage = () => {
  const { userId } = useCurrentUser()
  const createOrder = useCreateOrder()
  const navigate = useNavigate()

  const [cuisine, setCuisine] = useState('Японская')
  const [intensity, setIntensity] = useState('обычно')
  const [format, setFormat] = useState('delivery')
  const [place, setPlace] = useState('')
  const [error, setError] = useState('')

  const isDelivery = format === 'delivery'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!cuisine) {
      setError('Выберите кухню')
      return
    }

    if (!place.trim()) {
      setError(
        isDelivery ? 'Укажите, откуда доставка' : 'Укажите, куда пойдём',
      )
      return
    }

    try {
      const intensityLabel =
        INTENSITIES.find((item) => item.id === intensity)?.title || intensity
      const order = await createOrder.mutateAsync({
        title: `Опрос · ${cuisine}`,
        place: place.trim(),
        time: '12:30',
        acceptUntil: '12:30',
        format,
        chooseMode: 'voting',
        createdBy: userId,
        deliveryFee: isDelivery ? 250 : 0,
        discountPercent: 0,
        paymentInfo: `Насыщенность: ${intensityLabel}`,
      })
      navigate(`/orders/${order.id}`, { replace: true })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="ai-pick create-poll">
      <div className="create-order__top">
        <Link to="/" className="auth-back auth-back--plain" aria-label="Назад">
          <span aria-hidden="true">‹</span>
        </Link>
        <div>
          <p className="create-order__eyebrow">Офисный Шеф</p>
          <h1>Создать опрос</h1>
        </div>
      </div>

      <form className="ai-pick__form" onSubmit={handleSubmit}>
        <section className="ai-step">
          <div className="ai-step__head">
            <span className="ai-step__num">1</span>
            <div>
              <h2>Кухня</h2>
            </div>
          </div>
          <Select value={cuisine} onValueChange={setCuisine}>
            <SelectTrigger aria-label="Кухня">
              <SelectValue placeholder="Выберите кухню" />
            </SelectTrigger>
            <SelectContent>
              {CUISINES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        <section className="ai-step">
          <div className="ai-step__head">
            <span className="ai-step__num">2</span>
            <div>
              <h2>Насыщенность блюд</h2>
            </div>
          </div>
          <Select value={intensity} onValueChange={setIntensity}>
            <SelectTrigger aria-label="Насыщенность блюд">
              <SelectValue placeholder="Выберите насыщенность" />
            </SelectTrigger>
            <SelectContent>
              {INTENSITIES.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        <section className="ai-step">
          <div className="ai-step__head">
            <span className="ai-step__num">3</span>
            <div>
              <h2>Формат обеда</h2>
            </div>
          </div>
          <div className="choice-grid">
            {FORMATS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`choice-card${format === item.id ? ' is-active' : ''}`}
                onClick={() => setFormat(item.id)}
              >
                <strong>{item.title}</strong>
                <span>{item.hint}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="ai-step">
          <div className="ai-step__head">
            <span className="ai-step__num">4</span>
            <div>
              <h2>{isDelivery ? 'Откуда доставка' : 'Куда пойдём'}</h2>
            </div>
          </div>
          <label className="auth-form__field">
            <input
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder={
                isDelivery
                  ? 'Например, Sushi Hub'
                  : 'Например, Чайхана «Алтын»'
              }
            />
          </label>
        </section>

        {error ? <p className="form-error">{error}</p> : null}

        <button
          type="submit"
          className="btn btn-primary btn-block ai-pick__submit"
          disabled={createOrder.isPending}
        >
          {createOrder.isPending ? 'Создаём…' : 'Создать опрос'}
        </button>
      </form>
    </section>
  )
}
