import { apiRequest } from './client'

export const fetchPreferences = async (date) => {
  const query = date ? `?date=${encodeURIComponent(date)}` : ''
  return apiRequest(`/preferences${query}`)
}

export const savePreference = async (payload) => {
  return apiRequest('/preferences', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const runAiPick = async (payload) => {
  return apiRequest('/preferences/ai-pick', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const runLunchMatch = async () => {
  return apiRequest('/match', {
    method: 'POST',
    body: JSON.stringify({}),
  })
}
