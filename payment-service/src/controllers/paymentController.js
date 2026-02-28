const paymentService = require("../services/paymentService");

/**
 * @desc    Process a new payment (called by Order Service)
 * @route   POST /api/payments
 */
exports.createPayment = async (req, res, next) => {
  try {
    const { orderId, userId, amount, currency, paymentMethod, description, metadata } = req.body;

    if (!orderId || !userId || !amount) {
      return res.status(400).json({
        success: false,
        message: "orderId, userId, and amount are required",
      });
    }

    const result = await paymentService.createPayment({
      orderId,
      userId,
      amount,
      currency,
      paymentMethod,
      description,
      metadata,
    });

    res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Confirm a payment with a payment method
 * @route   POST /api/payments/:id/confirm
 */
exports.confirmPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentMethodId } = req.body;

    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: "paymentMethodId is required",
      });
    }

    const result = await paymentService.confirmPayment(id, paymentMethodId);

    res.status(200).json({
      success: true,
      message: `Payment ${result.status}`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get payment by ID
 * @route   GET /api/payments/:id
 */
exports.getPaymentById = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id);

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get payment by order ID
 * @route   GET /api/payments/order/:orderId
 */
exports.getPaymentByOrderId = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentByOrderId(req.params.orderId);

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all payments with filters
 * @route   GET /api/payments
 */
exports.getAllPayments = async (req, res, next) => {
  try {
    const { status, userId, page, limit } = req.query;
    const result = await paymentService.getAllPayments({ status, userId, page, limit });

    res.status(200).json({
      success: true,
      data: result.payments,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Process a refund
 * @route   POST /api/payments/:id/refund
 */
exports.refundPayment = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const result = await paymentService.refundPayment(req.params.id, amount);

    res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate invoice for a payment
 * @route   GET /api/payments/:id/invoice
 */
exports.generateInvoice = async (req, res, next) => {
  try {
    const invoice = await paymentService.generateInvoice(req.params.id);

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};
