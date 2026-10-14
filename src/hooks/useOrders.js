import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addOrderItem,
  checkoutOrder,
  completeOrder,
  createOrder,
  deleteOrderItem,
  endOrderVote,
  fetchOrder,
  fetchOrders,
  fetchOrderSplit,
  parseOrderMenu,
  payOrderShare,
  suggestAiOptions,
  voteOrderPlace,
} from '../api/orders'

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
  })
}

export const useOrder = (id) => {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => fetchOrder(id),
    enabled: Boolean(id),
  })
}

export const useOrderSplit = (id) => {
  return useQuery({
    queryKey: ['orders', id, 'split'],
    queryFn: () => fetchOrderSplit(id),
    enabled: Boolean(id),
  })
}

export const useCreateOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export const useAddOrderItem = (orderId) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => addOrderItem({ orderId, ...payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders', orderId, 'split'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export const useDeleteOrderItem = (orderId) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, employeeId }) =>
      deleteOrderItem({ orderId, itemId, employeeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders', orderId, 'split'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export const useParseOrderMenu = (orderId) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => parseOrderMenu({ orderId, ...payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders', orderId, 'split'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export const usePayOrderShare = (orderId) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) =>
      payOrderShare({
        orderId,
        employeeId: typeof payload === 'string' ? payload : payload.employeeId,
        method: typeof payload === 'string' ? 'kaspi' : payload.method,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders', orderId, 'split'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export const useCheckoutOrder = (orderId) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (employeeId) => checkoutOrder({ orderId, employeeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders', orderId, 'split'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export const useVoteOrder = (orderId) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => voteOrderPlace({ orderId, ...payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export const useEndOrderVote = (orderId) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (employeeId) => endOrderVote({ orderId, employeeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export const useCompleteOrder = (orderId) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (employeeId) => completeOrder({ orderId, employeeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export const useSuggestAiOptions = (orderId) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => suggestAiOptions(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
