import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const SAMPLE = `Филадельфия 490
Мисо суп — 190
Эби темпура: 520`

export const ParseMenuForm = ({ employeeId, onSubmit, isPending }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!text.trim()) {
      setError('Вставьте список позиций')
      return
    }

    try {
      const result = await onSubmit({ text, employeeId })
      setSuccess(`Добавлено позиций: ${result.added}`)
      setText('')
    } catch (err) {
      setError(err.message)
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        className="od-card parse-toggle"
        onClick={() => setIsOpen(true)}
        aria-expanded="false"
      >
        <span>
          <strong>Парсер списка</strong>
          <em>Вставить позиции текстом из мессенджера</em>
        </span>
        <span className="parse-toggle__action" aria-hidden="true">
          <ChevronDown size={22} strokeWidth={2.25} />
        </span>
      </button>
    )
  }

  return (
    <form className="od-card parse-card" onSubmit={handleSubmit}>
      <div className="parse-card__head">
        <h3>Парсер списка</h3>
        <button
          type="button"
          className="parse-card__collapse"
          onClick={() => setIsOpen(false)}
          aria-label="Свернуть"
          aria-expanded="true"
        >
          <ChevronUp size={22} strokeWidth={2.25} />
        </button>
      </div>
      <p className="muted">Вставьте текст из мессенджера: «Название 450»</p>
      <label className="auth-form__field">
        <span>Список</span>
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={SAMPLE}
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      {success ? <p className="form-success">{success}</p> : null}
      <div className="btn-row">
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? 'Разбираем…' : 'Разобрать и добавить'}
        </button>
        <button type="button" className="btn btn-outline" onClick={() => setText(SAMPLE)}>
          Пример
        </button>
      </div>
    </form>
  )
}
