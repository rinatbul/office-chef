import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useSendSupportMessage } from '../hooks/useSupport'

const TOPICS = [
  { id: 'question', label: 'Вопрос' },
  { id: 'bug', label: 'Ошибка / баг' },
  { id: 'suggestion', label: 'Предложение' },
  { id: 'other', label: 'Другое' },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validateForm = ({ name, email, topic, message }) => {
  const next = {}

  if (!name.trim()) next.name = 'Укажите имя'
  if (!email.trim() || !EMAIL_RE.test(email.trim())) {
    next.email = 'Укажите корректный email'
  }
  if (!topic) next.topic = 'Выберите тему обращения'
  if (!message.trim() || message.trim().length < 10) {
    next.message = 'Опишите проблему подробнее (минимум 10 символов)'
  }

  return next
}

export const ProfileHelpPage = () => {
  const { userId, userName } = useCurrentUser()
  const sendSupport = useSendSupportMessage()
  const [name, setName] = useState(userName || '')
  const [email, setEmail] = useState('')
  const [topic, setTopic] = useState('question')
  const [message, setMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [success, setSuccess] = useState('')

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSuccess('')

    const nextErrors = validateForm({ name, email, topic, message })
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    try {
      await sendSupport.mutateAsync({
        employeeId: userId,
        name: name.trim(),
        email: email.trim(),
        topic,
        message: message.trim(),
      })
      setMessage('')
      setFieldErrors({})
      setSuccess('Сообщение отправлено. Мы ответим на указанный email.')
    } catch (err) {
      setFieldErrors({ form: err.message })
    }
  }

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

      <form className="profile-help-form" onSubmit={handleSubmit} noValidate>
        <div className="profile-panel">
          <h3>Написать в поддержку</h3>

          <label className="auth-form__field">
            <span>Имя</span>
            <input
              type="text"
              className={fieldErrors.name ? 'is-invalid' : ''}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                clearFieldError('name')
              }}
              placeholder="Как к вам обращаться"
              autoComplete="name"
            />
            {fieldErrors.name ? (
              <p className="field-error">{fieldErrors.name}</p>
            ) : null}
          </label>

          <label className="auth-form__field">
            <span>Email</span>
            <input
              type="email"
              className={fieldErrors.email ? 'is-invalid' : ''}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                clearFieldError('email')
              }}
              placeholder="you@company.com"
              autoComplete="email"
            />
            {fieldErrors.email ? (
              <p className="field-error">{fieldErrors.email}</p>
            ) : null}
          </label>

          <div className="auth-form__field">
            <span>Тема</span>
            <Select
              value={topic}
              onValueChange={(value) => {
                setTopic(value)
                clearFieldError('topic')
              }}
            >
              <SelectTrigger
                aria-label="Тема обращения"
                className={fieldErrors.topic ? 'is-invalid' : ''}
              >
                <SelectValue placeholder="Выберите тему" />
              </SelectTrigger>
              <SelectContent>
                {TOPICS.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.topic ? (
              <p className="field-error">{fieldErrors.topic}</p>
            ) : null}
          </div>

          <label className="auth-form__field">
            <span>Сообщение</span>
            <textarea
              rows={5}
              className={fieldErrors.message ? 'is-invalid' : ''}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                clearFieldError('message')
              }}
              placeholder="Опишите вопрос или проблему"
            />
            {fieldErrors.message ? (
              <p className="field-error">{fieldErrors.message}</p>
            ) : null}
          </label>
        </div>

        {fieldErrors.form ? <p className="form-error">{fieldErrors.form}</p> : null}
        {success ? <p className="form-success">{success}</p> : null}

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={sendSupport.isPending}
        >
          {sendSupport.isPending ? 'Отправляем…' : 'Отправить сообщение'}
        </button>
      </form>
    </section>
  )
}
