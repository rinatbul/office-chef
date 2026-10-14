export const getOrderMemberIds = (order) => {
  return [
    ...new Set([
      order.createdBy,
      ...(order.votes || []).map((vote) => vote.employeeId),
      ...(order.items || []).map((item) => item.employeeId),
    ].filter(Boolean)),
  ]
}

export const splitBill = (order, employees) => {
  const items = order.items || []
  const deliveryFee = Number(order.deliveryFee) || 0
  const discountPercent = Number(order.discountPercent) || 0
  const payments = order.payments || []
  const initiatorId = order.createdBy
  const initiator = employees.find((e) => e.id === initiatorId)

  const byEmployee = new Map()

  for (const item of items) {
    const current = byEmployee.get(item.employeeId) || {
      employeeId: item.employeeId,
      itemsTotal: 0,
      itemsCount: 0,
      itemNames: [],
    }
    current.itemsTotal += Number(item.price) || 0
    current.itemsCount += 1
    current.itemNames.push(item.name)
    byEmployee.set(item.employeeId, current)
  }

  const participants = [...byEmployee.values()]
  const subtotal = participants.reduce((sum, row) => sum + row.itemsTotal, 0)
  const discountAmount = Math.round((subtotal * discountPercent) / 100)
  const afterDiscount = subtotal - discountAmount
  const participantCount = participants.length || 1
  const deliveryPerPerson = Math.round(deliveryFee / participantCount)

  const rows = participants.map((row) => {
    const shareRatio = subtotal > 0 ? row.itemsTotal / subtotal : 0
    const personalDiscount = Math.round(discountAmount * shareRatio)
    const foodAfterDiscount = row.itemsTotal - personalDiscount
    const total = foodAfterDiscount + deliveryPerPerson
    const employee = employees.find((e) => e.id === row.employeeId)
    const isInitiator = row.employeeId === initiatorId
    const payment = payments.find((p) => p.employeeId === row.employeeId)
    const paid = isInitiator || Boolean(payment)

    return {
      employeeId: row.employeeId,
      name: employee?.name || 'Неизвестный',
      cardHint: employee?.cardHint || '',
      itemsCount: row.itemsCount,
      itemNames: row.itemNames,
      itemsTotal: row.itemsTotal,
      discount: personalDiscount,
      deliveryShare: deliveryPerPerson,
      total,
      isInitiator,
      paid,
      paidAt: payment?.paidAt || null,
      paymentMethod: payment?.method || null,
      paymentChannel: payment?.channel || null,
      paymentStatus: isInitiator ? 'initiator' : paid ? 'paid' : 'pending',
      hasItems: true,
    }
  })

  const memberIds = getOrderMemberIds(order)
  const memberSummary = memberIds.map((employeeId) => {
    const existing = rows.find((row) => row.employeeId === employeeId)
    if (existing) return existing
    const employee = employees.find((e) => e.id === employeeId)
    return {
      employeeId,
      name: employee?.name || 'Неизвестный',
      cardHint: employee?.cardHint || '',
      itemsCount: 0,
      itemNames: [],
      itemsTotal: 0,
      discount: 0,
      deliveryShare: 0,
      total: 0,
      isInitiator: employeeId === initiatorId,
      paid: employeeId === initiatorId,
      paidAt: null,
      paymentStatus: employeeId === initiatorId ? 'initiator' : 'pending',
      hasItems: false,
    }
  })

  const missingMembers = memberSummary.filter((row) => !row.hasItems)
  const payableRows = rows.filter((row) => !row.isInitiator)
  const paidAmount = payableRows
    .filter((row) => row.paid)
    .reduce((sum, row) => sum + row.total, 0)
  const expectedAmount = payableRows.reduce((sum, row) => sum + row.total, 0)
  const pendingCount = payableRows.filter((row) => !row.paid).length

  return {
    subtotal,
    discountPercent,
    discountAmount,
    deliveryFee,
    deliverySplitCount: participantCount,
    grandTotal: afterDiscount + deliveryFee,
    initiator: initiator
      ? {
          id: initiator.id,
          name: initiator.name,
          paymentInfo:
            order.paymentInfo ||
            initiator.paymentInfo ||
            initiator.cardHint ||
            'Реквизиты уточните у инициатора',
        }
      : null,
    paymentInfo:
      order.paymentInfo || initiator?.paymentInfo || initiator?.cardHint || '',
    collectedAmount: paidAmount,
    expectedAmount,
    pendingCount,
    rows,
    memberSummary,
    missingMembers,
  }
}

export const resolveDisplayStatus = (order, split) => {
  if (order.status === 'cancelled') return 'cancelled'
  if (order.status === 'delivered') return 'delivered'
  if (order.status === 'preparing') return 'preparing'
  if (order.status === 'awaiting_payment') return 'awaiting_payment'

  if (order.votingActive) return 'open'

  const pendingPayments = split?.pendingCount || 0
  if ((order.items || []).length > 0 && pendingPayments > 0) {
    return 'awaiting_payment'
  }

  if ((order.items || []).length > 0 && pendingPayments === 0) {
    return 'preparing'
  }

  return 'open'
}
