/**
 * Common interface for all Vietnamese payment gateway providers.
 * Each provider (VNPay, MoMo, ZaloPay) implements this so the
 * PaymentsService can route to the correct one without caring about
 * provider-specific details.
 */
export interface CreatePaymentParams {
  orderId: string;
  amount: number; // VND integer (no decimals)
  description: string; // e.g. "Bàn 03 - 3 món"
  returnUrl: string;
  ipAddress?: string;
}

export interface CreatePaymentResult {
  paymentUrl: string;
  qrCodeUrl?: string;
  transactionId: string;
}

export interface VerifyCallbackResult {
  isValid: boolean;
  transactionId: string;
  amount: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
}

export interface IPaymentProvider {
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;
  verifyCallback(params: Record<string, any>): Promise<VerifyCallbackResult>;
}
