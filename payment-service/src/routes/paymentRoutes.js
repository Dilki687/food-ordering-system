const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// POST /api/payments - Create a new payment (called by Order Service)
router.post("/", paymentController.createPayment);

// POST /api/payments/:id/confirm - Confirm payment with payment method
router.post("/:id/confirm", paymentController.confirmPayment);

// GET /api/payments - Get all payments (with optional filters)
router.get("/", paymentController.getAllPayments);

// GET /api/payments/:id - Get payment by ID
router.get("/:id", paymentController.getPaymentById);

// GET /api/payments/order/:orderId - Get payment by Order ID
router.get("/order/:orderId", paymentController.getPaymentByOrderId);

// POST /api/payments/:id/refund - Process a refund
router.post("/:id/refund", paymentController.refundPayment);

// GET /api/payments/:id/invoice - Generate invoice
router.get("/:id/invoice", paymentController.generateInvoice);

module.exports = router;
