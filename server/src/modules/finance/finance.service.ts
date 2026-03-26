import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateExpenseDto } from './dto/expense.dto';

// Vietnam is UTC+7
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Converts a date string (YYYY-MM-DD) to the UTC range representing that
 * calendar day in Vietnam timezone (UTC+7).
 *
 * Example: "2026-04-15" in Vietnam (UTC+7)
 *   → starts at 2026-04-14T17:00:00.000Z
 *   → ends   at 2026-04-15T16:59:59.999Z
 */
function vnDayRange(dateStr: string): { start: Date; end: Date } {
  const localMidnight = new Date(dateStr + 'T00:00:00+07:00');
  const start = new Date(localMidnight.getTime());
  const end = new Date(localMidnight.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { start, end };
}

/**
 * Converts a date string to start-of-day in Vietnam timezone as UTC.
 */
function vnStartOfDay(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00+07:00');
}

/**
 * Converts a date string to end-of-day in Vietnam timezone as UTC.
 */
function vnEndOfDay(dateStr: string): Date {
  return new Date(dateStr + 'T23:59:59.999+07:00');
}

/** Revenue-eligible order statuses */
const REVENUE_STATUSES = ['PAID', 'COMPLETED'] as const;

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // getDailySummary
  // ─────────────────────────────────────────────────────────────────────────
  async getDailySummary(restaurantId: string, date: string) {
    const { start, end } = vnDayRange(date);

    // Fetch all paid/completed orders for that day
    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        status: { in: [...REVENUE_STATUSES] },
        paidAt: { gte: start, lte: end },
      },
      include: {
        orderItems: {
          where: { status: { not: 'CANCELLED' } },
          include: {
            menuItem: { select: { id: true, name: true, categoryId: true } },
          },
        },
      },
    });

    const totalRevenue = orders.reduce((sum: number, o: any) => sum + o.total, 0);
    const totalOrders = orders.length;
    const totalCovers = orders.reduce((sum: number, o: any) => sum + (o.covers || 1), 0);
    const averageOrderValue =
      totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Payment breakdown
    const paymentBreakdown: Record<string, number> = {
      CASH: 0,
      VNPAY: 0,
      MOMO: 0,
      ZALOPAY: 0,
      CARD: 0,
      BANK_TRANSFER: 0,
    };
    for (const order of orders) {
      if (order.paymentMethod) {
        paymentBreakdown[order.paymentMethod] =
          (paymentBreakdown[order.paymentMethod] || 0) + order.total;
      }
    }

    // Top items — aggregate across all order items
    const itemMap = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >();
    for (const order of orders) {
      for (const item of order.orderItems) {
        const existing = itemMap.get(item.menuItemId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.totalPrice;
        } else {
          itemMap.set(item.menuItemId, {
            name: item.name,
            quantity: item.quantity,
            revenue: item.totalPrice,
          });
        }
      }
    }
    const topItems = Array.from(itemMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Hourly revenue (Vietnam timezone, 0-23)
    const hourlyRevenue: Array<{ hour: number; revenue: number }> =
      Array.from({ length: 24 }, (_, i) => ({ hour: i, revenue: 0 }));
    for (const order of orders) {
      if (order.paidAt) {
        // Convert UTC paidAt to Vietnam hour
        const vnHour = new Date(
          order.paidAt.getTime() + VN_OFFSET_MS,
        ).getUTCHours();
        hourlyRevenue[vnHour].revenue += order.total;
      }
    }

    // Compare to yesterday
    const yesterdayStr = new Date(
      new Date(date + 'T00:00:00+07:00').getTime() - 24 * 60 * 60 * 1000,
    )
      .toISOString()
      .slice(0, 10);
    const { start: yStart, end: yEnd } = vnDayRange(yesterdayStr);

    const yesterdayAgg = await this.prisma.order.aggregate({
      where: {
        restaurantId,
        status: { in: [...REVENUE_STATUSES] },
        paidAt: { gte: yStart, lte: yEnd },
      },
      _sum: { total: true },
      _count: true,
    });

    const yesterdayRevenue = yesterdayAgg._sum.total || 0;
    const yesterdayOrders = yesterdayAgg._count || 0;

    const revenueChange =
      yesterdayRevenue > 0
        ? Math.round(
            ((totalRevenue - yesterdayRevenue) / yesterdayRevenue) * 10000,
          ) / 100
        : totalRevenue > 0
          ? 100
          : 0;
    const ordersChange =
      yesterdayOrders > 0
        ? Math.round(
            ((totalOrders - yesterdayOrders) / yesterdayOrders) * 10000,
          ) / 100
        : totalOrders > 0
          ? 100
          : 0;

    return {
      date,
      totalRevenue,
      totalOrders,
      totalCovers,
      averageOrderValue,
      paymentBreakdown,
      topItems,
      hourlyRevenue,
      comparedToYesterday: {
        revenueChange,
        ordersChange,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // getRevenueTrends
  // ─────────────────────────────────────────────────────────────────────────
  async getRevenueTrends(
    restaurantId: string,
    startDate: string,
    endDate: string,
    granularity: 'day' | 'week' | 'month' = 'day',
  ) {
    // Validate range limits
    const startMs = vnStartOfDay(startDate).getTime();
    const endMs = vnEndOfDay(endDate).getTime();
    const daysDiff = Math.ceil((endMs - startMs) / (24 * 60 * 60 * 1000));

    if (granularity === 'day' && daysDiff > 90) {
      throw new BadRequestException(
        'Day granularity limited to 90-day range. Use week or month for larger ranges.',
      );
    }
    if (
      (granularity === 'week' || granularity === 'month') &&
      daysDiff > 366
    ) {
      throw new BadRequestException(
        'Week/month granularity limited to 1-year range.',
      );
    }

    // Try DailyRevenue cache first
    const cached = await this.prisma.dailyRevenue.findMany({
      where: {
        restaurantId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { date: 'asc' },
    });

    let dataPoints: Array<{
      date: string;
      revenue: number;
      orders: number;
      covers: number;
    }>;

    if (cached.length > 0) {
      // Use cache
      dataPoints = cached.map((d: any) => ({
        date: d.date.toISOString().slice(0, 10),
        revenue: d.totalRevenue,
        orders: d.totalOrders,
        covers: d.totalCovers,
      }));
    } else {
      // Fallback: aggregate from orders
      const orders = await this.prisma.order.findMany({
        where: {
          restaurantId,
          status: { in: [...REVENUE_STATUSES] },
          paidAt: {
            gte: vnStartOfDay(startDate),
            lte: vnEndOfDay(endDate),
          },
        },
        select: {
          total: true,
          covers: true,
          paidAt: true,
        },
      });

      // Group by Vietnam date
      const dayMap = new Map<
        string,
        { revenue: number; orders: number; covers: number }
      >();
      for (const order of orders) {
        if (!order.paidAt) continue;
        const vnDate = new Date(order.paidAt.getTime() + VN_OFFSET_MS)
          .toISOString()
          .slice(0, 10);
        const existing = dayMap.get(vnDate) || {
          revenue: 0,
          orders: 0,
          covers: 0,
        };
        existing.revenue += order.total;
        existing.orders += 1;
        existing.covers += order.covers || 1;
        dayMap.set(vnDate, existing);
      }

      dataPoints = Array.from(dayMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    // Apply granularity grouping
    if (granularity === 'day') {
      return dataPoints;
    }

    const grouped = new Map<
      string,
      { revenue: number; orders: number; covers: number }
    >();
    for (const point of dataPoints) {
      let key: string;
      const d = new Date(point.date);
      if (granularity === 'week') {
        // ISO week: Monday-based; use the Monday of the week
        const dayOfWeek = d.getUTCDay(); // 0=Sun
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(d);
        monday.setUTCDate(d.getUTCDate() + diff);
        key = monday.toISOString().slice(0, 10);
      } else {
        // month
        key = point.date.slice(0, 7); // YYYY-MM
      }

      const existing = grouped.get(key) || {
        revenue: 0,
        orders: 0,
        covers: 0,
      };
      existing.revenue += point.revenue;
      existing.orders += point.orders;
      existing.covers += point.covers;
      grouped.set(key, existing);
    }

    return Array.from(grouped.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // getPaymentBreakdown
  // ─────────────────────────────────────────────────────────────────────────
  async getPaymentBreakdown(
    restaurantId: string,
    startDate: string,
    endDate: string,
  ) {
    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        status: { in: [...REVENUE_STATUSES] },
        paidAt: {
          gte: vnStartOfDay(startDate),
          lte: vnEndOfDay(endDate),
        },
      },
      select: {
        total: true,
        paymentMethod: true,
      },
    });

    const methodMap = new Map<
      string,
      { total: number; count: number }
    >();
    let grandTotal = 0;

    for (const order of orders) {
      const method = order.paymentMethod || 'CASH';
      const existing = methodMap.get(method) || { total: 0, count: 0 };
      existing.total += order.total;
      existing.count += 1;
      methodMap.set(method, existing);
      grandTotal += order.total;
    }

    return Array.from(methodMap.entries())
      .map(([method, data]) => ({
        method,
        total: data.total,
        count: data.count,
        percentage:
          grandTotal > 0
            ? Math.round((data.total / grandTotal) * 10000) / 100
            : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // getTopItems
  // ─────────────────────────────────────────────────────────────────────────
  async getTopItems(
    restaurantId: string,
    startDate: string,
    endDate: string,
    limit: number = 10,
  ) {
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        status: { not: 'CANCELLED' },
        order: {
          restaurantId,
          status: { in: [...REVENUE_STATUSES] },
          paidAt: {
            gte: vnStartOfDay(startDate),
            lte: vnEndOfDay(endDate),
          },
        },
      },
      include: {
        menuItem: {
          select: {
            id: true,
            name: true,
            category: { select: { name: true } },
          },
        },
      },
    });

    const itemMap = new Map<
      string,
      {
        menuItemId: string;
        name: string;
        category: string;
        quantity: number;
        revenue: number;
      }
    >();

    for (const oi of orderItems) {
      const existing = itemMap.get(oi.menuItemId);
      if (existing) {
        existing.quantity += oi.quantity;
        existing.revenue += oi.totalPrice;
      } else {
        itemMap.set(oi.menuItemId, {
          menuItemId: oi.menuItemId,
          name: oi.menuItem.name,
          category: oi.menuItem.category?.name || 'Uncategorized',
          quantity: oi.quantity,
          revenue: oi.totalPrice,
        });
      }
    }

    return Array.from(itemMap.values())
      .map((item) => ({
        ...item,
        avgPrice:
          item.quantity > 0 ? Math.round(item.revenue / item.quantity) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // recordExpense
  // ─────────────────────────────────────────────────────────────────────────
  async recordExpense(
    restaurantId: string,
    data: CreateExpenseDto,
    userId?: string,
  ) {
    const expense = await this.prisma.expense.create({
      data: {
        restaurantId,
        description: data.description,
        amount: data.amount,
        category: data.category as any,
        date: new Date(data.date),
        paymentMethod: data.paymentMethod as any,
        notes: data.notes,
        createdBy: userId,
      },
    });

    return expense;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // getExpenseSummary
  // ─────────────────────────────────────────────────────────────────────────
  async getExpenseSummary(
    restaurantId: string,
    startDate: string,
    endDate: string,
  ) {
    const expenses = await this.prisma.expense.findMany({
      where: {
        restaurantId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { date: 'desc' },
    });

    // Group by category
    const categoryMap = new Map<
      string,
      { total: number; count: number; items: any[] }
    >();

    for (const expense of expenses) {
      const cat = expense.category;
      const existing = categoryMap.get(cat) || {
        total: 0,
        count: 0,
        items: [],
      };
      existing.total += expense.amount;
      existing.count += 1;
      existing.items.push({
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        date: expense.date.toISOString().slice(0, 10),
        paymentMethod: expense.paymentMethod,
        notes: expense.notes,
      });
      categoryMap.set(cat, existing);
    }

    const totalExpenses = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);

    return {
      totalExpenses,
      categories: Array.from(categoryMap.entries())
        .map(([category, data]) => ({
          category,
          total: data.total,
          count: data.count,
          percentage:
            totalExpenses > 0
              ? Math.round((data.total / totalExpenses) * 10000) / 100
              : 0,
          items: data.items,
        }))
        .sort((a, b) => b.total - a.total),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // getTrialBalance (Phase 1 — simplified, no double-entry)
  // ─────────────────────────────────────────────────────────────────────────
  async getTrialBalance(
    restaurantId: string,
    startDate?: string,
    endDate?: string,
  ) {
    // Default to current month if no range provided
    const now = new Date();
    const effectiveStart =
      startDate ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const effectiveEnd = endDate || now.toISOString().slice(0, 10);

    // Total revenue from paid orders
    const revenueAgg = await this.prisma.order.aggregate({
      where: {
        restaurantId,
        status: { in: [...REVENUE_STATUSES] },
        paidAt: {
          gte: vnStartOfDay(effectiveStart),
          lte: vnEndOfDay(effectiveEnd),
        },
      },
      _sum: { total: true, vatAmount: true },
    });

    const totalRevenue = revenueAgg._sum.total || 0;
    const totalVat = revenueAgg._sum.vatAmount || 0;

    // COGS estimate: sum of stock movements OUT for the period
    const cogsAgg = await this.prisma.stockMovement.aggregate({
      where: {
        restaurantId,
        type: 'OUT',
        createdAt: {
          gte: vnStartOfDay(effectiveStart),
          lte: vnEndOfDay(effectiveEnd),
        },
      },
      _sum: { totalCost: true },
    });

    const totalCOGS = cogsAgg._sum.totalCost || 0;

    // Total expenses
    const expenseAgg = await this.prisma.expense.aggregate({
      where: {
        restaurantId,
        date: {
          gte: new Date(effectiveStart),
          lte: new Date(effectiveEnd),
        },
      },
      _sum: { amount: true },
    });

    const totalExpenses = expenseAgg._sum.amount || 0;

    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalExpenses;
    const grossMargin =
      totalRevenue > 0
        ? Math.round((grossProfit / totalRevenue) * 10000) / 100
        : 0;
    const netMargin =
      totalRevenue > 0
        ? Math.round((netProfit / totalRevenue) * 10000) / 100
        : 0;

    return {
      period: { startDate: effectiveStart, endDate: effectiveEnd },
      totalRevenue,
      totalVat,
      totalCOGS,
      totalExpenses,
      grossProfit,
      netProfit,
      grossMargin,
      netMargin,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // closePeriod (Phase 1 — snapshot daily revenue cache)
  // ─────────────────────────────────────────────────────────────────────────
  async closePeriod(restaurantId: string, periodEnd: string) {
    // Ensure all days in the period have DailyRevenue records
    // by rebuilding cache from orders for any missing days
    const endDate = new Date(periodEnd);
    const startDate = new Date(endDate);
    startDate.setDate(1); // First of the month

    const currentDate = new Date(startDate);
    const results: string[] = [];

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().slice(0, 10);
      const { start, end } = vnDayRange(dateStr);

      // Check if cached record exists
      const existing = await this.prisma.dailyRevenue.findFirst({
        where: {
          restaurantId,
          date: new Date(dateStr),
        },
      });

      if (!existing) {
        // Build from orders
        const dayOrders = await this.prisma.order.findMany({
          where: {
            restaurantId,
            status: { in: [...REVENUE_STATUSES] },
            paidAt: { gte: start, lte: end },
          },
          select: {
            total: true,
            covers: true,
            paymentMethod: true,
            vatAmount: true,
            discountAmount: true,
          },
        });

        if (dayOrders.length > 0) {
          const totalRevenue = dayOrders.reduce((s: number, o: any) => s + o.total, 0);
          const totalOrders = dayOrders.length;
          const totalCovers = dayOrders.reduce(
            (s: number, o: any) => s + (o.covers || 1),
            0,
          );

          const paymentTotals: Record<string, number> = {};
          for (const o of dayOrders) {
            const m = o.paymentMethod || 'CASH';
            paymentTotals[m] = (paymentTotals[m] || 0) + o.total;
          }

          await this.prisma.dailyRevenue.create({
            data: {
              restaurantId,
              date: new Date(dateStr),
              totalRevenue,
              totalOrders,
              totalCovers,
              avgTicket: Math.round(totalRevenue / totalOrders),
              cashRevenue: paymentTotals['CASH'] || 0,
              vnpayRevenue: paymentTotals['VNPAY'] || 0,
              momoRevenue: paymentTotals['MOMO'] || 0,
              zalopayRevenue: paymentTotals['ZALOPAY'] || 0,
              cardRevenue: paymentTotals['CARD'] || 0,
              bankTransferRevenue: paymentTotals['BANK_TRANSFER'] || 0,
              totalVat: dayOrders.reduce((s: number, o: any) => s + o.vatAmount, 0),
              totalDiscounts: dayOrders.reduce(
                (s: number, o: any) => s + o.discountAmount,
                0,
              ),
            },
          });
          results.push(`${dateStr}: created (${totalOrders} orders)`);
        }
      } else {
        results.push(`${dateStr}: already cached`);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      message: `Period closed through ${periodEnd}`,
      periodStart: startDate.toISOString().slice(0, 10),
      periodEnd,
      daysProcessed: results.length,
      details: results,
    };
  }
}
