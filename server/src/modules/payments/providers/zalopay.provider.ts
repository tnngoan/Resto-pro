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
 * ZaloPay payment gateway provider.
 *
 * Flow:
 *   1. createPayment() sends a signed POST to ZaloPay API → returns order_url + QR
 *   2. Customer scans QR or opens order_url in ZaloPay app
 *   3. ZaloPay sends a POST callback to our endpoint
 *   4. verifyCallback() checks HMAC-SHA256 (key2) signature and returns result
 *
 * Key differences from VNPay/MoMo:
 *   - Uses app_trans_id format: yymmdd_uniqueId
 *   - Two keys: key1 (for creating orders), key2 (for verifying callbacks)
 *   - Amount must be integer VND (no ×100 like VNPay)
 *
 * Docs: https://docs.zalopay.vn/v2/
 */
@Injectable()
export class ZaloPayProvider implements IPaymentProvider {
  private readonly logger = new Logger('ZaloPayProvider');

  private readonly appId: string;
  private readonly key1: string;
  private readonly key2: string;
  private readonly endpoint: string;

  constructor(private configService: ConfigService) {
    this.appId = this.configService.get<string>('ZALOPAY_APP_ID', '');
    this.key1 = this.configService.get<string>('ZALOPAY_KEY1', '');
    this.key2 = this.configService.get<string>('ZALOPAY_KEY2', '');
    this.endpoint = this.configService.get<string>(
      'ZALOPAY_ENDPOINT',
      'https://sb-openapi.zalopay.vn/v2',
    );
  }

  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    const { orderId, amount, description, returnUrl } = params;

    // ZaloPay requires app_trans_id in format: yymmdd_uniqueId
    const now = new Date();
    const datePrefix = this.formatDatePrefix(now);
    const appTransId = `${datePrefix}_${orderId.slice(0, 8)}${Date.now().toString().slice(-6)}`;

    const embedData = JSON.stringify({
      redirecturl: returnUrl,
    });

    const items = JSON.stringify([]);

    // ZaloPay signing: key1 used for order creation
    // Format: appId|appTransId|appUser|amount|appTime|embedData|items
    const appTime = Date.now();
    const rawData = [
      this.appId,
      appTransId,
      'RestoPro', // appUser
      amount,
      appTime,
      embedData,
      items,
    ].join('|');

    const mac = crypto
      .createHmac('sha256', this.key1)
      .update(rawData)
      .digest('hex');

    const body = {
      app_id: parseInt(this.appId, 10),
      app_trans_id: appTransId,
      app_user: 'RestoPro',
      app_time: appTime,
      amount,
      item: items,
      description,
      embed_data: embedData,
      bank_code: '', // empty = show all payment options
      callback_url: returnUrl,
      mac,
    };

    this.logger.log(
      `ZaloPay payment request: appTransId=${appTransId}, amount=${amount} VND`,
    );

    const response = await fetch(`${this.endpoint}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as {
      return_code: number;
      return_message?: string;
      sub_return_message?: string;
      order_url?: string;
    };

    if (data.return_code !== 1) {
      this.logger.error(
        `ZaloPay createPayment failed: return_code=${data.return_code}, ` +
          `return_message=${data.return_message}, sub_return_message=${data.sub_return_message}`,
      );
      throw new Error(
        `ZaloPay payment creation failed: ${data.return_message || 'Unknown error'}`,
      );
    }

    this.logger.log(
      `ZaloPay payment created: appTransId=${appTransId}, orderUrl=${data.order_url}`,
    );

    return {
      paymentUrl: data.order_url!,
      qrCodeUrl: data.order_url, // ZaloPay order_url can be rendered as QR
      transactionId: appTransId,
    };
  }

  async verifyCallback(params: Record<string, any>): Promise<VerifyCallbackResult> {
    // ZaloPay callback sends { data, mac, type }
    // - data is a JSON string containing the payment details
    // - mac is HMAC-SHA256 of the data string using key2
    const callbackData = params.data;
    const callbackMac = params.mac;

    // Verify signature using key2
    const expectedMac = crypto
      .createHmac('sha256', this.key2)
      .update(callbackData)
      .digest('hex');

    const isValid = expectedMac === callbackMac;

    // Parse the data string to extract payment details
    let parsedData: Record<string, any>;
    try {
      parsedData = JSON.parse(callbackData);
    } catch {
      this.logger.error('ZaloPay callback: failed to parse data JSON');
      return {
        isValid: false,
        transactionId: '',
        amount: 0,
        status: 'FAILED',
      };
    }

    // ZaloPay callback type: 1 = success, 2 = failed
    const status = params.type === 1 ? 'SUCCESS' : 'FAILED';

    this.logger.log(
      `ZaloPay callback verified: appTransId=${parsedData.app_trans_id}, ` +
        `valid=${isValid}, type=${params.type}, status=${status}`,
    );

    return {
      isValid,
      transactionId: parsedData.app_trans_id,
      amount: parsedData.amount,
      status,
    };
  }

  /**
   * Format date to ZaloPay's app_trans_id prefix: yymmdd
   */
  private formatDatePrefix(date: Date): string {
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
  }
}
