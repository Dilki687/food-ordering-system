const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// POST /api/payments - Create a new payment (called by Order Service)
router.post("/", paymentController.createPayment);

// GET /api/payments - Get all payments (with optional filters)
router.get("/", paymentController.getAllPayments);

// ── User Identity Service integration routes (must be before /:id) ──────────

// GET /api/payments/user/:userId/profile
//   Proxies GET https://user-identity-service.onrender.com/api/users/:id
//   Returns the user's full profile from the User Identity Service
router.get("/user/:userId/profile", paymentController.getUserProfile);

// GET /api/payments/user/:userId
//   Returns all payments for this user enriched with their profile data
router.get("/user/:userId", paymentController.getPaymentsByUser);

// GET /api/payments/order/:orderId - Get payment by Order ID (before /:id)
router.get("/order/:orderId", paymentController.getPaymentByOrderId);

// ── Individual payment routes ───────────────────────────────────────────────

// POST /api/payments/:id/confirm - Confirm payment with payment method
router.post("/:id/confirm", paymentController.confirmPayment);

// POST /api/payments/:id/refund - Process a refund
router.post("/:id/refund", paymentController.refundPayment);

// GET /api/payments/:id/invoice - Generate invoice
router.get("/:id/invoice", paymentController.generateInvoice);

// GET /api/payments/:id - Get payment by ID
router.get("/:id", paymentController.getPaymentById);

module.exports = router;
