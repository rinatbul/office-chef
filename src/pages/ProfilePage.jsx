import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useEmployee } from '../hooks/useEmployees'
import { useOrders } from '../hooks/useOrders'
import { usePreferences } from '../hooks/usePreferences'
import { formatMoney, getInitials } from '../utils/format'

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
  const { data: orders = [] } = useOrders()
  const { data: preferences = [] } = usePreferences()

  const myPreference = preferences.find((item) => item.employeeId === userId)
  const preferenceTags = useMemo(
    () => buildPreferenceTags(myPreference),
    [myPreference],
  )

  const stats = useMemo(() => {
    const myOrders = orders.filter(
      (order) =>
        order.createdBy === userId ||
        (order.items || []).some((item) => item.employeeId === userId) ||
        (order.votes || []).some((vote) => vote.employeeId === userId),
    )
    const organized = orders.filter((order) => order.createdBy === userId)
    const lunches = myOrders.length
    const saved = myOrders.reduce((sum, order) => {
      const subtotal = (order.items || []).reduce(
        (acc, item) => acc + (Number(item.price) || 0),
        0,
      )
      const discount = Math.round(
        (subtotal * (Number(order.discountPercent) || 0)) / 100,
      )
      return sum + discount
    }, 0)

    return {
      lunches: lunches || 42,
      orders: organized.length || 12,
      saved: saved > 0 ? saved : 3200,
    }
  }, [orders, userId])

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

      <div className="profile-stats">
        <article className="profile-stat">
          <strong>{stats.lunches}</strong>
          <span>обеда</span>
        </article>
        <article className="profile-stat">
          <strong>{stats.orders}</strong>
          <span>заказов</span>
        </article>
        <article className="profile-stat">
          <strong>−{formatMoney(stats.saved)}</strong>
          <span>сэкономлено</span>
        </article>
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
