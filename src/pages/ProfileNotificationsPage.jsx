import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Switch } from '../components/ui/Switch'

export const ProfileNotificationsPage = () => {
  const [votePush, setVotePush] = useState(true)
  const [payReminder, setPayReminder] = useState(true)

  return (
    <section className="profile-subpage">
      <div className="create-order__top">
        <Link
          to="/profile"
          className="auth-back auth-back--plain"
          aria-label="Назад"
        >
          <span aria-hidden="true">‹</span>
        </Link>
        <div>
          <h1>Уведомления</h1>
        </div>
      </div>

      <div className="profile-panel">
        <p>Голосования, новые позиции в заказе и напоминания об оплате.</p>

        <label className="profile-switch" htmlFor="notify-vote">
          <span>Пуш о голосовании</span>
          <Switch
            id="notify-vote"
            checked={votePush}
            onCheckedChange={setVotePush}
          />
        </label>

        <label className="profile-switch" htmlFor="notify-pay">
          <span>Напоминание оплатить долю</span>
          <Switch
            id="notify-pay"
            checked={payReminder}
            onCheckedChange={setPayReminder}
          />
        </label>
      </div>
    </section>
  )
}
