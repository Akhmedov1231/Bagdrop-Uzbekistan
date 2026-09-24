import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type PaymentProvider =
  | "click"
  | "payme"
  | "atmos"
  | "demo";

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type RefundStatus =
  | "PENDING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED";

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

class PlaceholderPaymentService
  implements PaymentServiceInterface
{
  /**
   * Server-side Supabase admin client.
   *
   * We intentionally use `any` here because the current project
   * does not yet have generated Supabase Database types.
   *
   * This can be replaced with generated Database types later.
   */
  private getSupabase(): any {
    return createAdminClient();
  }

  /**
   * Creates an internal payment transaction.
   *
   * IMPORTANT:
   * Provider API is NOT called yet.
   *
   * Current flow:
   *
   * Booking
   *    ↓
   * payment_transactions
   *    ↓
   * PENDING
   *
   * Later:
   *
   * PENDING
   *    ↓
   * Provider
   *    ↓
   * verified payment
   *    ↓
   * PAID
   */
  async createPayment(
    input: CreatePaymentInput
  ): Promise<CreatePaymentResult> {
    const supabase = this.getSupabase();

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

    /**
     * Load booking.
     */
    const {
      data: booking,
      error: bookingError,
    } = await supabase
      .from("bookings")
      .select(
        "id, booking_number, total_amount, currency, status"
      )
      .eq("id", input.bookingId)
      .maybeSingle();

    if (bookingError) {
      throw new Error(
        `Failed to load booking: ${bookingError.message}`
      );
    }

    if (!booking) {
      throw new Error(
        "Booking not found."
      );
    }

    /**
     * Make sure booking number belongs to booking.
     */
    if (
      booking.booking_number !==
      input.bookingNumber
    ) {
      throw new Error(
        "Booking number does not match."
      );
    }

    /**
     * Make sure payment amount matches
     * server-side booking amount.
     */
    const bookingAmount = Number(
      booking.total_amount
    );

    const requestedAmount = Number(
      input.amount
    );

    if (
      bookingAmount !== requestedAmount
    ) {
      throw new Error(
        "Payment amount does not match booking amount."
      );
    }

    /**
     * Make sure currency matches.
     */
    if (
      booking.currency !==
      input.currency
    ) {
      throw new Error(
        "Payment currency does not match booking currency."
      );
    }

    /**
     * Payment can only start from
     * PENDING_PAYMENT.
     */
    if (
      booking.status !==
      "PENDING_PAYMENT"
    ) {
      throw new Error(
        `Booking cannot start payment from status: ${booking.status}`
      );
    }

    /**
     * Check whether this booking already
     * has an active payment.
     *
     * This prevents accidental duplicate
     * payment transaction creation.
     */
    const {
      data: existingPayment,
      error: existingPaymentError,
    } = await supabase
      .from("payment_transactions")
      .select(
        "id, provider, status, payment_url"
      )
      .eq(
        "booking_id",
        input.bookingId
      )
      .in(
        "status",
        ["PENDING", "PAID"]
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();

    if (existingPaymentError) {
      throw new Error(
        `Failed to check existing payment: ${existingPaymentError.message}`
      );
    }

    /**
     * If an active payment already exists,
     * reuse it.
     */
    if (existingPayment) {
      return {
        paymentTransactionId:
          existingPayment.id,

        provider:
          existingPayment.provider as PaymentProvider,

        status:
          existingPayment.status ===
          "PAID"
            ? "created"
            : "not_implemented",

        checkoutUrl:
          existingPayment.payment_url ??
          undefined,
      };
    }

    /**
     * Create internal PENDING payment.
     *
     * No provider API is called yet.
     */
    const {
      data: payment,
      error: paymentError,
    } = await supabase
      .from("payment_transactions")
      .insert({
        booking_id:
          input.bookingId,

        provider:
          input.provider,

        amount:
          requestedAmount,

        currency:
          input.currency,

        status:
          "PENDING",
      })
      .select(
        "id, provider, status, payment_url"
      )
      .single();

    if (paymentError) {
      throw new Error(
        `Failed to create payment transaction: ${paymentError.message}`
      );
    }

    return {
      paymentTransactionId:
        payment.id,

      provider:
        payment.provider as PaymentProvider,

      status:
        "not_implemented",

      checkoutUrl:
        payment.payment_url ??
        undefined,
    };
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

    throw new Error(
      "Payment provider verification is not implemented yet."
    );
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
    throw new Error(
      "Payment webhooks are not implemented yet."
    );
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
    const supabase = this.getSupabase();

    if (!input.bookingId) {
      throw new Error(
        "bookingId is required."
      );
    }

    if (
      !input.paymentTransactionId
    ) {
      throw new Error(
        "paymentTransactionId is required."
      );
    }

    if (
      !Number.isFinite(input.amount) ||
      input.amount <= 0
    ) {
      throw new Error(
        "Refund amount must be greater than zero."
      );
    }

    /**
     * Load original payment.
     */
    const {
      data: payment,
      error: paymentError,
    } = await supabase
      .from("payment_transactions")
      .select(
        "id, booking_id, amount, currency, status"
      )
      .eq(
        "id",
        input.paymentTransactionId
      )
      .maybeSingle();

    if (paymentError) {
      throw new Error(
        `Failed to load payment: ${paymentError.message}`
      );
    }

    if (!payment) {
      throw new Error(
        "Payment transaction not found."
      );
    }

    /**
     * Make sure payment belongs
     * to the requested booking.
     */
    if (
      payment.booking_id !==
      input.bookingId
    ) {
      throw new Error(
        "Payment does not belong to this booking."
      );
    }

    /**
     * Only successful payments can
     * be refunded.
     */
    if (
      payment.status !== "PAID" &&
      payment.status !==
        "PARTIALLY_REFUNDED"
    ) {
      throw new Error(
        `Payment cannot be refunded from status: ${payment.status}`
      );
    }

    /**
     * Currency must match.
     */
    if (
      input.currency !==
      payment.currency
    ) {
      throw new Error(
        "Refund currency does not match payment currency."
      );
    }

    /**
     * Basic refund amount protection.
     *
     * More advanced cumulative refund
     * validation will be added later.
     */
    if (
      input.amount >
      Number(payment.amount)
    ) {
      throw new Error(
        "Refund amount cannot exceed payment amount."
      );
    }

    /**
     * Create refund record.
     *
     * Actual provider refund is NOT
     * executed yet.
     */
    const {
      error: refundError,
    } = await supabase
      .from("payment_refunds")
      .insert({
        booking_id:
          input.bookingId,

        payment_transaction_id:
          input.paymentTransactionId,

        amount:
          input.amount,

        currency:
          input.currency,

        reason:
          input.reason ?? null,

        status:
          "PENDING",
      });

    if (refundError) {
      throw new Error(
        `Failed to create refund record: ${refundError.message}`
      );
    }

    /**
     * Provider refund will be implemented
     * after the payment provider is selected.
     */
    throw new Error(
      "Refund provider integration is not implemented yet."
    );
  }
}

export const paymentService: PaymentServiceInterface =
  new PlaceholderPaymentService();