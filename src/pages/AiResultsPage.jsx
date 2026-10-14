import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { usePreferences } from '../hooks/usePreferences'

const INTENSITY_LABEL = {
  легко: 'Лёгкое',
  обычно: 'Средне',
  сытно: 'Сытно',
}

const FORMAT_LABEL = {
  доставка: 'Доставка',
  пешком: 'Пешком',
}

const shortCuisine = (cuisines = []) => {
  const list = cuisines.filter((item) => item !== 'Любая')
  if (list.length === 0) return 'Любая кухня'
  return list
    .map((item) => {
      if (item === 'Боулы и салаты') return 'боулы'
      return item
    })
    .join(', ')
}

const buildTags = (preference) => {
  if (!preference) return []
  const tags = []
  tags.push(shortCuisine(preference.cuisines || []))
  if (preference.intensity) {
    tags.push(INTENSITY_LABEL[preference.intensity] || preference.intensity)
  }
  const formatPart = FORMAT_LABEL[preference.format] || preference.format
  const noteSnippet = String(preference.notes || '')
    .split(/[.,]/)
    .map((part) => part.trim())
    .filter(Boolean)[0]
  tags.push(noteSnippet ? `${formatPart} · ${noteSnippet.toLowerCase()}` : formatPart)
  return tags.filter(Boolean)
}

export const AiResultsPage = () => {
  const navigate = useNavigate()
  const { userId } = useCurrentUser()
  const { data: preferences = [], isLoading } = usePreferences()
  const myPreference = preferences.find((item) => item.employeeId === userId)
  const picks = myPreference?.aiPicks || []
  const [selectedId, setSelectedId] = useState(null)
  const [compareOpen, setCompareOpen] = useState(false)

  const activeId = selectedId || picks[0]?.id || null
  const selected = picks.find((item) => item.id === activeId) || picks[0]
  const tags = useMemo(() => buildTags(myPreference), [myPreference])

  const handleSelect = () => {
    if (!selected) return
    navigate('/orders/new', {
      state: {
        fromAi: true,
        place: selected.title,
        format: selected.format === 'пешком' ? 'walk' : 'delivery',
        title: `Обед · ${selected.title}`,
        chooseMode: 'direct',
      },
    })
  }

  if (isLoading) {
    return (
      <section className="ai-results">
        <p className="ai-results__empty">Загружаем подбор…</p>
      </section>
    )
  }

  if (!picks.length) {
    return (
      <section className="ai-results">
        <div className="create-order__top">
          <Link to="/matcher" className="auth-back" aria-label="Назад">
            <span aria-hidden="true">‹</span>
          </Link>
          <div>
            <p className="create-order__eyebrow">По ответам опроса</p>
            <h1>ИИ-подбор обеда</h1>
          </div>
        </div>
        <p className="ai-results__empty">
          Пока нет подборки. Пройдите опрос предпочтений на сегодня.
        </p>
        <Link className="btn btn-primary btn-block" to="/matcher">
          Открыть предпочтения
        </Link>
      </section>
    )
  }

  return (
    <section className="ai-results">
      <div className="create-order__top">
        <Link to="/matcher" className="auth-back" aria-label="Назад">
          <span aria-hidden="true">‹</span>
        </Link>
        <div>
          <p className="create-order__eyebrow">По ответам опроса</p>
          <h1>ИИ-подбор обеда</h1>
        </div>
      </div>

      <div className="ai-results__how">
        <strong>Как это работает</strong>
        <p>
          Учитываем ваши ответы в опросе: кухню, насыщенность, формат и заметку.
          ИИ только советует: заказ и списание — после вашего решения.
        </p>
      </div>

      <div className="ai-results__tags">
        {tags.map((tag) => (
          <span key={tag} className="ai-results__tag">
            {tag}
          </span>
        ))}
      </div>

      <div className="ai-results__list">
        {picks.map((pick) => {
          const isSelected = pick.id === activeId
          return (
            <button
              key={pick.id}
              type="button"
              className={`ai-pick-card${isSelected ? ' is-selected' : ''}`}
              onClick={() => setSelectedId(pick.id)}
            >
              <div className="ai-pick-card__row">
                <div
                  className={`ai-pick-card__visual ai-pick-card__visual--${pick.tone || 'peach'}`}
                  aria-hidden="true"
                >
                  <span />
                </div>
                <div className="ai-pick-card__main">
                  <strong>{pick.title}</strong>
                  <span>
                    {pick.eta}
                    {pick.priceRange ? ` · ${pick.priceRange}` : ''}
                  </span>
                </div>
                <div className="ai-pick-card__match">
                  <b>{pick.matchPercent ?? pick.score}%</b>
                  <span>совпадение</span>
                </div>
              </div>
              <p className="ai-pick-card__note">
                {pick.fitNote || (pick.reasons || [pick.reason]).join(' · ')}
              </p>
            </button>
          )
        })}
      </div>

      {compareOpen ? (
        <div className="ai-results__compare">
          <h3>Сравнение</h3>
          <ul>
            {picks.map((pick) => (
              <li key={pick.id}>
                <strong>{pick.title}</strong>
                <span>
                  {pick.matchPercent}% · {pick.eta} · {pick.priceRange}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="ai-results__actions">
        <button type="button" className="btn btn-primary btn-block" onClick={handleSelect}>
          Выбрать вариант
        </button>
        <button
          type="button"
          className="btn btn-outline btn-block"
          onClick={() => setCompareOpen((prev) => !prev)}
        >
          {compareOpen ? 'Скрыть сравнение' : 'Сравнить варианты'}
        </button>
      </div>
    </section>
  )
}
