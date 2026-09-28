import "server-only";

export type PaymentProvider =
  | "click"
  | "payme";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

export type RefundStatus =
  | "pending"
  | "succeeded"
  | "failed"
  | "cancelled";

export interface CreatePaymentInput {
  bookingId: string;
  bookingNumber: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
}

export interface CreatePaymentResult {
  paymentTransactionId: string;
  provider: PaymentProvider;
  status:
    | "redirect_required"
    | "created"
    | "not_implemented";
  checkoutUrl?: string;
}

export interface VerifyPaymentResult {
  success: boolean;
  status: PaymentStatus;
  paymentTransactionId: string;
}

export interface RefundPaymentInput {
  bookingId: string;
  paymentTransactionId: string;
  amount: number;
  currency: string;
  reason?: string;
}

export interface PaymentServiceInterface {
  createPayment(
    input: CreatePaymentInput
  ): Promise<CreatePaymentResult>;

  verifyPayment(
    providerTransactionId: string
  ): Promise<VerifyPaymentResult>;

  handleWebhook(
    rawPayload: unknown
  ): Promise<void>;

  refundPayment(
    input: RefundPaymentInput
  ): Promise<void>;
}

export class PaymentProviderNotConfiguredError extends Error {
  readonly code = "PAYMENT_PROVIDER_NOT_CONFIGURED";

  constructor(provider: PaymentProvider) {
    super(`Payment provider "${provider}" is not configured.`);
    this.name = "PaymentProviderNotConfiguredError";
  }
}

class UnconfiguredPaymentService implements PaymentServiceInterface {
  async createPayment(
    input: CreatePaymentInput,
  ): Promise<CreatePaymentResult> {
    if (!input.bookingId) {
      throw new Error("bookingId is required.");
    }

    if (!input.bookingNumber) {
      throw new Error("bookingNumber is required.");
    }

    if (
      !Number.isFinite(input.amount) ||
      input.amount <= 0
    ) {
      throw new Error(
        "Payment amount must be greater than zero."
      );
    }

    if (!input.currency) {
      throw new Error(
        "Payment currency is required."
      );
    }

    if (!input.provider) {
      throw new Error(
        "Payment provider is required."
      );
    }
    throw new PaymentProviderNotConfiguredError(input.provider);
  }

  /**
   * Verify payment.
   *
   * This will later communicate with
   * the selected provider.
   *
   * IMPORTANT:
   * The frontend must NEVER be trusted
   * to mark a booking as PAID.
   */
  async verifyPayment(
    providerTransactionId: string
  ): Promise<VerifyPaymentResult> {
    if (!providerTransactionId) {
      throw new Error(
        "providerTransactionId is required."
      );
    }

    throw new Error("Payment provider verification is not configured.");
  }

  /**
   * Provider callback / webhook handler.
   *
   * Later this method will:
   *
   * 1. Validate provider signature
   * 2. Find payment transaction
   * 3. Verify provider transaction
   * 4. Verify amount
   * 5. Verify currency
   * 6. Update payment transaction
   * 7. Move booking:
   *
   * PENDING_PAYMENT -> PAID
   *
   * 8. Make QR usable
   *
   * This must be idempotent.
   */
  async handleWebhook(
    _rawPayload: unknown
  ): Promise<void> {
    throw new Error("Payment webhooks are not configured.");
  }

  /**
   * Creates an internal refund record.
   *
   * Actual provider refund will be added
   * after provider integration.
   */
  async refundPayment(
    input: RefundPaymentInput
  ): Promise<void> {
    if (!input.bookingId || !input.paymentTransactionId) {
      throw new Error("Booking and payment IDs are required.");
    }
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new Error("Refund amount must be greater than zero.");
    }
    throw new Error("Payment refunds are not configured.");
  }
}

export const paymentService: PaymentServiceInterface =
  new UnconfiguredPaymentService();