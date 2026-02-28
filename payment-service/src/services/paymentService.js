const stripe = require("stripe");
const Payment = require("../models/Payment");

// Initialize Stripe with the secret key
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

class PaymentService {
  /**
   * Create a Stripe PaymentIntent and store the payment record
   */
  async createPayment({ orderId, userId, amount, currency, paymentMethod, description, metadata }) {
    // Validate minimum amount (Stripe requires at least 50 cents)
    if (amount < 0.5) {
      throw { status: 400, message: "Minimum payment amount is $0.50" };
    }

    // Convert amount to cents for Stripe (Stripe uses smallest currency unit)
    const amountInCents = Math.round(amount * 100);

    // Create a Stripe PaymentIntent
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: amountInCents,
      currency: currency || "usd",
      payment_method_types: ["card"],
      description: description || `Payment for Order ${orderId}`,
      metadata: {
        orderId,
        userId,
        ...metadata,
      },
    });

    // Save payment record in database
    const payment = new Payment({
      orderId,
      userId,
      amount,
      currency: currency || "usd",
      status: "processing",
      paymentMethod: paymentMethod || "card",
      stripePaymentIntentId: paymentIntent.id,
      stripeClientSecret: paymentIntent.client_secret,
      description: description || `Payment for Order ${orderId}`,
      metadata,
    });

    await payment.save();

    return {
      paymentId: payment._id,
      stripePaymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
    };
  }

  /**
   * Confirm a payment using a Stripe payment method (e.g., test card token)
   */
  async confirmPayment(paymentId, paymentMethodId) {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw { status: 404, message: "Payment not found" };
    }

    if (payment.status === "succeeded") {
      throw { status: 400, message: "Payment has already been completed" };
    }

    // Confirm the PaymentIntent with Stripe
    const paymentIntent = await stripeClient.paymentIntents.confirm(
      payment.stripePaymentIntentId,
      {
        payment_method: paymentMethodId,
      }
    );

    // Update payment status based on Stripe response
    payment.status = paymentIntent.status === "succeeded" ? "succeeded" : "failed";
    await payment.save();

    return {
      paymentId: payment._id,
      orderId: payment.orderId,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      stripeStatus: paymentIntent.status,
    };
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId) {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw { status: 404, message: "Payment not found" };
    }
    return payment;
  }

  /**
   * Get payment by order ID
   */
  async getPaymentByOrderId(orderId) {
    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      throw { status: 404, message: "Payment not found for this order" };
    }
    return payment;
  }

  /**
   * Get all payments with optional filters
   */
  async getAllPayments({ status, userId, page = 1, limit = 10 }) {
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Payment.countDocuments(filter),
    ]);

    return {
      payments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Process a refund
   */
  async refundPayment(paymentId, amount) {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw { status: 404, message: "Payment not found" };
    }

    if (payment.status !== "succeeded") {
      throw { status: 400, message: "Only succeeded payments can be refunded" };
    }

    const refundAmount = amount || payment.amount;
    if (refundAmount > payment.amount) {
      throw { status: 400, message: "Refund amount cannot exceed payment amount" };
    }

    // Create refund via Stripe
    const refund = await stripeClient.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      amount: Math.round(refundAmount * 100), // convert to cents
    });

    // Update payment record
    payment.status = "refunded";
    payment.refundId = refund.id;
    payment.refundAmount = refundAmount;
    await payment.save();

    return {
      paymentId: payment._id,
      orderId: payment.orderId,
      refundId: refund.id,
      refundAmount,
      status: payment.status,
    };
  }

  /**
   * Generate an invoice object for a payment
   */
  async generateInvoice(paymentId) {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw { status: 404, message: "Payment not found" };
    }

    const invoice = {
      invoiceNumber: `INV-${payment._id.toString().slice(-8).toUpperCase()}`,
      paymentId: payment._id,
      orderId: payment.orderId,
      userId: payment.userId,
      amount: payment.amount,
      currency: payment.currency.toUpperCase(),
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      description: payment.description,
      issuedAt: payment.createdAt,
      paidAt: payment.status === "succeeded" ? payment.updatedAt : null,
      refundAmount: payment.refundAmount,
    };

    return invoice;
  }
}

module.exports = new PaymentService();
