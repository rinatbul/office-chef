import { useState } from 'react'

export const AddItemForm = ({ employeeId, onSubmit, isPending }) => {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!name.trim() || !price) {
      setError('Укажите название и цену')
      return
    }

    try {
      await onSubmit({
        employeeId,
        name: name.trim(),
        price: Number(price),
      })
      setName('')
      setPrice('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form className="od-card add-item-card" onSubmit={handleSubmit}>
      <h3>Добавить позицию</h3>
      <div className="add-item__fields">
        <label className="add-item__dish">
          <span className="add-item__label">Блюдо</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например, Филадельфия"
          />
        </label>
        <label className="add-item__price">
          <span className="add-item__label">Цена</span>
          <div className="price-field">
            <input
              type="number"
              min="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="490"
            />
            <span>₸</span>
          </div>
        </label>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="btn btn-primary btn-block" disabled={isPending}>
        {isPending ? 'Добавляем…' : 'Добавить в заказ'}
      </button>
    </form>
  )
}
