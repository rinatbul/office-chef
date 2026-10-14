import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Switch } from '../components/ui/Switch'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useEmployee } from '../hooks/useEmployees'
import { usePreferences } from '../hooks/usePreferences'
import { getInitials } from '../utils/format'

const INTENSITY_LABEL = {
  легко: 'Лёгкое',
  обычно: 'Средне',
  сытно: 'Сытно',
}

const FORMAT_LABEL = {
  доставка: 'Доставка в офис',
  пешком: 'Сходить вместе',
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

  const cuisines = Array.isArray(preference.cuisines)
    ? preference.cuisines
    : String(preference.cuisine || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

  cuisines.forEach((cuisine) => {
    tags.push({ label: cuisine, tone: 'ok', key: `cuisine-${cuisine}` })
  })

  if (preference.intensity) {
    tags.push({
      label: INTENSITY_LABEL[preference.intensity] || preference.intensity,
      tone: 'ok',
      key: `intensity-${preference.intensity}`,
    })
  }

  if (preference.format) {
    tags.push({
      label: FORMAT_LABEL[preference.format] || preference.format,
      tone: 'ok',
      key: `format-${preference.format}`,
    })
  }

  const note = String(preference.notes || '').trim()
  if (note) {
    tags.push({ label: note, tone: 'danger', key: 'notes' })
  }

  return tags
}

export const ProfilePage = () => {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { isDark, setTheme } = useTheme()
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

  return (
    <section className="profile-page">
      <div className="profile-hero">
        <div className="profile-hero__avatar" aria-hidden="true">
          {getInitials(displayName)}
        </div>
        <h1>{displayName}</h1>
      </div>

      <article className="profile-card">
        <div className="profile-card__head">
          <h2>Предпочтения</h2>
          <button
            type="button"
            className="profile-card__link"
            onClick={() => navigate('/profile/preferences')}
          >
            Изменить
          </button>
        </div>
        {preferenceTags.length > 0 ? (
          <div className="profile-tags">
            {preferenceTags.map((tag) => (
              <span
                key={tag.key}
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

      <div className="profile-panel">
        <label className="profile-switch" htmlFor="theme-dark">
          <span>Тёмная тема</span>
          <Switch
            id="theme-dark"
            checked={isDark}
            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
          />
        </label>
      </div>

      <nav className="profile-menu" aria-label="Настройки профиля">
        {MENU_ITEMS.map((item) => {
          const isLogout = item.id === 'logout'

          return (
            <button
              key={item.id}
              type="button"
              className={`profile-menu__item${isLogout ? ' profile-menu__item--logout' : ''}`}
              onClick={() => handleMenu(item)}
            >
              <span>{item.label}</span>
              {isLogout ? null : (
                <span className="profile-menu__arrow" aria-hidden="true">
                  ›
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </section>
  )
}
