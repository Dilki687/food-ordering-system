import client from './client'

// ─── List / Fetch ─────────────────────────────────────────────────────────────

export const getAllPayments = (params) =>
  client.get('/payments', { params }).then((r) => r.data)

export const getPaymentById = (id) =>
  client.get(`/payments/${id}`).then((r) => r.data.data)

export const getPaymentByOrderId = (orderId) =>
  client.get(`/payments/order/${orderId}`).then((r) => r.data.data)

export const getPaymentWithDetails = (id) =>
  client.get(`/payments/${id}/details`).then((r) => r.data.data)

// ─── Create ───────────────────────────────────────────────────────────────────

/**
 * Auto-create a payment by joining Order Service + User Identity Service.
 * POST /api/payments/order/:orderId/user/:userId
 */
export const createPaymentFromOrder = (orderId, userId, body = {}) =>
  client
    .post(`/payments/order/${orderId}/user/${userId}`, body)
    .then((r) => r.data.data)

/**
 * Manual create (caller supplies amount).
 * POST /api/payments
 */
export const createPayment = (body) =>
  client.post('/payments', body).then((r) => r.data.data)

// ─── Confirm / Refund ─────────────────────────────────────────────────────────

/**
 * Confirm a Stripe PaymentIntent and update payment status.
 * POST /api/payments/:id/confirm
 */
export const confirmPayment = (id, paymentMethodId) =>
  client.post(`/payments/${id}/confirm`, { paymentMethodId }).then((r) => r.data.data)

/**
 * Process a full or partial refund.
 * POST /api/payments/:id/refund
 */
export const refundPayment = (id, amount) =>
  client
    .post(`/payments/${id}/refund`, amount != null ? { amount } : {})
    .then((r) => r.data.data)

// ─── Invoice ──────────────────────────────────────────────────────────────────

export const getInvoice = (id) =>
  client.get(`/payments/${id}/invoice`).then((r) => r.data.data)

// ─── User ─────────────────────────────────────────────────────────────────────

export const getPaymentsByUser = (userId, params) =>
  client.get(`/payments/user/${userId}`, { params }).then((r) => r.data)

export const getUserProfile = (userId) =>
  client.get(`/payments/user/${userId}/profile`).then((r) => r.data.data)
