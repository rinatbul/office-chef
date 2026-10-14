import { NavLink, useLocation } from 'react-router-dom'

const IconHome = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
      fill="currentColor"
    />
  </svg>
)

const IconPick = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 3.2 13.1 7.8h4.8l-3.9 2.8 1.5 4.6L12 12.6 8.5 15.2l1.5-4.6-3.9-2.8h4.8L12 3.2Z"
      fill="currentColor"
    />
    <path
      d="M18.8 14.2 19.3 15.8h1.7l-1.4 1 .5 1.6-1.4-1-1.4 1 .5-1.6-1.4-1h1.7l.5-1.6Z"
      fill="currentColor"
    />
  </svg>
)

const IconOrders = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M7 4h10a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V6a2 2 0 0 1 2-2Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path d="M9 9h6M9 13h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const IconProfile = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
    <path
      d="M5 19.5c1.5-3.2 3.8-4.8 7-4.8s5.5 1.6 7 4.8"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

const items = [
  { to: '/', label: 'Главная', icon: IconHome, end: true },
  {
    to: '/matcher',
    label: 'Подбор',
    icon: IconPick,
    matchPrefix: '/matcher',
  },
  {
    to: '/orders',
    label: 'Заказы',
    icon: IconOrders,
    matchPrefix: '/orders',
    end: false,
  },
  { to: '/profile', label: 'Профиль', icon: IconProfile },
]

export const BottomNav = () => {
  const { pathname } = useLocation()

  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => {
              const active = item.matchPrefix
                ? pathname.startsWith(item.matchPrefix)
                : isActive
              return `bottom-nav__item${active ? ' is-active' : ''}`
            }}
          >
            <span className="bottom-nav__icon">
              <Icon />
            </span>
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
