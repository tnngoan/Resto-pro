/**
 * Callback DTOs are intentionally loose — each payment provider sends
 * a different shape. The actual validation happens via HMAC signature
 * verification inside each provider's verifyCallback() method.
 *
 * These types exist for documentation and controller type hints.
 */

/**
 * VNPay callback comes as GET query params with fields like:
 * vnp_TxnRef, vnp_Amount, vnp_ResponseCode, vnp_SecureHash, etc.
 */
export type VNPayCallbackParams = Record<string, string>;

/**
 * MoMo callback comes as POST JSON body:
 * partnerCode, orderId, requestId, amount, resultCode, signature, etc.
 */
export interface MoMoCallbackBody {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  orderInfo: string;
  orderType: string;
  transId: number;
  resultCode: number;
  message: string;
  payType: string;
  responseTime: number;
  extraData: string;
  signature: string;
}

/**
 * ZaloPay callback comes as POST JSON body:
 * data (JSON string), mac (HMAC signature), type (1=success, 2=fail)
 */
export interface ZaloPayCallbackBody {
  data: string;
  mac: string;
  type: number;
}
