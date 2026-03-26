import * as crypto from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPaymentProvider,
  CreatePaymentParams,
  CreatePaymentResult,
  VerifyCallbackResult,
} from '../interfaces/payment-provider.interface';

/**
 * MoMo e-wallet payment gateway provider.
 *
 * Flow:
 *   1. createPayment() sends a signed POST to MoMo API → returns payUrl + qrCodeUrl
 *   2. Customer scans QR or clicks payUrl in the MoMo app
 *   3. MoMo sends a POST (IPN) to our callback endpoint
 *   4. verifyCallback() checks HMAC-SHA256 signature and returns result
 *
 * Docs: https://developers.momo.vn/#/docs/en/aiov2
 */
@Injectable()
export class MoMoProvider implements IPaymentProvider {
  private readonly logger = new Logger('MoMoProvider');

  private readonly partnerCode: string;
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly endpoint: string;

  constructor(private configService: ConfigService) {
    this.partnerCode = this.configService.get<string>('MOMO_PARTNER_CODE', '');
    this.accessKey = this.configService.get<string>('MOMO_ACCESS_KEY', '');
    this.secretKey = this.configService.get<string>('MOMO_SECRET_KEY', '');
    this.endpoint = this.configService.get<string>(
      'MOMO_ENDPOINT',
      'https://test-payment.momo.vn/v2/gateway/api',
    );
  }

  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    const { orderId, amount, description, returnUrl } = params;
    const requestId = `${orderId.slice(0, 8)}-${Date.now()}`;

    // MoMo's signature string must follow this exact field order
    const rawSignature = [
      `accessKey=${this.accessKey}`,
      `amount=${amount}`,
      `extraData=`,
      `ipnUrl=${returnUrl}`,
      `orderId=${requestId}`,
      `orderInfo=${description}`,
      `partnerCode=${this.partnerCode}`,
      `redirectUrl=${returnUrl}`,
      `requestId=${requestId}`,
      `requestType=payWithMethod`,
    ].join('&');

    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    const body = {
      partnerCode: this.partnerCode,
      partnerName: 'RestoPro',
      storeId: orderId,
      requestId,
      amount,
      orderId: requestId,
      orderInfo: description,
      redirectUrl: returnUrl,
      ipnUrl: returnUrl,
      lang: 'vi',
      requestType: 'payWithMethod',
      extraData: '',
      signature,
    };

    this.logger.log(`MoMo payment request: orderId=${requestId}, amount=${amount} VND`);

    const response = await fetch(`${this.endpoint}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as {
      resultCode: number;
      message?: string;
      payUrl?: string;
      qrCodeUrl?: string;
    };

    if (data.resultCode !== 0) {
      this.logger.error(
        `MoMo createPayment failed: resultCode=${data.resultCode}, message=${data.message}`,
      );
      throw new Error(`MoMo payment creation failed: ${data.message || 'Unknown error'}`);
    }

    this.logger.log(`MoMo payment created: orderId=${requestId}, payUrl=${data.payUrl}`);

    return {
      paymentUrl: data.payUrl!,
      qrCodeUrl: data.qrCodeUrl,
      transactionId: requestId,
    };
  }

  async verifyCallback(params: Record<string, any>): Promise<VerifyCallbackResult> {
    // Re-create the signature from the callback fields in MoMo's required order
    const rawSignature = [
      `accessKey=${this.accessKey}`,
      `amount=${params.amount}`,
      `extraData=${params.extraData}`,
      `message=${params.message}`,
      `orderId=${params.orderId}`,
      `orderInfo=${params.orderInfo}`,
      `orderType=${params.orderType}`,
      `partnerCode=${params.partnerCode}`,
      `payType=${params.payType}`,
      `requestId=${params.requestId}`,
      `responseTime=${params.responseTime}`,
      `resultCode=${params.resultCode}`,
      `transId=${params.transId}`,
    ].join('&');

    const expectedSignature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    const isValid = expectedSignature === params.signature;
    // MoMo: resultCode 0 = success, anything else = failure
    const status = params.resultCode === 0 ? 'SUCCESS' : 'FAILED';

    this.logger.log(
      `MoMo callback verified: orderId=${params.orderId}, ` +
        `valid=${isValid}, resultCode=${params.resultCode}, status=${status}`,
    );

    return {
      isValid,
      transactionId: params.orderId,
      amount: params.amount,
      status,
    };
  }
}
