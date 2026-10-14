import { useAuth } from '../context/AuthContext'

export const useCurrentUser = () => {
  const { user, logout } = useAuth()

  return {
    user,
    userId: user?.id || null,
    userName: user?.name || '',
    paymentInfo: user?.paymentInfo || '',
    logout,
  }
}
