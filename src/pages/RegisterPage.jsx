import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const RegisterPage = () => {
  const { isAuthenticated, login, isLoggingIn } = useAuth()
  const navigate = useNavigate()
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
      setError('Введите имя')
      return
    }

    if (!password) {
      setError('Введите пароль')
      return
    }

    try {
      await login({ name: trimmedName, password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="auth-shell">
      <form className="auth-form auth-form--login" onSubmit={handleSubmit}>
        <div className="auth-form__top">
          <Link to="/login" className="auth-back" aria-label="Назад">
            <span aria-hidden="true">‹</span>
          </Link>
          <p className="auth-form__greeting">Добро пожаловать</p>
        </div>

        <h1 className="auth-form__title">Регистрация</h1>

        <label className="auth-form__field">
          <span>Имя</span>
          <input
            autoFocus
            autoComplete="username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Анна"
          />
        </label>

        <label className="auth-form__field">
          <span>Пароль</span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={isLoggingIn}
        >
          {isLoggingIn ? 'Создаём…' : 'Создать аккаунт'}
        </button>

        <p className="auth-form__footer">
          Уже есть аккаунт?{' '}
          <Link to="/login/enter" className="auth-link-inline">
            Войти
          </Link>
        </p>
      </form>
    </div>
  )
}
