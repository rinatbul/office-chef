import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useEmployee, useUpdateProfile } from '../hooks/useEmployees'

export const ProfileCompanyPage = () => {
  const { userId } = useCurrentUser()
  const { data: profile, isPending, error } = useEmployee(userId)
  const updateProfile = useUpdateProfile()

  const [company, setCompany] = useState('Kaspi Design')
  const [office, setOffice] = useState('БЦ Нурлы Тау')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!profile) return
    setCompany(profile.company || 'Kaspi Design')
    setOffice(profile.office || 'БЦ Нурлы Тау')
  }, [profile])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')
    setSuccess('')

    try {
      await updateProfile.mutateAsync({
        id: userId,
        name: profile?.name || '',
        paymentInfo: profile?.paymentInfo || profile?.cardHint || '',
        company: company.trim(),
        office: office.trim(),
      })
      setSuccess('Сохранено')
    } catch (err) {
      setFormError(err.message)
    }
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
        <Link to="/profile" className="auth-back auth-back--plain" aria-label="Назад">
          <span aria-hidden="true">‹</span>
        </Link>
        <div>
          <h1>Настройки компании</h1>
        </div>
      </div>

      <form className="profile-panel" onSubmit={handleSubmit}>
        <label>
          Компания
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Kaspi Design"
          />
        </label>
        <label>
          Офис / БЦ
          <input
            type="text"
            value={office}
            onChange={(e) => setOffice(e.target.value)}
            placeholder="БЦ Нурлы Тау"
          />
        </label>
        {formError ? <p className="form-error">{formError}</p> : null}
        {success ? <p className="form-success">{success}</p> : null}
        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={updateProfile.isPending}
        >
          {updateProfile.isPending ? 'Сохраняем…' : 'Сохранить'}
        </button>
      </form>
    </section>
  )
}
