import { apiRequest } from './client'

export const fetchEmployees = async () => {
  return apiRequest('/employees')
}

export const fetchEmployee = async (id) => {
  return apiRequest(`/employees/${id}`)
}

export const updateEmployee = async ({
  id,
  name,
  paymentInfo,
  company,
  office,
  paymentMethods,
}) => {
  const body = { name, paymentInfo, company, office }
  if (Array.isArray(paymentMethods)) {
    body.paymentMethods = paymentMethods
  }

  return apiRequest(`/employees/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}
