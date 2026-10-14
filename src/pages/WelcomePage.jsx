import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const WelcomePage = () => {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="auth-shell">
      <div className="welcome-screen">
        <div className="welcome-screen__visual" aria-hidden="true">
          <span className="welcome-screen__orb" />
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
