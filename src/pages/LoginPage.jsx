import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const LoginPage = () => {
  const { isAuthenticated, login, isLoggingIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Введите почту или телефон')
      return
    }

    if (!password) {
      setError('Введите пароль')
      return
    }

    try {
      await login({ name: trimmedName, password })
      const redirectTo = location.state?.from || '/'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="auth-shell auth-shell--blue">
      <form className="auth-form auth-form--login" onSubmit={handleSubmit}>
        <Link to="/login" className="auth-back auth-back--plain" aria-label="Назад">
          <span aria-hidden="true">‹</span>
        </Link>

        <div className="auth-form__heading">
          <p className="auth-form__greeting">С возвращением</p>
          <h1 className="auth-form__title">Вход</h1>
        </div>

        <label className="auth-form__field">
          <span>Почта или телефон</span>
          <input
            autoFocus
            autoComplete="username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="anna@company.kz"
          />
        </label>

        <label className="auth-form__field">
          <span>Пароль</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        <button type="button" className="auth-link">
          Забыли пароль?
        </button>

        {error ? <p className="form-error">{error}</p> : null}

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={isLoggingIn}
        >
          {isLoggingIn ? 'Входим…' : 'Войти'}
        </button>

        <div className="auth-divider" aria-hidden="true">
          <span>или</span>
        </div>

        <button type="button" className="btn btn-soft btn-block" disabled>
          Войти по коду из SMS
        </button>

        <p className="auth-form__footer">
          Нет аккаунта?{' '}
          <Link to="/login/register" className="auth-link-inline">
            Зарегистрироваться
          </Link>
        </p>
      </form>
    </div>
  )
}
