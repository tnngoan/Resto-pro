import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { FinanceService } from '@/modules/finance/finance.service';

// Vietnam is UTC+7
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

function vnStartOfDay(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00+07:00');
}

function vnEndOfDay(dateStr: string): Date {
  return new Date(dateStr + 'T23:59:59.999+07:00');
}

const REVENUE_STATUSES = ['PAID', 'COMPLETED'] as const;

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private financeService: FinanceService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // getDailyReport — combines finance data into a comprehensive daily report
  // ─────────────────────────────────────────────────────────────────────────
  async generateDailyReport(restaurantId: string, date: string) {
    // Re-use getDailySummary for core revenue data
    const summary = await this.financeService.getDailySummary(
      restaurantId,
      date,
    );

    // Get expense data for same day
    const expenses = await this.financeService.getExpenseSummary(
      restaurantId,
      date,
      date,
    );

    // Get VAT from orders
    const vatAgg = await this.prisma.order.aggregate({
      where: {
        restaurantId,
        status: { in: [...REVENUE_STATUSES] },
        paidAt: {
          gte: vnStartOfDay(date),
          lte: vnEndOfDay(date),
        },
      },
      _sum: { vatAmount: true, discountAmount: true },
    });

    return {
      ...summary,
      vatCollected: vatAgg._sum.vatAmount || 0,
      totalDiscounts: vatAgg._sum.discountAmount || 0,
      expenses: expenses,
      netRevenue: summary.totalRevenue - (expenses.totalExpenses || 0),
      generatedAt: new Date().toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // generateProfitAndLoss — Phase 1 simplified P&L
  // Revenue - COGS (estimated) - Expenses = Net Profit
  // ─────────────────────────────────────────────────────────────────────────
  async generateProfitAndLoss(
    restaurantId: string,
    startDate: string,
    endDate: string,
  ) {
    // Revenue breakdown by menu category
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
            category: { select: { name: true } },
          },
        },
      },
    });

    // Revenue by category
    const revenueByCategory = new Map<string, number>();
    let totalRevenue = 0;
    for (const oi of orderItems) {
      const cat = oi.menuItem.category?.name || 'Uncategorized';
      revenueByCategory.set(
        cat,
        (revenueByCategory.get(cat) || 0) + oi.totalPrice,
      );
      totalRevenue += oi.totalPrice;
    }

    // COGS — actual stock movements OUT
    const stockMovements = await this.prisma.stockMovement.findMany({
      where: {
        restaurantId,
        type: 'OUT',
        createdAt: {
          gte: vnStartOfDay(startDate),
          lte: vnEndOfDay(endDate),
        },
      },
      include: {
        ingredient: { select: { name: true } },
      },
    });

    const cogsByIngredient = new Map<string, number>();
    let totalCOGS = 0;
    for (const sm of stockMovements) {
      const name = sm.ingredient.name;
      cogsByIngredient.set(
        name,
        (cogsByIngredient.get(name) || 0) + sm.totalCost,
      );
      totalCOGS += sm.totalCost;
    }

    // Expenses by category
    const expenseData = await this.financeService.getExpenseSummary(
      restaurantId,
      startDate,
      endDate,
    );

    const totalExpenses = expenseData.totalExpenses || 0;
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
      period: { startDate, endDate },
      revenue: {
        total: totalRevenue,
        breakdown: Array.from(revenueByCategory.entries())
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount),
      },
      cogs: {
        total: totalCOGS,
        breakdown: Array.from(cogsByIngredient.entries())
          .map(([ingredient, amount]) => ({ ingredient, amount }))
          .sort((a, b) => b.amount - a.amount),
      },
      expenses: {
        total: totalExpenses,
        breakdown: expenseData.categories || [],
      },
      grossProfit,
      netProfit,
      grossMargin,
      netMargin,
      generatedAt: new Date().toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // generateCashFlow — Phase 1: operating cash flow from orders & expenses
  // ─────────────────────────────────────────────────────────────────────────
  async generateCashFlow(
    restaurantId: string,
    startDate: string,
    endDate: string,
  ) {
    // Cash inflows by payment method
    const paymentBreakdown = await this.financeService.getPaymentBreakdown(
      restaurantId,
      startDate,
      endDate,
    );

    const totalInflows = paymentBreakdown.reduce(
      (sum: number, p: any) => sum + p.total,
      0,
    );

    // Cash outflows: expenses
    const expenseData = await this.financeService.getExpenseSummary(
      restaurantId,
      startDate,
      endDate,
    );

    const totalOutflows = expenseData.totalExpenses || 0;

    return {
      period: { startDate, endDate },
      operating: {
        inflows: {
          total: totalInflows,
          breakdown: paymentBreakdown,
        },
        outflows: {
          total: totalOutflows,
          breakdown: expenseData.categories || [],
        },
        netCashFlow: totalInflows - totalOutflows,
      },
      // Investing and Financing sections — Phase 2
      investing: { total: 0, note: 'Available in Phase 2' },
      financing: { total: 0, note: 'Available in Phase 2' },
      netCashFlow: totalInflows - totalOutflows,
      generatedAt: new Date().toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // generateFoodCostReport — actual vs theoretical food cost
  // ─────────────────────────────────────────────────────────────────────────
  async generateFoodCostReport(
    restaurantId: string,
    startDate: string,
    endDate: string,
  ) {
    // Actual food cost = sum of stock movements OUT for the period
    const stockOutMovements = await this.prisma.stockMovement.findMany({
      where: {
        restaurantId,
        type: { in: ['OUT', 'WASTE'] },
        createdAt: {
          gte: vnStartOfDay(startDate),
          lte: vnEndOfDay(endDate),
        },
      },
      include: {
        ingredient: { select: { id: true, name: true, unit: true } },
      },
    });

    let actualFoodCost = 0;
    let wastedCost = 0;
    const actualByIngredient = new Map<
      string,
      { name: string; cost: number; quantity: number; unit: string }
    >();

    for (const sm of stockOutMovements) {
      if (sm.type === 'WASTE') {
        wastedCost += sm.totalCost;
      }
      actualFoodCost += sm.totalCost;

      const existing = actualByIngredient.get(sm.ingredientId);
      if (existing) {
        existing.cost += sm.totalCost;
        existing.quantity += sm.quantity;
      } else {
        actualByIngredient.set(sm.ingredientId, {
          name: sm.ingredient.name,
          cost: sm.totalCost,
          quantity: sm.quantity,
          unit: sm.ingredient.unit,
        });
      }
    }

    // Theoretical food cost = sum of (recipe cost × quantity sold)
    // Get all sold items with their recipes
    const soldItems = await this.prisma.orderItem.findMany({
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
      select: {
        menuItemId: true,
        name: true,
        quantity: true,
        totalPrice: true,
      },
    });

    // Aggregate quantities per menu item
    const soldQuantities = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >();
    let totalRevenue = 0;
    for (const item of soldItems) {
      const existing = soldQuantities.get(item.menuItemId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.totalPrice;
      } else {
        soldQuantities.set(item.menuItemId, {
          name: item.name,
          quantity: item.quantity,
          revenue: item.totalPrice,
        });
      }
      totalRevenue += item.totalPrice;
    }

    // Get recipes for all sold items
    const menuItemIds = Array.from(soldQuantities.keys());
    const recipes = await this.prisma.recipe.findMany({
      where: { menuItemId: { in: menuItemIds } },
      include: {
        ingredient: {
          select: { id: true, name: true, costPerUnit: true, unit: true },
        },
      },
    });

    // Calculate theoretical cost per menu item
    const recipeCostMap = new Map<string, number>();
    for (const recipe of recipes) {
      const costForItem = recipe.quantity * recipe.ingredient.costPerUnit;
      recipeCostMap.set(
        recipe.menuItemId,
        (recipeCostMap.get(recipe.menuItemId) || 0) + costForItem,
      );
    }

    let theoreticalFoodCost = 0;
    const itemCostAnalysis: Array<{
      name: string;
      quantitySold: number;
      revenue: number;
      theoreticalCost: number;
      foodCostPct: number;
    }> = [];

    for (const [menuItemId, sold] of soldQuantities) {
      const recipeCostPerUnit = recipeCostMap.get(menuItemId) || 0;
      const itemTheoreticalCost = recipeCostPerUnit * sold.quantity;
      theoreticalFoodCost += itemTheoreticalCost;

      itemCostAnalysis.push({
        name: sold.name,
        quantitySold: sold.quantity,
        revenue: sold.revenue,
        theoreticalCost: Math.round(itemTheoreticalCost),
        foodCostPct:
          sold.revenue > 0
            ? Math.round((itemTheoreticalCost / sold.revenue) * 10000) / 100
            : 0,
      });
    }

    theoreticalFoodCost = Math.round(theoreticalFoodCost);
    const variance = actualFoodCost - theoreticalFoodCost;
    const variancePercentage =
      theoreticalFoodCost > 0
        ? Math.round((variance / theoreticalFoodCost) * 10000) / 100
        : 0;

    const actualFoodCostPct =
      totalRevenue > 0
        ? Math.round((actualFoodCost / totalRevenue) * 10000) / 100
        : 0;
    const theoreticalFoodCostPct =
      totalRevenue > 0
        ? Math.round((theoreticalFoodCost / totalRevenue) * 10000) / 100
        : 0;

    return {
      period: { startDate, endDate },
      totalRevenue,
      actualFoodCost,
      theoreticalFoodCost,
      variance,
      variancePercentage,
      wastedCost,
      actualFoodCostPct,
      theoreticalFoodCostPct,
      itemAnalysis: itemCostAnalysis.sort(
        (a, b) => b.foodCostPct - a.foodCostPct,
      ),
      ingredientUsage: Array.from(actualByIngredient.values()).sort(
        (a, b) => b.cost - a.cost,
      ),
      insights:
        variance > 0
          ? `Variance of ${variance.toLocaleString()} VND (${variancePercentage}%) — investigate possible waste, theft, or unrecorded usage.`
          : `Food cost is at or below theoretical. Operations are efficient.`,
      generatedAt: new Date().toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // generateMenuEngineering — Star/Dog/Puzzle/Horse matrix
  // ─────────────────────────────────────────────────────────────────────────
  async generateMenuEngineering(restaurantId: string) {
    // Use last 30 days of data
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const topItems = await this.financeService.getTopItems(
      restaurantId,
      startDate,
      endDate,
      100, // Get all items
    );

    if (topItems.length === 0) {
      return {
        period: { startDate, endDate },
        items: [],
        message: 'No sales data for the last 30 days',
      };
    }

    // Get recipe costs for profitability
    const menuItemIds = topItems.map((i: any) => i.menuItemId);
    const recipes = await this.prisma.recipe.findMany({
      where: { menuItemId: { in: menuItemIds } },
      include: {
        ingredient: { select: { costPerUnit: true } },
      },
    });

    const recipeCostMap = new Map<string, number>();
    for (const recipe of recipes) {
      recipeCostMap.set(
        recipe.menuItemId,
        (recipeCostMap.get(recipe.menuItemId) || 0) +
          recipe.quantity * recipe.ingredient.costPerUnit,
      );
    }

    // Calculate averages for classification
    const avgQuantity =
      topItems.reduce((s: number, i: any) => s + i.quantity, 0) /
      topItems.length;
    const itemsWithProfit = topItems.map((item: any) => {
      const recipeCost = recipeCostMap.get(item.menuItemId) || 0;
      const profitPerUnit = item.avgPrice - Math.round(recipeCost);
      return {
        ...item,
        recipeCost: Math.round(recipeCost),
        profitPerUnit,
        totalProfit: profitPerUnit * item.quantity,
      };
    });

    const avgProfit =
      itemsWithProfit.reduce((s: number, i: any) => s + i.profitPerUnit, 0) /
      itemsWithProfit.length;

    // Classify: Star (high pop, high profit), Puzzle (low pop, high profit),
    // Horse (high pop, low profit), Dog (low pop, low profit)
    const classified = itemsWithProfit.map((item: any) => {
      const highPopularity = item.quantity >= avgQuantity;
      const highProfitability = item.profitPerUnit >= avgProfit;

      let classification: string;
      if (highPopularity && highProfitability) classification = 'STAR';
      else if (!highPopularity && highProfitability) classification = 'PUZZLE';
      else if (highPopularity && !highProfitability) classification = 'HORSE';
      else classification = 'DOG';

      return { ...item, classification };
    });

    return {
      period: { startDate, endDate },
      thresholds: {
        avgQuantity: Math.round(avgQuantity),
        avgProfitPerUnit: Math.round(avgProfit),
      },
      items: classified.sort((a: any, b: any) => {
        const order = { STAR: 0, PUZZLE: 1, HORSE: 2, DOG: 3 };
        return (
          (order[a.classification as keyof typeof order] || 4) -
          (order[b.classification as keyof typeof order] || 4)
        );
      }),
      summary: {
        stars: classified.filter((i: any) => i.classification === 'STAR')
          .length,
        puzzles: classified.filter((i: any) => i.classification === 'PUZZLE')
          .length,
        horses: classified.filter((i: any) => i.classification === 'HORSE')
          .length,
        dogs: classified.filter((i: any) => i.classification === 'DOG').length,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // generateInventoryReport — current stock with valuation
  // ─────────────────────────────────────────────────────────────────────────
  async generateInventoryReport(restaurantId: string) {
    const ingredients = await this.prisma.ingredient.findMany({
      where: { restaurantId, isActive: true },
      orderBy: { name: 'asc' },
    });

    let totalValue = 0;
    const items = ingredients.map((ing: any) => {
      const value = Math.round(ing.currentStock * ing.costPerUnit);
      totalValue += value;

      return {
        id: ing.id,
        name: ing.name,
        unit: ing.unit,
        currentStock: ing.currentStock,
        minStock: ing.minStock,
        costPerUnit: ing.costPerUnit,
        totalValue: value,
        isLow: ing.currentStock <= ing.minStock,
        supplierName: ing.supplierName,
      };
    });

    const lowStockItems = items.filter((i: any) => i.isLow);

    return {
      totalItems: items.length,
      totalValue,
      lowStockCount: lowStockItems.length,
      items,
      lowStockAlerts: lowStockItems,
      generatedAt: new Date().toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // generateAccountingReport — delegates to appropriate report type
  // ─────────────────────────────────────────────────────────────────────────
  async generateAccountingReport(
    restaurantId: string,
    reportType: string,
    startDate: string,
    endDate: string,
  ) {
    switch (reportType) {
      case 'trial-balance':
        return this.financeService.getTrialBalance(
          restaurantId,
          startDate,
          endDate,
        );
      case 'pl':
      case 'profit-and-loss':
        return this.generateProfitAndLoss(restaurantId, startDate, endDate);
      case 'food-cost':
        return this.generateFoodCostReport(restaurantId, startDate, endDate);
      default:
        throw new BadRequestException(
          `Unknown report type: ${reportType}. Available: trial-balance, pl, food-cost`,
        );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // generateCustomReport — Phase 2 (Claude API integration)
  // ─────────────────────────────────────────────────────────────────────────
  async generateCustomReport(restaurantId: string, query: string) {
    // Phase 2: will integrate Claude API for natural language report generation
    return {
      message:
        'Custom report generation with AI will be available in Phase 2.',
      query,
      suggestion:
        'For now, use the available report endpoints: profit-and-loss, food-cost, daily-summary, revenue-trends.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // exportReport — JSON and CSV formats (Phase 1)
  // ─────────────────────────────────────────────────────────────────────────
  async exportReport(
    reportData: any,
    format: 'json' | 'csv' | string,
  ): Promise<{ data: string; contentType: string; filename: string }> {
    const timestamp = new Date().toISOString().slice(0, 10);

    if (format === 'json') {
      return {
        data: JSON.stringify(reportData, null, 2),
        contentType: 'application/json',
        filename: `report-${timestamp}.json`,
      };
    }

    if (format === 'csv') {
      const csv = this.objectToCsv(reportData);
      return {
        data: csv,
        contentType: 'text/csv',
        filename: `report-${timestamp}.csv`,
      };
    }

    throw new BadRequestException(
      `Unsupported format: ${format}. Phase 1 supports: json, csv. PDF export coming in Phase 2.`,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CSV helper — flattens objects/arrays into CSV format
  // ─────────────────────────────────────────────────────────────────────────
  private objectToCsv(data: any): string {
    // If data is an array of objects, convert directly
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      const headers = Object.keys(data[0]);
      const rows = data.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            // Escape commas and quotes in string values
            if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
              return `"${val.replace(/"/g, '""')}"`;
            }
            return val ?? '';
          })
          .join(','),
      );
      return [headers.join(','), ...rows].join('\n');
    }

    // If data is an object with array properties, pick the first meaningful array
    if (typeof data === 'object' && data !== null) {
      // Look for array properties that could be tabular data
      for (const key of Object.keys(data)) {
        if (Array.isArray(data[key]) && data[key].length > 0) {
          const headerRow = `# ${key}`;
          const csvBody = this.objectToCsv(data[key]);
          return `${headerRow}\n${csvBody}`;
        }
      }

      // Flat object — convert to key-value pairs
      const rows = Object.entries(data)
        .filter(([, v]) => typeof v !== 'object')
        .map(([k, v]) => `${k},${v}`);
      return ['field,value', ...rows].join('\n');
    }

    return String(data);
  }
}
