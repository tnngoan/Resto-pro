import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod, OrderStatus } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { OrdersService } from '@/modules/orders/orders.service';
import { PaymentDto } from '@/modules/orders/dto/payment.dto';
import { VNPayProvider } from './providers/vnpay.provider';
import { MoMoProvider } from './providers/momo.provider';
import { ZaloPayProvider } from './providers/zalopay.provider';
import { IPaymentProvider, VerifyCallbackResult } from './interfaces/payment-provider.interface';
import { CreatePaymentDto, EWalletMethod } from './dto/create-payment.dto';

/**
 * Orchestrates payment creation and callback verification across
 * VNPay, MoMo, and ZaloPay gateways.
 *
 * Architecture:
 *   - createPayment() validates the order, picks the right provider,
 *     and returns a paymentUrl/QR for the customer to scan.
 *   - handleCallback() verifies the provider's signature, then delegates
 *     to OrdersService.processPayment() which handles marking PAID,
 *     releasing the table, updating DailyRevenue, etc.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger('PaymentsService');
  private readonly providers: Record<EWalletMethod, IPaymentProvider>;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private ordersService: OrdersService,
    private vnpayProvider: VNPayProvider,
    private momoProvider: MoMoProvider,
    private zalopayProvider: ZaloPayProvider,
  ) {
    // Map each e-wallet method to its provider instance
    this.providers = {
      [EWalletMethod.VNPAY]: this.vnpayProvider,
      [EWalletMethod.MOMO]: this.momoProvider,
      [EWalletMethod.ZALOPAY]: this.zalopayProvider,
    };
  }

  /**
   * Create a payment request for an e-wallet gateway.
   *
   * Steps:
   *   1. Validate the order exists and is in SERVED status
   *   2. Build a description string (e.g. "Bàn 03 - 3 món")
   *   3. Call the appropriate provider's createPayment()
   *   4. Return the paymentUrl + QR for the frontend to display
   */
  async createPayment(dto: CreatePaymentDto, ipAddress?: string) {
    const { orderId, method, returnUrl } = dto;

    // 1. Fetch order with table info for the description
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: { select: { number: true } },
        orderItems: { select: { id: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.SERVED) {
      throw new BadRequestException(
        'Order must be in SERVED status before initiating payment. ' +
          `Current status: ${order.status}`,
      );
    }

    // 2. Build a human-readable description for the payment screen
    const tableName = order.table ? `Bàn ${order.table.number}` : 'Mang về';
    const itemCount = order.orderItems.length;
    const description = `${tableName} - ${itemCount} món`;

    // 3. Determine the callback URL for the provider
    const baseUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const methodLower = method.toLowerCase();
    const callbackUrl =
      returnUrl ||
      this.configService.get<string>(
        `${method}_RETURN_URL`,
        `${baseUrl}/payment/${methodLower}/callback`,
      );

    // 4. Call the provider
    const provider = this.providers[method];
    if (!provider) {
      throw new BadRequestException(`Unsupported payment method: ${method}`);
    }

    try {
      const result = await provider.createPayment({
        orderId,
        amount: order.total, // VND integer
        description,
        returnUrl: callbackUrl,
        ipAddress,
      });

      this.logger.log(
        `Payment created: method=${method}, orderId=${orderId}, ` +
          `txnId=${result.transactionId}, amount=${order.total} VND`,
      );

      return {
        data: {
          paymentUrl: result.paymentUrl,
          qrCodeUrl: result.qrCodeUrl || null,
          transactionId: result.transactionId,
          method,
          amount: order.total,
        },
      };
    } catch (error: any) {
      this.logger.error(
        `Payment creation failed: method=${method}, orderId=${orderId}, ` +
          `error=${error.message}`,
      );
      throw new InternalServerErrorException(
        `Failed to create ${method} payment. Please try again.`,
      );
    }
  }

  /**
   * Handle a callback from a payment gateway.
   *
   * Steps:
   *   1. Verify the HMAC signature via the provider
   *   2. If valid + SUCCESS → call ordersService.processPayment()
   *   3. Return appropriate response (providers expect specific formats)
   *
   * IMPORTANT: Callback endpoints have NO auth guard — the payment
   * providers call these URLs directly. Security is via HMAC signature.
   */
  async handleCallback(
    method: EWalletMethod,
    params: Record<string, any>,
  ): Promise<{ success: boolean; message: string }> {
    const provider = this.providers[method];
    if (!provider) {
      this.logger.error(`Callback received for unsupported method: ${method}`);
      return { success: false, message: 'Unsupported payment method' };
    }

    let result: VerifyCallbackResult;
    try {
      result = await provider.verifyCallback(params);
    } catch (error: any) {
      this.logger.error(
        `Callback verification threw error: method=${method}, error=${error.message}`,
      );
      return { success: false, message: 'Verification error' };
    }

    // Invalid signature — possible tampering
    if (!result.isValid) {
      this.logger.warn(
        `Invalid callback signature: method=${method}, ` +
          `txnId=${result.transactionId}`,
      );
      return { success: false, message: 'Invalid signature' };
    }

    // Payment failed at the gateway
    if (result.status !== 'SUCCESS') {
      this.logger.warn(
        `Payment not successful: method=${method}, ` +
          `txnId=${result.transactionId}, status=${result.status}`,
      );
      return { success: false, message: `Payment status: ${result.status}` };
    }

    // Find the order by matching the transaction ID prefix (orderId first 8 chars)
    const orderId = await this.findOrderIdByTransaction(result.transactionId);
    if (!orderId) {
      this.logger.error(
        `Could not find order for transaction: txnId=${result.transactionId}`,
      );
      return { success: false, message: 'Order not found for transaction' };
    }

    // Map the e-wallet method to the Prisma PaymentMethod enum
    const paymentMethodMap: Record<EWalletMethod, PaymentMethod> = {
      [EWalletMethod.VNPAY]: PaymentMethod.VNPAY,
      [EWalletMethod.MOMO]: PaymentMethod.MOMO,
      [EWalletMethod.ZALOPAY]: PaymentMethod.ZALOPAY,
    };

    try {
      // Delegate to the existing processPayment() which handles:
      //   - marking order PAID
      //   - releasing the table
      //   - updating DailyRevenue
      const paymentDto: PaymentDto = {
        paymentMethod: paymentMethodMap[method],
      };
      await this.ordersService.processPayment(orderId, paymentDto);

      this.logger.log(
        `Payment completed: method=${method}, orderId=${orderId}, ` +
          `txnId=${result.transactionId}, amount=${result.amount} VND`,
      );

      return { success: true, message: 'Payment processed successfully' };
    } catch (error: any) {
      this.logger.error(
        `Failed to process payment for order: orderId=${orderId}, ` +
          `error=${error.message}`,
      );
      return { success: false, message: 'Failed to process payment' };
    }
  }

  /**
   * Find the original order UUID from the transaction ID.
   *
   * Transaction IDs are formatted as: {orderId first 8 chars}-{timestamp}
   * We search for orders whose ID starts with those 8 characters and
   * are in SERVED status (ready for payment).
   */
  private async findOrderIdByTransaction(transactionId: string): Promise<string | null> {
    // Extract the order ID prefix (first 8 chars of UUID)
    const orderIdPrefix = transactionId.split('-')[0];
    if (!orderIdPrefix || orderIdPrefix.length < 8) {
      return null;
    }

    // Find the order whose UUID starts with this prefix and is awaiting payment
    const order = await this.prisma.order.findFirst({
      where: {
        id: { startsWith: orderIdPrefix },
        status: OrderStatus.SERVED,
      },
      select: { id: true },
    });

    return order?.id || null;
  }
}
