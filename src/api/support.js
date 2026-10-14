import { apiRequest } from './client'

export const sendSupportMessage = async (payload) => {
  return apiRequest('/support', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
