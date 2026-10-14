import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useAiPick, usePreferences } from '../hooks/usePreferences'

const CUISINES = [
  'Японская',
  'Итальянская',
  'Узбекская',
  'Грузинская',
  'Боулы и салаты',
  'Любая',
]

const INTENSITIES = [
  { id: 'легко', title: 'Лёгкое', hint: 'салаты, супы' },
  { id: 'обычно', title: 'Средне', hint: 'классика' },
  { id: 'сытно', title: 'Сытно', hint: 'горячее, мясо' },
]

const FORMATS = [
  { id: 'доставка', title: 'Доставка в офис', hint: 'приедет к 12:30' },
  { id: 'пешком', title: 'Сходить вместе', hint: 'до 10 минут пешком' },
]

export const MatcherPage = () => {
  const navigate = useNavigate()
  const { userId } = useCurrentUser()
  const { data: preferences = [] } = usePreferences()
  const aiPick = useAiPick()
  const myPreference = preferences.find((item) => item.employeeId === userId)

  const [cuisines, setCuisines] = useState(['Японская', 'Боулы и салаты'])
  const [intensity, setIntensity] = useState('легко')
  const [format, setFormat] = useState('доставка')
  const [notes, setNotes] = useState('Не острое, без орехов. Хочется чего-то тёплого')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!myPreference) return
    if (Array.isArray(myPreference.cuisines) && myPreference.cuisines.length > 0) {
      setCuisines(myPreference.cuisines)
    } else if (myPreference.cuisine) {
      setCuisines(
        String(myPreference.cuisine)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      )
    }
    if (myPreference.intensity) setIntensity(myPreference.intensity)
    if (myPreference.format) setFormat(myPreference.format)
    if (myPreference.notes) setNotes(myPreference.notes)
  }, [myPreference])

  const toggleCuisine = (value) => {
    setCuisines((prev) => {
      if (value === 'Любая') {
        return prev.includes('Любая') ? [] : ['Любая']
      }
      const withoutAny = prev.filter((item) => item !== 'Любая')
      return withoutAny.includes(value)
        ? withoutAny.filter((item) => item !== value)
        : [...withoutAny, value]
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (cuisines.length === 0) {
      setError('Выберите хотя бы одну кухню')
      return
    }

    try {
      await aiPick.mutateAsync({
        employeeId: userId,
        cuisines,
        format,
        intensity,
        notes,
      })
      navigate('/matcher/results')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="ai-pick">
      <div className="create-order__top">
        <Link to="/" className="auth-back auth-back--plain" aria-label="Назад">
          <span aria-hidden="true">‹</span>
        </Link>
        <div>
          <p className="create-order__eyebrow">
            ИИ-подбор · 4 вопроса, около 30 секунд
          </p>
          <h1>Что хочется сегодня?</h1>
        </div>
      </div>

      <div className="ai-pick__banner">
        Подбор строится только по вашим ответам, данные профиля не используются
      </div>

      {myPreference?.aiPicks?.length ? (
        <Link className="btn btn-soft btn-block" to="/matcher/results">
          Открыть текущую подборку
        </Link>
      ) : null}

      <form className="ai-pick__form" onSubmit={handleSubmit}>
        <section className="ai-step">
          <div className="ai-step__head">
            <span className="ai-step__num">1</span>
            <div>
              <h2>Какая кухня</h2>
              <p>Можно выбрать несколько</p>
            </div>
          </div>
          <div className="chip-row">
            {CUISINES.map((item) => (
              <button
                key={item}
                type="button"
                className={`chip${cuisines.includes(item) ? ' is-active' : ''}`}
                onClick={() => toggleCuisine(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="ai-step">
          <div className="ai-step__head">
            <span className="ai-step__num">2</span>
            <div>
              <h2>Насыщенность блюд</h2>
            </div>
          </div>
          <div className="ai-intensity">
            {INTENSITIES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`ai-intensity__card${intensity === item.id ? ' is-active' : ''}`}
                onClick={() => setIntensity(item.id)}
              >
                <strong>{item.title}</strong>
                <span>{item.hint}</span>
              </button>
            ))}
          </div>
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
              <h2>Заметка для ИИ</h2>
              <p>Пожелания, ограничения, настроение</p>
            </div>
          </div>
          <textarea
            className="ai-pick__notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Не острое, без орехов. Хочется чего-то тёплого"
          />
        </section>

        {error ? <p className="form-error">{error}</p> : null}

        <button
          type="submit"
          className="btn btn-primary btn-block ai-pick__submit"
          disabled={aiPick.isPending}
        >
          <span className="ai-pick__submit-icon" aria-hidden="true">
            ✦
          </span>
          {aiPick.isPending ? 'Подбираем…' : 'Подобрать обед'}
        </button>

        <p className="ai-pick__hint">
          ИИ только советует: заказ и оплата не создаются
        </p>
      </form>
    </section>
  )
}
