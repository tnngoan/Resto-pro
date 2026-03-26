import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, EWalletMethod } from './dto/create-payment.dto';

/**
 * Payment gateway controller.
 *
 * Two types of endpoints:
 *   1. POST /payments/create — authenticated, staff initiates payment
 *   2. Callback endpoints — NO auth (payment providers call these directly)
 *
 * Callback security is handled via HMAC signature verification
 * inside each provider, not via JWT auth.
 */
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger('PaymentsController');

  constructor(private paymentsService: PaymentsService) {}

  // ─────────────────────────────────────────────────────────
  //  AUTHENTICATED: Staff creates a payment request
  // ─────────────────────────────────────────────────────────

  /**
   * POST /payments/create
   *
   * Body: { orderId, method: 'VNPAY'|'MOMO'|'ZALOPAY', returnUrl? }
   * Returns: { paymentUrl, qrCodeUrl?, transactionId, method, amount }
   *
   * The frontend should redirect the customer to paymentUrl or
   * display the qrCodeUrl as a QR code for scanning.
   */
  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'STAFF')
  async createPayment(@Body() dto: CreatePaymentDto, @Req() req: Request) {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    return this.paymentsService.createPayment(dto, ipAddress);
  }

  // ─────────────────────────────────────────────────────────
  //  UNAUTHENTICATED CALLBACKS — payment providers call these
  // ─────────────────────────────────────────────────────────

  /**
   * GET /payments/callback/vnpay
   *
   * VNPay redirects the customer's browser here with query params
   * containing the payment result + HMAC-SHA512 signature.
   *
   * After processing, we redirect the customer to the frontend
   * payment result page.
   */
  @Get('callback/vnpay')
  async vnpayCallback(@Query() params: Record<string, string>, @Res() res: Response) {
    this.logger.log(`VNPay callback received: txnRef=${params['vnp_TxnRef']}`);

    const result = await this.paymentsService.handleCallback(EWalletMethod.VNPAY, params);

    // VNPay expects a redirect back to the frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const status = result.success ? 'success' : 'failed';
    const redirectUrl = `${frontendUrl}/payment/result?status=${status}&method=vnpay&txnRef=${params['vnp_TxnRef'] || ''}`;

    return res.redirect(redirectUrl);
  }

  /**
   * POST /payments/callback/momo
   *
   * MoMo sends an IPN (Instant Payment Notification) as a POST
   * with JSON body containing payment details + HMAC-SHA256 signature.
   *
   * MoMo expects a 204 No Content on success.
   */
  @Post('callback/momo')
  @HttpCode(HttpStatus.NO_CONTENT)
  async momoCallback(@Body() params: Record<string, any>) {
    this.logger.log(`MoMo callback received: orderId=${params.orderId}`);

    const result = await this.paymentsService.handleCallback(EWalletMethod.MOMO, params);

    if (!result.success) {
      this.logger.warn(`MoMo callback processing failed: ${result.message}`);
    }

    // MoMo expects 204 regardless — they'll retry on non-2xx
  }

  /**
   * POST /payments/callback/zalopay
   *
   * ZaloPay sends a POST with { data, mac, type } where data is a
   * JSON string and mac is the HMAC-SHA256 signature using key2.
   *
   * ZaloPay expects a JSON response: { return_code: 1, return_message: 'success' }
   */
  @Post('callback/zalopay')
  async zalopayCallback(@Body() params: Record<string, any>) {
    this.logger.log('ZaloPay callback received');

    const result = await this.paymentsService.handleCallback(EWalletMethod.ZALOPAY, params);

    // ZaloPay expects a specific JSON response format
    if (result.success) {
      return { return_code: 1, return_message: 'success' };
    }

    return { return_code: 2, return_message: result.message };
  }
}
