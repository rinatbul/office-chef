import { apiRequest } from './client'

export const fetchOrders = async () => {
  return apiRequest('/orders')
}

export const fetchOrder = async (id) => {
  return apiRequest(`/orders/${id}`)
}

export const createOrder = async (payload) => {
  return apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const addOrderItem = async ({ orderId, ...payload }) => {
  return apiRequest(`/orders/${orderId}/items`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const deleteOrderItem = async ({ orderId, itemId, employeeId }) => {
  const query = new URLSearchParams({ employeeId }).toString()
  return apiRequest(`/orders/${orderId}/items/${itemId}?${query}`, {
    method: 'DELETE',
  })
}

export const parseOrderMenu = async ({ orderId, text, employeeId }) => {
  return apiRequest(`/orders/${orderId}/parse`, {
    method: 'POST',
    body: JSON.stringify({ text, employeeId }),
  })
}

export const fetchOrderSplit = async (orderId) => {
  return apiRequest(`/orders/${orderId}/split`)
}

export const payOrderShare = async ({ orderId, employeeId, method }) => {
  return apiRequest(`/orders/${orderId}/pay`, {
    method: 'POST',
    body: JSON.stringify({ employeeId, method }),
  })
}

export const checkoutOrder = async ({ orderId, employeeId }) => {
  return apiRequest(`/orders/${orderId}/checkout`, {
    method: 'POST',
    body: JSON.stringify({ employeeId }),
  })
}

export const voteOrderPlace = async ({ orderId, employeeId, optionId }) => {
  return apiRequest(`/orders/${orderId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ employeeId, optionId }),
  })
}

export const endOrderVote = async ({ orderId, employeeId }) => {
  return apiRequest(`/orders/${orderId}/end-vote`, {
    method: 'POST',
    body: JSON.stringify({ employeeId }),
  })
}

export const completeOrder = async ({ orderId, employeeId }) => {
  return apiRequest(`/orders/${orderId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ employeeId }),
  })
}

export const suggestAiOptions = async (orderId) => {
  return apiRequest(`/orders/${orderId}/ai-options`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}
