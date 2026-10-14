import { useState } from 'react'

const initial = {
  title: '',
  place: '',
  time: '12:30',
  deliveryFee: 250,
  discountPercent: 0,
  paymentInfo: '',
}

export const OrderForm = ({ onSubmit, isPending, createdBy }) => {
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.title.trim()) {
      setError('Укажите название заказа')
      return
    }

    try {
      await onSubmit({
        ...form,
        deliveryFee: Number(form.deliveryFee) || 0,
        discountPercent: Number(form.discountPercent) || 0,
        createdBy,
      })
      setForm(initial)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form className="panel form-grid" onSubmit={handleSubmit}>
      <h2>Новый групповой заказ</h2>
      <label>
        Что заказываем
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Заказываем суши в 12:30"
        />
      </label>
      <div className="form-row">
        <label>
          Откуда
          <input
            name="place"
            value={form.place}
            onChange={handleChange}
            placeholder="Sushi Hub"
          />
        </label>
        <label>
          Время
          <input name="time" value={form.time} onChange={handleChange} />
        </label>
      </div>
      <div className="form-row">
        <label>
          Стоимость доставки, ₽
          <input
            name="deliveryFee"
            type="number"
            min="0"
            value={form.deliveryFee}
            onChange={handleChange}
          />
        </label>
        <label>
          Скидка, %
          <input
            name="discountPercent"
            type="number"
            min="0"
            max="100"
            value={form.discountPercent}
            onChange={handleChange}
          />
        </label>
      </div>
      <label>
        Куда переводить (необязательно)
        <input
          name="paymentInfo"
          value={form.paymentInfo}
          onChange={handleChange}
          placeholder="Если пусто — возьмём из профиля"
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={isPending}>
        {isPending ? 'Создаём…' : 'Создать заказ'}
      </button>
    </form>
  )
}
