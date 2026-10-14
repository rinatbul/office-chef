import { Link } from 'react-router-dom'

export const ProfileHelpPage = () => {
  return (
    <section className="profile-subpage">
      <div className="create-order__top">
        <Link to="/profile" className="auth-back auth-back--plain" aria-label="Назад">
          <span aria-hidden="true">‹</span>
        </Link>
        <div>
          <h1>Помощь</h1>
        </div>
      </div>

      <div className="profile-panel">
        <p>
          Создайте заказ, пригласите коллег кодом, соберите позиции и оплатите
          инициатору. ИИ-подбор помогает выбрать место по предпочтениям на
          сегодня.
        </p>
        <p className="muted">Офисный Шеф · хакатон MVP</p>
      </div>
    </section>
  )
}
