const request = require("supertest");
const app = require("../src/app");

// Mock the Payment model
jest.mock("../src/models/Payment");
const Payment = require("../src/models/Payment");

// Mock Stripe
jest.mock("stripe", () => {
  return jest.fn(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: "pi_test_123456",
        client_secret: "pi_test_123456_secret_abc",
        status: "requires_payment_method",
      }),
      confirm: jest.fn().mockResolvedValue({
        id: "pi_test_123456",
        status: "succeeded",
      }),
    },
    refunds: {
      create: jest.fn().mockResolvedValue({
        id: "re_test_789",
        status: "succeeded",
      }),
    },
  }));
});

// Helper to create a mock payment document
const mockPayment = (overrides = {}) => ({
  _id: "665f1a2b3c4d5e6f7a8b9c0d",
  orderId: "order_001",
  userId: "user_001",
  amount: 25.99,
  currency: "usd",
  status: "processing",
  paymentMethod: "card",
  stripePaymentIntentId: "pi_test_123456",
  stripeClientSecret: "pi_test_123456_secret_abc",
  description: "Payment for Order order_001",
  refundId: null,
  refundAmount: 0,
  metadata: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  save: jest.fn().mockResolvedValue(true),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ==================== HEALTH CHECK ====================
describe("Health Check", () => {
  it("GET /health should return status UP", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("UP");
    expect(res.body.service).toBe("payment-service");
  });
});

// ==================== POST /api/payments ====================
describe("POST /api/payments", () => {
  it("should create a new payment successfully", async () => {
    const mock = mockPayment();
    Payment.mockImplementation(() => ({
      ...mock,
      save: jest.fn().mockResolvedValue(mock),
    }));

    const res = await request(app).post("/api/payments").send({
      orderId: "order_001",
      userId: "user_001",
      amount: 25.99,
      currency: "usd",
      description: "Test payment",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stripePaymentIntentId).toBe("pi_test_123456");
    expect(res.body.data.amount).toBe(25.99);
    expect(res.body.data.status).toBe("processing");
  });

  it("should return 400 if orderId is missing", async () => {
    const res = await request(app).post("/api/payments").send({
      userId: "user_001",
      amount: 25.99,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if userId is missing", async () => {
    const res = await request(app).post("/api/payments").send({
      orderId: "order_001",
      amount: 25.99,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if amount is missing", async () => {
    const res = await request(app).post("/api/payments").send({
      orderId: "order_001",
      userId: "user_001",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ==================== GET /api/payments ====================
describe("GET /api/payments", () => {
  it("should return all payments with pagination", async () => {
    const payments = [mockPayment(), mockPayment({ orderId: "order_002" })];

    Payment.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(payments),
        }),
      }),
    });
    Payment.countDocuments = jest.fn().mockResolvedValue(2);

    const res = await request(app).get("/api/payments");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination.total).toBe(2);
  });

  it("should filter by status", async () => {
    const payments = [mockPayment({ status: "succeeded" })];

    Payment.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(payments),
        }),
      }),
    });
    Payment.countDocuments = jest.fn().mockResolvedValue(1);

    const res = await request(app).get("/api/payments?status=succeeded");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  it("should filter by userId", async () => {
    const payments = [mockPayment()];

    Payment.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(payments),
        }),
      }),
    });
    Payment.countDocuments = jest.fn().mockResolvedValue(1);

    const res = await request(app).get("/api/payments?userId=user_001");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });
});

// ==================== GET /api/payments/:id ====================
describe("GET /api/payments/:id", () => {
  it("should return a payment by ID", async () => {
    const mock = mockPayment();
    Payment.findById = jest.fn().mockResolvedValue(mock);

    const res = await request(app).get(`/api/payments/${mock._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderId).toBe("order_001");
  });

  it("should return 404 if payment not found", async () => {
    Payment.findById = jest.fn().mockResolvedValue(null);

    const res = await request(app).get("/api/payments/665f1a2b3c4d5e6f7a8b9c0d");

    expect(res.status).toBe(404);
  });
});

// ==================== GET /api/payments/order/:orderId ====================
describe("GET /api/payments/order/:orderId", () => {
  it("should return payment by order ID", async () => {
    const mock = mockPayment({ orderId: "order_test_100" });
    Payment.findOne = jest.fn().mockResolvedValue(mock);

    const res = await request(app).get("/api/payments/order/order_test_100");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderId).toBe("order_test_100");
  });

  it("should return 404 if order not found", async () => {
    Payment.findOne = jest.fn().mockResolvedValue(null);

    const res = await request(app).get("/api/payments/order/nonexistent_order");

    expect(res.status).toBe(404);
  });
});

// ==================== POST /api/payments/:id/confirm ====================
describe("POST /api/payments/:id/confirm", () => {
  it("should confirm a payment", async () => {
    const mock = mockPayment({ status: "processing" });
    Payment.findById = jest.fn().mockResolvedValue(mock);

    const res = await request(app)
      .post(`/api/payments/${mock._id}/confirm`)
      .send({ paymentMethodId: "pm_card_visa" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("succeeded");
  });

  it("should return 400 if paymentMethodId is missing", async () => {
    const res = await request(app)
      .post("/api/payments/665f1a2b3c4d5e6f7a8b9c0d/confirm")
      .send({});

    expect(res.status).toBe(400);
  });

  it("should return 404 if payment not found", async () => {
    Payment.findById = jest.fn().mockResolvedValue(null);

    const res = await request(app)
      .post("/api/payments/665f1a2b3c4d5e6f7a8b9c0d/confirm")
      .send({ paymentMethodId: "pm_card_visa" });

    expect(res.status).toBe(404);
  });

  it("should return 400 if payment already succeeded", async () => {
    const mock = mockPayment({ status: "succeeded" });
    Payment.findById = jest.fn().mockResolvedValue(mock);

    const res = await request(app)
      .post(`/api/payments/${mock._id}/confirm`)
      .send({ paymentMethodId: "pm_card_visa" });

    expect(res.status).toBe(400);
  });
});

// ==================== POST /api/payments/:id/refund ====================
describe("POST /api/payments/:id/refund", () => {
  it("should refund a succeeded payment (full)", async () => {
    const mock = mockPayment({ status: "succeeded" });
    Payment.findById = jest.fn().mockResolvedValue(mock);

    const res = await request(app)
      .post(`/api/payments/${mock._id}/refund`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("refunded");
    expect(res.body.data.refundAmount).toBe(25.99);
  });

  it("should refund a partial amount", async () => {
    const mock = mockPayment({ status: "succeeded" });
    Payment.findById = jest.fn().mockResolvedValue(mock);

    const res = await request(app)
      .post(`/api/payments/${mock._id}/refund`)
      .send({ amount: 10.0 });

    expect(res.status).toBe(200);
    expect(res.body.data.refundAmount).toBe(10.0);
  });

  it("should return 400 if payment is not succeeded", async () => {
    const mock = mockPayment({ status: "pending" });
    Payment.findById = jest.fn().mockResolvedValue(mock);

    const res = await request(app)
      .post(`/api/payments/${mock._id}/refund`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("should return 400 if refund amount exceeds payment", async () => {
    const mock = mockPayment({ status: "succeeded", amount: 10.0 });
    Payment.findById = jest.fn().mockResolvedValue(mock);

    const res = await request(app)
      .post(`/api/payments/${mock._id}/refund`)
      .send({ amount: 50.0 });

    expect(res.status).toBe(400);
  });
});

// ==================== GET /api/payments/:id/invoice ====================
describe("GET /api/payments/:id/invoice", () => {
  it("should generate an invoice", async () => {
    const mock = mockPayment({ status: "succeeded" });
    Payment.findById = jest.fn().mockResolvedValue(mock);

    const res = await request(app).get(`/api/payments/${mock._id}/invoice`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.invoiceNumber).toMatch(/^INV-/);
    expect(res.body.data.orderId).toBe("order_001");
    expect(res.body.data.amount).toBe(25.99);
    expect(res.body.data.currency).toBe("USD");
  });

  it("should return 404 if payment not found", async () => {
    Payment.findById = jest.fn().mockResolvedValue(null);

    const res = await request(app).get("/api/payments/665f1a2b3c4d5e6f7a8b9c0d/invoice");

    expect(res.status).toBe(404);
  });
});

// ==================== 404 Route ====================
describe("404 Route", () => {
  it("should return 404 for unknown routes", async () => {
    const res = await request(app).get("/api/unknown");
    expect(res.status).toBe(404);
  });
});
