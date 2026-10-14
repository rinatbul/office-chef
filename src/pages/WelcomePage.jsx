import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import welcomeHero from '../assets/welcome-hero.jpg'

export const WelcomePage = () => {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="auth-shell">
      <div className="welcome-screen">
        <div className="welcome-screen__visual">
          <img
            className="welcome-screen__image"
            src={welcomeHero}
            alt="Доставка еды в офис — приложение, свежий обед и покупки"
          />
        </div>

        <div className="welcome-screen__copy">
          <h1>Обед с коллегами без хаоса</h1>
          <p>
            Голосуйте за место, делите счёт и следите за доставкой в одном приложении.
          </p>
        </div>

        <div className="welcome-screen__actions">
          <Link className="btn btn-primary btn-block" to="/login/register">
            Начать
          </Link>
          <Link className="btn btn-soft btn-block" to="/login/enter">
            У меня уже есть аккаунт
          </Link>
        </div>
      </div>
    </div>
  )
}
