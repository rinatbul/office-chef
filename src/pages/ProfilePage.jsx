import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useEmployee } from '../hooks/useEmployees'
import { usePreferences } from '../hooks/usePreferences'
import { getInitials } from '../utils/format'

const INTENSITY_LABEL = {
  легко: 'Лёгкое',
  обычно: 'Средне',
  сытно: 'Сытно',
}

const MENU_ITEMS = [
  { id: 'payment', label: 'Способы оплаты', to: '/profile/payment' },
  { id: 'notifications', label: 'Уведомления', to: '/profile/notifications' },
  { id: 'company', label: 'Настройки компании', to: '/profile/company' },
  { id: 'help', label: 'Помощь', to: '/profile/help' },
  { id: 'logout', label: 'Выйти' },
]

const buildPreferenceTags = (preference) => {
  if (!preference) return []
  const tags = []

  if (preference.intensity) {
    tags.push({
      label: INTENSITY_LABEL[preference.intensity] || preference.intensity,
      tone: 'ok',
    })
  }

  const cuisine = Array.isArray(preference.cuisines)
    ? preference.cuisines.find((item) => item !== 'Любая')
    : null
  if (cuisine) {
    tags.push({ label: cuisine, tone: 'ok' })
  }

  const note = String(preference.notes || '')
  if (/без орех|не орех/i.test(note)) {
    tags.push({ label: 'Без орехов', tone: 'danger' })
  } else if (/не остр|без остр/i.test(note)) {
    tags.push({ label: 'Без острого', tone: 'danger' })
  } else if (note.trim()) {
    const short = note.trim().split(/[.,]/)[0].trim()
    if (short) tags.push({ label: short, tone: 'danger' })
  }

  return tags.slice(0, 4)
}

export const ProfilePage = () => {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { userId } = useCurrentUser()
  const { data: profile, isPending, error } = useEmployee(userId)
  const { data: preferences = [] } = usePreferences()

  const myPreference = preferences.find((item) => item.employeeId === userId)
  const preferenceTags = useMemo(
    () => buildPreferenceTags(myPreference),
    [myPreference],
  )

  const handleMenu = (item) => {
    if (item.id === 'logout') {
      logout()
      navigate('/login', { replace: true })
      return
    }
    navigate(item.to)
  }

  if (isPending) {
    return <p className="muted">Загрузка профиля…</p>
  }

  if (error) {
    return <p className="form-error">{error.message}</p>
  }

  const displayName = profile?.name || 'Профиль'
  const subtitle = `${profile?.company || 'Kaspi Design'} · ${profile?.office || 'БЦ Нурлы Тау'}`

  return (
    <section className="profile-page">
      <div className="profile-hero">
        <div className="profile-hero__avatar" aria-hidden="true">
          {getInitials(displayName)}
        </div>
        <h1>{displayName}</h1>
        <p>{subtitle}</p>
      </div>

      <article className="profile-card">
        <div className="profile-card__head">
          <h2>Предпочтения</h2>
          <button
            type="button"
            className="profile-card__link"
            onClick={() => navigate('/matcher')}
          >
            Изменить
          </button>
        </div>
        {preferenceTags.length > 0 ? (
          <div className="profile-tags">
            {preferenceTags.map((tag) => (
              <span
                key={tag.label}
                className={`profile-tag profile-tag--${tag.tone}`}
              >
                {tag.label}
              </span>
            ))}
          </div>
        ) : (
          <p className="profile-card__empty">
            Пока нет предпочтений на сегодня
          </p>
        )}
      </article>

      <nav className="profile-menu" aria-label="Настройки профиля">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="profile-menu__item"
            onClick={() => handleMenu(item)}
          >
            <span>{item.label}</span>
            <span aria-hidden="true">›</span>
          </button>
        ))}
      </nav>
    </section>
  )
}
