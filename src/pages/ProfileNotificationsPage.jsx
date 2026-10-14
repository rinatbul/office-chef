import { Link } from 'react-router-dom'

export const ProfileNotificationsPage = () => {
  return (
    <section className="profile-subpage">
      <div className="create-order__top">
        <Link to="/profile" className="auth-back auth-back--plain" aria-label="Назад">
          <span aria-hidden="true">‹</span>
        </Link>
        <div>
          <h1>Уведомления</h1>
        </div>
      </div>

      <div className="profile-panel">
        <p>Голосования, новые позиции в заказе и напоминания об оплате.</p>
        <label className="profile-switch">
          <span>Пуш о голосовании</span>
          <input type="checkbox" defaultChecked />
        </label>
        <label className="profile-switch">
          <span>Напоминание оплатить долю</span>
          <input type="checkbox" defaultChecked />
        </label>
      </div>
    </section>
  )
}
