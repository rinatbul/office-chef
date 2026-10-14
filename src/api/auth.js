import { apiRequest } from './client'

export const loginByName = async ({ name, password }) => {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ name, password }),
  })
}
