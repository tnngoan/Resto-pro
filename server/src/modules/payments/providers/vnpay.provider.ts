import * as crypto from 'crypto';
import * as querystring from 'querystring';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPaymentProvider,
  CreatePaymentParams,
  CreatePaymentResult,
  VerifyCallbackResult,
} from '../interfaces/payment-provider.interface';

/**
 * VNPay payment gateway provider.
 *
 * Flow:
 *   1. createPayment() builds a signed URL → redirect customer to VNPay checkout
 *   2. After payment, VNPay redirects (GET) to our callback with query params
 *   3. verifyCallback() checks the HMAC-SHA512 signature and returns result
 *
 * Docs: https://sandbox.vnpayment.vn/apis/
 */
@Injectable()
export class VNPayProvider implements IPaymentProvider {
  private readonly logger = new Logger('VNPayProvider');

  private readonly tmnCode: string;
  private readonly hashSecret: string;
  private readonly vnpUrl: string;

  constructor(private configService: ConfigService) {
    this.tmnCode = this.configService.get<string>('VNPAY_TMN_CODE', '');
    this.hashSecret = this.configService.get<string>('VNPAY_HASH_SECRET', '');
    this.vnpUrl = this.configService.get<string>(
      'VNPAY_URL',
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    );
  }

  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    const { orderId, amount, description, returnUrl, ipAddress } = params;
    const createDate = this.formatDate(new Date());
    const txnRef = `${orderId.slice(0, 8)}-${Date.now()}`;

    const vnpParams: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Amount: String(amount * 100), // VNPay requires amount × 100
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: description.slice(0, 255),
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddress || '127.0.0.1',
      vnp_CreateDate: createDate,
    };

    // VNPay requires params sorted alphabetically before signing
    const sortedParams = this.sortObject(vnpParams);
    const signData = querystring.stringify(sortedParams, '&', '=');
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const paymentUrl = `${this.vnpUrl}?${signData}&vnp_SecureHash=${secureHash}`;

    this.logger.log(`VNPay payment created: txnRef=${txnRef}, amount=${amount} VND`);

    return {
      paymentUrl,
      transactionId: txnRef,
    };
  }

  async verifyCallback(params: Record<string, string>): Promise<VerifyCallbackResult> {
    // Extract and remove the hash fields before re-computing
    const secureHash = params['vnp_SecureHash'];
    const callbackParams = { ...params };
    delete callbackParams['vnp_SecureHash'];
    delete callbackParams['vnp_SecureHashType'];

    const sortedParams = this.sortObject(callbackParams);
    const signData = querystring.stringify(sortedParams, '&', '=');
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const checkHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const isValid = secureHash === checkHash;
    const responseCode = params['vnp_ResponseCode'];
    const status = responseCode === '00' ? 'SUCCESS' : 'FAILED';

    this.logger.log(
      `VNPay callback verified: txnRef=${params['vnp_TxnRef']}, ` +
        `valid=${isValid}, responseCode=${responseCode}, status=${status}`,
    );

    return {
      isValid,
      transactionId: params['vnp_TxnRef'],
      amount: parseInt(params['vnp_Amount'], 10) / 100, // Convert back from ×100
      status,
    };
  }

  /**
   * Sort object keys alphabetically — required by VNPay's signing spec.
   */
  private sortObject(obj: Record<string, string>): Record<string, string> {
    return Object.keys(obj)
      .sort()
      .reduce((sorted, key) => {
        sorted[key] = obj[key];
        return sorted;
      }, {} as Record<string, string>);
  }

  /**
   * Format date to VNPay's expected format: yyyyMMddHHmmss
   */
  private formatDate(date: Date): string {
    return date.toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
  }
}
