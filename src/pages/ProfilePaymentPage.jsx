import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useEmployee, useUpdateProfile } from '../hooks/useEmployees'

const METHOD_OPTIONS = [
  { id: 'kaspi', title: 'Kaspi', hint: 'Телефон для перевода' },
  { id: 'card', title: 'Карта' },
]

const EMPTY_CARD = {
  number: '',
  holder: '',
  expiry: '',
  cvv: '',
}

const methodTitle = (type) =>
  METHOD_OPTIONS.find((item) => item.id === type)?.title || 'Способ оплаты'

const createMethodId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `pm-${Date.now()}-${Math.random().toString(16).slice(2)}`

const onlyDigits = (value) => String(value || '').replace(/\D/g, '')

const formatCardNumber = (value) => {
  const digits = onlyDigits(value).slice(0, 16)
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

const formatExpiry = (value) => {
  const digits = onlyDigits(value).slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

const maskCardDetails = (number) => {
  const digits = onlyDigits(number)
  const last4 = digits.slice(-4)
  return last4 ? `Карта •• ${last4}` : 'Карта'
}

const methodSubtitle = (item) => {
  if (item.type === 'card') {
    const parts = [item.details]
    if (item.cardHolder) parts.push(item.cardHolder)
    if (item.cardExpiry) parts.push(`до ${item.cardExpiry}`)
    return parts.filter(Boolean).join(' · ')
  }
  return item.details
}

export const ProfilePaymentPage = () => {
  const { userId } = useCurrentUser()
  const { data: profile, isPending, error } = useEmployee(userId)
  const updateProfile = useUpdateProfile()

  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState('kaspi')
  const [details, setDetails] = useState('')
  const [card, setCard] = useState(EMPTY_CARD)
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')

  const methods = useMemo(
    () => (Array.isArray(profile?.paymentMethods) ? profile.paymentMethods : []),
    [profile],
  )

  const resetForm = () => {
    setDetails('')
    setCard(EMPTY_CARD)
    setType('kaspi')
    setFormError('')
  }

  const saveMethods = async (nextMethods, message) => {
    setFormError('')
    setSuccess('')

    try {
      await updateProfile.mutateAsync({
        id: userId,
        name: profile?.name || '',
        paymentInfo: profile?.paymentInfo || '',
        company: profile?.company || '',
        office: profile?.office || '',
        paymentMethods: nextMethods,
      })
      setSuccess(message)
    } catch (err) {
      setFormError(err.message)
    }
  }

  const buildNewMethod = () => {
    if (type === 'kaspi') {
      const trimmed = details.trim()
      if (!trimmed) {
        return { error: 'Укажите номер телефона Kaspi' }
      }
      return {
        method: {
          id: createMethodId(),
          type: 'kaspi',
          details: trimmed,
          isDefault: methods.length === 0,
        },
      }
    }

    const numberDigits = onlyDigits(card.number)
    const holder = card.holder.trim()
    const expiry = card.expiry.trim()
    const cvvDigits = onlyDigits(card.cvv)

    if (numberDigits.length < 16) {
      return { error: 'Введите номер карты (16 цифр)' }
    }
    if (!holder) {
      return { error: 'Укажите имя владельца карты' }
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      return { error: 'Срок действия в формате ММ/ГГ' }
    }
    const [month] = expiry.split('/').map(Number)
    if (month < 1 || month > 12) {
      return { error: 'Месяц срока действия должен быть от 01 до 12' }
    }
    if (cvvDigits.length < 3) {
      return { error: 'Введите CVV (3 или 4 цифры)' }
    }

    return {
      method: {
        id: createMethodId(),
        type: 'card',
        details: maskCardDetails(numberDigits),
        last4: numberDigits.slice(-4),
        cardHolder: holder,
        cardExpiry: expiry,
        isDefault: methods.length === 0,
      },
    }
  }

  const handleAdd = async (event) => {
    event.preventDefault()
    setFormError('')
    setSuccess('')

    const result = buildNewMethod()
    if (result.error) {
      setFormError(result.error)
      return
    }

    await saveMethods(
      [...methods, result.method],
      'Способ оплаты добавлен',
    )
    resetForm()
    setShowForm(false)
  }

  const handleSetDefault = async (id) => {
    const next = methods.map((item) => ({
      ...item,
      isDefault: item.id === id,
    }))
    await saveMethods(next, 'Основной способ обновлён')
  }

  const handleRemove = async (id) => {
    const filtered = methods.filter((item) => item.id !== id)
    const hasDefault = filtered.some((item) => item.isDefault)
    const next = filtered.map((item, index) => ({
      ...item,
      isDefault: hasDefault ? item.isDefault : index === 0,
    }))

    await saveMethods(next, 'Способ оплаты удалён')
  }

  if (isPending) {
    return <p className="muted">Загрузка…</p>
  }

  if (error) {
    return <p className="form-error">{error.message}</p>
  }

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
          <h1>Способы оплаты</h1>
        </div>
      </div>

      <div className="profile-methods">
        {methods.length > 0 ? (
          <ul className="profile-methods__list">
            {methods.map((item) => (
              <li key={item.id} className="profile-method">
                <div className="profile-method__copy">
                  <strong>{methodTitle(item.type)}</strong>
                  <span>{methodSubtitle(item)}</span>
                </div>
                <div className="profile-method__actions">
                  {item.isDefault ? (
                    <em className="pay-method__badge">Основной</em>
                  ) : (
                    <button
                      type="button"
                      className="profile-method__link"
                      onClick={() => handleSetDefault(item.id)}
                      disabled={updateProfile.isPending}
                    >
                      Сделать основным
                    </button>
                  )}
                  <button
                    type="button"
                    className="profile-method__remove"
                    onClick={() => handleRemove(item.id)}
                    disabled={updateProfile.isPending}
                    aria-label="Удалить"
                  >
                    Удалить
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="profile-panel">
            <p>Пока нет сохранённых способов оплаты.</p>
          </div>
        )}

        {!showForm ? (
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => {
              setShowForm(true)
              setFormError('')
              setSuccess('')
            }}
          >
            Добавить способ оплаты
          </button>
        ) : (
          <form className="profile-panel profile-methods__form" onSubmit={handleAdd}>
            <h2>Новый способ</h2>

            <div className="profile-methods__types" role="group" aria-label="Тип">
              {METHOD_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`pay-method${type === item.id ? ' is-active' : ''}`}
                  onClick={() => {
                    setType(item.id)
                    setFormError('')
                  }}
                >
                  <strong>{item.title}</strong>
                  {type === item.id ? (
                    <em className="pay-method__badge">Выбрано</em>
                  ) : null}
                </button>
              ))}
            </div>

            {type === 'kaspi' ? (
              <label>
                Номер телефона
                <input
                  type="tel"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="+7 900 000-00-00"
                  autoComplete="tel"
                  autoFocus
                />
              </label>
            ) : (
              <div className="profile-card-fields">
                <label>
                  Номер карты
                  <input
                    type="text"
                    inputMode="numeric"
                    value={card.number}
                    onChange={(e) =>
                      setCard((prev) => ({
                        ...prev,
                        number: formatCardNumber(e.target.value),
                      }))
                    }
                    placeholder="ACCT-000003"
                    autoComplete="cc-number"
                    autoFocus
                  />
                </label>
                <label>
                  Владелец
                  <input
                    type="text"
                    value={card.holder}
                    onChange={(e) =>
                      setCard((prev) => ({
                        ...prev,
                        holder: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="IVAN IVANOV"
                    autoComplete="cc-name"
                  />
                </label>
                <div className="profile-card-fields__row">
                  <label>
                    Срок
                    <input
                      type="text"
                      inputMode="numeric"
                      value={card.expiry}
                      onChange={(e) =>
                        setCard((prev) => ({
                          ...prev,
                          expiry: formatExpiry(e.target.value),
                        }))
                      }
                      placeholder="MM/YY"
                      autoComplete="cc-exp"
                    />
                  </label>
                  <label>
                    CVV
                    <input
                      type="password"
                      inputMode="numeric"
                      value={card.cvv}
                      onChange={(e) =>
                        setCard((prev) => ({
                          ...prev,
                          cvv: onlyDigits(e.target.value).slice(0, 4),
                        }))
                      }
                      placeholder="•••"
                      autoComplete="cc-csc"
                    />
                  </label>
                </div>
              </div>
            )}

            {formError ? <p className="form-error">{formError}</p> : null}

            <div className="profile-methods__form-actions">
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? 'Сохраняем…' : 'Добавить'}
              </button>
              <button
                type="button"
                className="btn btn-soft btn-block"
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
                disabled={updateProfile.isPending}
              >
                Отмена
              </button>
            </div>
          </form>
        )}

        {success && !showForm ? (
          <p className="form-success">{success}</p>
        ) : null}
        {formError && !showForm ? (
          <p className="form-error">{formError}</p>
        ) : null}
      </div>
    </section>
  )
}
