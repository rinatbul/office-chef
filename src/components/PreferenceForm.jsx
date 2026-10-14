import { useState } from 'react'

const CUISINES = ['азиатская', 'пицца', 'салаты', 'бургер', 'домашняя', 'другое']
const FORMATS = ['доставка', 'пешком', 'кафе']
const INTENSITIES = ['легко', 'обычно', 'сытно']

export const PreferenceForm = ({ employeeId, onSubmit, isPending }) => {
  const [cuisine, setCuisine] = useState(CUISINES[0])
  const [format, setFormat] = useState(FORMATS[0])
  const [intensity, setIntensity] = useState(INTENSITIES[1])
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      await onSubmit({ employeeId, cuisine, format, intensity, notes })
      setSuccess('Предпочтение сохранено на сегодня')
      setNotes('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form className="panel form-grid" onSubmit={handleSubmit}>
      <h2>Что хочешь на обед?</h2>
      <div className="form-row">
        <label>
          Кухня
          <select value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
            {CUISINES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          Формат
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            {FORMATS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          Насыщенность
          <select value={intensity} onChange={(e) => setIntensity(e.target.value)}>
            {INTENSITIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Заметка
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="без острого, хочу пройтись…"
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      {success ? <p className="form-success">{success}</p> : null}
      <button type="submit" className="btn btn-secondary" disabled={isPending}>
        {isPending ? 'Сохраняем…' : 'Сохранить на сегодня'}
      </button>
    </form>
  )
}
