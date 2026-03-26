import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { StockMovementType } from '@prisma/client';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { StockUpdateDto, StockUpdateType } from './dto/stock-update.dto';
import { WasteLogDto } from './dto/waste-log.dto';
import { StockCountDto } from './dto/stock-count.dto';
import { InventoryGateway } from './inventory.gateway';
import { KitchenGateway } from '../kitchen/kitchen.gateway';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger('InventoryService');

  constructor(
    private prisma: PrismaService,
    private inventoryGateway: InventoryGateway,
    private kitchenGateway: KitchenGateway,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────
  // INGREDIENTS — CRUD + listing
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * List all active ingredients for a restaurant.
   * Low-stock items appear first, then alphabetical.
   */
  async getIngredients(restaurantId: string) {
    const ingredients = await this.prisma.ingredient.findMany({
      where: { restaurantId, isActive: true },
      orderBy: [{ name: 'asc' }],
    });

    // Compute isLowStock flag and sort low-stock first
    const mapped = ingredients.map((ing) => ({
      id: ing.id,
      name: ing.name,
      unit: ing.unit,
      currentStock: ing.currentStock,
      minStock: ing.minStock,
      costPerUnit: ing.costPerUnit,
      supplierName: ing.supplierName,
      isLowStock: ing.currentStock <= ing.minStock,
      isActive: ing.isActive,
      updatedAt: ing.updatedAt,
    }));

    // Sort: low stock first, then name ASC
    mapped.sort((a, b) => {
      if (a.isLowStock && !b.isLowStock) return -1;
      if (!a.isLowStock && b.isLowStock) return 1;
      return a.name.localeCompare(b.name);
    });

    return mapped;
  }

  /**
   * Get a single ingredient with its last 30 stock movements.
   */
  async getIngredient(id: string) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 30,
          include: {
            createdByUser: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }

    return {
      ...ingredient,
      isLowStock: ingredient.currentStock <= ingredient.minStock,
    };
  }

  /**
   * Create a new ingredient with opening stock.
   * Also creates an initial IN stock movement for the opening stock.
   */
  async createIngredient(
    restaurantId: string,
    data: CreateIngredientDto,
    userId?: string,
  ) {
    const ingredient = await this.prisma.$transaction(async (tx) => {
      // 1. Create the ingredient
      const created = await tx.ingredient.create({
        data: {
          restaurantId,
          name: data.name,
          unit: data.unit,
          currentStock: data.currentStock,
          minStock: data.minStock,
          costPerUnit: data.costPerUnit,
          supplierName: data.supplierName,
        },
      });

      // 2. Create initial IN stock movement for opening stock (if any)
      if (data.currentStock > 0) {
        const totalCost = Math.round(data.currentStock * data.costPerUnit);
        await tx.stockMovement.create({
          data: {
            restaurantId,
            ingredientId: created.id,
            type: StockMovementType.IN,
            quantity: data.currentStock,
            unitCost: data.costPerUnit,
            totalCost,
            reason: 'Opening stock',
            createdBy: userId,
          },
        });
      }

      return created;
    });

    return {
      ...ingredient,
      isLowStock: ingredient.currentStock <= ingredient.minStock,
    };
  }

  /**
   * Update ingredient metadata.
   * Cannot change unit if there are existing stock movements (would invalidate history).
   */
  async updateIngredient(id: string, data: UpdateIngredientDto) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id },
    });

    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }

    // Prevent unit change if stock movements exist
    if (data.unit && data.unit !== ingredient.unit) {
      const movementCount = await this.prisma.stockMovement.count({
        where: { ingredientId: id },
      });

      if (movementCount > 0) {
        throw new BadRequestException(
          'Cannot change unit after stock movements have been recorded. ' +
            'Create a new ingredient with the desired unit instead.',
        );
      }
    }

    const updated = await this.prisma.ingredient.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.unit !== undefined && { unit: data.unit }),
        ...(data.minStock !== undefined && { minStock: data.minStock }),
        ...(data.costPerUnit !== undefined && { costPerUnit: data.costPerUnit }),
        ...(data.supplierName !== undefined && { supplierName: data.supplierName }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return {
      ...updated,
      isLowStock: updated.currentStock <= updated.minStock,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STOCK — updates, adjustments, FIFO costing
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Update stock level for an ingredient.
   *
   * - IN: adds quantity to current stock, records shipment at given or existing cost
   * - ADJUSTMENT: sets current stock to the given quantity (physical count correction)
   *
   * Recalculates weighted average cost on IN movements.
   * Returns updated stock and whether low-stock threshold was crossed.
   */
  async updateStock(
    ingredientId: string,
    data: StockUpdateDto,
    userId?: string,
  ) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id: ingredientId },
    });

    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      let newStock: number;
      let movementQuantity: number;
      const unitCost = data.costPerUnit ?? ingredient.costPerUnit;

      if (data.type === StockUpdateType.IN) {
        // Stock IN — add to current level
        if (data.quantity <= 0) {
          throw new BadRequestException('IN quantity must be positive');
        }
        newStock = ingredient.currentStock + data.quantity;
        movementQuantity = data.quantity;

        // Weighted average cost recalculation:
        // newAvgCost = (oldStock * oldCost + newQty * newCost) / (oldStock + newQty)
        if (data.costPerUnit !== undefined && data.costPerUnit !== ingredient.costPerUnit) {
          const oldValue = ingredient.currentStock * ingredient.costPerUnit;
          const newValue = data.quantity * data.costPerUnit;
          const newAvgCost =
            newStock > 0 ? Math.round((oldValue + newValue) / newStock) : data.costPerUnit;

          await tx.ingredient.update({
            where: { id: ingredientId },
            data: {
              currentStock: newStock,
              costPerUnit: newAvgCost,
            },
          });
        } else {
          await tx.ingredient.update({
            where: { id: ingredientId },
            data: { currentStock: newStock },
          });
        }
      } else {
        // ADJUSTMENT — set absolute stock level
        newStock = data.quantity;
        movementQuantity = data.quantity - ingredient.currentStock; // could be negative

        await tx.ingredient.update({
          where: { id: ingredientId },
          data: { currentStock: newStock },
        });
      }

      // Create the stock movement record
      const totalCost = Math.round(Math.abs(movementQuantity) * unitCost);
      await tx.stockMovement.create({
        data: {
          restaurantId: ingredient.restaurantId,
          ingredientId,
          type:
            data.type === StockUpdateType.IN
              ? StockMovementType.IN
              : StockMovementType.ADJUSTMENT,
          quantity: movementQuantity,
          unitCost,
          totalCost,
          reason: data.note,
          createdBy: userId,
        },
      });

      // Fetch updated ingredient to return
      const updated = await tx.ingredient.findUnique({
        where: { id: ingredientId },
      });

      return updated;
    });

    const wasAboveThreshold = ingredient.currentStock > ingredient.minStock;
    const isNowBelow = result.currentStock <= result.minStock;
    const crossedThreshold = wasAboveThreshold && isNowBelow;

    // Fire low-stock alert if threshold just crossed
    if (crossedThreshold) {
      this.emitLowStockAlert(result);
    }

    return {
      id: result.id,
      name: result.name,
      unit: result.unit,
      currentStock: result.currentStock,
      minStock: result.minStock,
      costPerUnit: result.costPerUnit,
      isLowStock: isNowBelow,
      crossedThreshold,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RECIPES — CRUD + cost calculation
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * List all recipes with menu item name, ingredient list, and total cost per serving.
   */
  async getRecipes(restaurantId: string) {
    // Get all menu items that have recipes, within this restaurant
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        category: { restaurantId },
        recipes: { some: {} },
      },
      include: {
        recipes: {
          include: {
            ingredient: {
              select: {
                id: true,
                name: true,
                unit: true,
                costPerUnit: true,
                currentStock: true,
              },
            },
          },
        },
      },
    });

    return menuItems.map((item) => {
      const ingredients = item.recipes.map((r) => ({
        ingredientId: r.ingredient.id,
        ingredientName: r.ingredient.name,
        quantity: r.quantity,
        unit: r.unit,
        costPerUnit: r.ingredient.costPerUnit,
        lineCost: Math.round(r.quantity * r.ingredient.costPerUnit),
      }));

      const totalCostPerServing = ingredients.reduce(
        (sum, ing) => sum + ing.lineCost,
        0,
      );

      return {
        menuItemId: item.id,
        menuItemName: item.name,
        menuItemPrice: item.price,
        ingredients,
        totalCostPerServing,
        foodCostPercent:
          item.price > 0
            ? Math.round((totalCostPerServing / item.price) * 10000) / 100
            : 0,
      };
    });
  }

  /**
   * Create or replace a recipe for a menu item.
   * One recipe per menu item — if ingredients already exist, they are replaced (upsert).
   */
  async createRecipe(restaurantId: string, data: CreateRecipeDto) {
    // Verify menu item belongs to this restaurant
    const menuItem = await this.prisma.menuItem.findFirst({
      where: {
        id: data.menuItemId,
        category: { restaurantId },
      },
    });

    if (!menuItem) {
      throw new NotFoundException(
        'Menu item not found in this restaurant',
      );
    }

    // Verify all ingredients belong to this restaurant
    const ingredientIds = data.ingredients.map((i) => i.ingredientId);
    const ingredients = await this.prisma.ingredient.findMany({
      where: {
        id: { in: ingredientIds },
        restaurantId,
        isActive: true,
      },
    });

    if (ingredients.length !== ingredientIds.length) {
      throw new BadRequestException(
        'One or more ingredients not found or inactive',
      );
    }

    // Build a lookup for ingredient data
    const ingredientMap = new Map(ingredients.map((i) => [i.id, i]));

    // Upsert: delete existing recipe rows for this menu item, then create new ones
    await this.prisma.$transaction(async (tx) => {
      await tx.recipe.deleteMany({
        where: { menuItemId: data.menuItemId },
      });

      await tx.recipe.createMany({
        data: data.ingredients.map((item) => {
          const ing = ingredientMap.get(item.ingredientId);
          return {
            menuItemId: data.menuItemId,
            ingredientId: item.ingredientId,
            quantity: item.quantity,
            unit: ing.unit,
          };
        }),
      });
    });

    // Return the newly created recipe with cost calculation
    const recipes = await this.prisma.recipe.findMany({
      where: { menuItemId: data.menuItemId },
      include: {
        ingredient: {
          select: {
            id: true,
            name: true,
            unit: true,
            costPerUnit: true,
          },
        },
      },
    });

    const recipeIngredients = recipes.map((r) => ({
      ingredientId: r.ingredient.id,
      ingredientName: r.ingredient.name,
      quantity: r.quantity,
      unit: r.unit,
      costPerUnit: r.ingredient.costPerUnit,
      lineCost: Math.round(r.quantity * r.ingredient.costPerUnit),
    }));

    const totalCostPerServing = recipeIngredients.reduce(
      (sum, ing) => sum + ing.lineCost,
      0,
    );

    return {
      menuItemId: menuItem.id,
      menuItemName: menuItem.name,
      menuItemPrice: menuItem.price,
      ingredients: recipeIngredients,
      totalCostPerServing,
      foodCostPercent:
        menuItem.price > 0
          ? Math.round((totalCostPerServing / menuItem.price) * 10000) / 100
          : 0,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RECIPE DEDUCTION — called when order item → PREPARING
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Deduct ingredient stock when an order item starts preparing.
   *
   * CRITICAL BUSINESS RULE: Never block the kitchen.
   * If stock would go negative, log a warning but still allow the deduction.
   * The restaurant may have physical stock not yet entered into the system.
   */
  async deductRecipe(
    menuItemId: string,
    quantity: number,
    orderId: string,
  ) {
    const recipes = await this.prisma.recipe.findMany({
      where: { menuItemId },
      include: {
        ingredient: true,
      },
    });

    if (recipes.length === 0) {
      // No recipe defined — nothing to deduct, no error (some items have no recipe)
      this.logger.warn(
        `No recipe found for menu item ${menuItemId}. Stock not deducted.`,
      );
      return { deducted: false, reason: 'no_recipe' };
    }

    // Track ingredient stock changes for post-transaction alerts
    const stockChanges: Array<{
      restaurantId: string;
      ingredientId: string;
      newStock: number;
      previousStock: number;
    }> = [];

    await this.prisma.$transaction(async (tx) => {
      for (const recipe of recipes) {
        const deductAmount = recipe.quantity * quantity; // qty per serving × number of servings
        const ingredient = recipe.ingredient;

        // Deduct stock — allow negative (never block the kitchen)
        const newStock = ingredient.currentStock - deductAmount;

        await tx.ingredient.update({
          where: { id: ingredient.id },
          data: { currentStock: newStock },
        });

        // Record stock movement
        const totalCost = Math.round(deductAmount * ingredient.costPerUnit);
        await tx.stockMovement.create({
          data: {
            restaurantId: ingredient.restaurantId,
            ingredientId: ingredient.id,
            type: StockMovementType.OUT,
            quantity: -deductAmount, // negative for outgoing
            unitCost: ingredient.costPerUnit,
            totalCost,
            reason: `Order deduction (×${quantity})`,
            referenceId: orderId,
          },
        });

        stockChanges.push({
          restaurantId: ingredient.restaurantId,
          ingredientId: ingredient.id,
          newStock,
          previousStock: ingredient.currentStock,
        });
      }
    });

    // Post-transaction: emit low-stock alerts for any ingredients that crossed threshold
    let alertsTriggered = 0;
    for (const change of stockChanges) {
      const wasAbove = change.previousStock > 0; // simplified check — full check in helper
      await this.checkAndAlertLowStock(
        change.restaurantId,
        change.ingredientId,
        change.newStock,
        change.previousStock,
      );

      // Count alerts for return value
      const ingredient = recipes.find(
        (r) => r.ingredient.id === change.ingredientId,
      )?.ingredient;
      if (ingredient) {
        const wasAboveThreshold = change.previousStock > ingredient.minStock;
        const isNowBelow = change.newStock <= ingredient.minStock;
        if (wasAboveThreshold && isNowBelow) alertsTriggered++;
      }
    }

    return { deducted: true, alertsTriggered };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // WASTE TRACKING
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Record waste for an ingredient. Deducts from stock and logs reason.
   */
  async trackWaste(
    restaurantId: string,
    data: WasteLogDto,
    userId?: string,
  ) {
    const ingredient = await this.prisma.ingredient.findFirst({
      where: { id: data.ingredientId, restaurantId, isActive: true },
    });

    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Deduct from stock
      const newStock = ingredient.currentStock - data.quantity;
      await tx.ingredient.update({
        where: { id: data.ingredientId },
        data: { currentStock: newStock },
      });

      // Record waste movement
      const totalCost = Math.round(data.quantity * ingredient.costPerUnit);
      const movement = await tx.stockMovement.create({
        data: {
          restaurantId,
          ingredientId: data.ingredientId,
          type: StockMovementType.WASTE,
          quantity: -data.quantity, // negative for waste
          unitCost: ingredient.costPerUnit,
          totalCost,
          reason: `${data.reason}${data.note ? ': ' + data.note : ''}`,
          createdBy: data.staffId ?? userId,
        },
      });

      return { newStock, movement };
    });

    // Check low-stock threshold
    const wasAbove = ingredient.currentStock > ingredient.minStock;
    const isNowBelow = result.newStock <= ingredient.minStock;

    if (wasAbove && isNowBelow) {
      this.emitLowStockAlert({
        ...ingredient,
        currentStock: result.newStock,
      });
    }

    if (result.newStock < 0) {
      this.logger.warn(
        `Waste recorded for "${ingredient.name}" pushed stock negative (${result.newStock} ${ingredient.unit}).`,
      );
    }

    return {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      wastedQuantity: data.quantity,
      reason: data.reason,
      wasteCost: Math.round(data.quantity * ingredient.costPerUnit),
      currentStock: result.newStock,
      isLowStock: result.newStock <= ingredient.minStock,
      movementId: result.movement.id,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PHYSICAL STOCK COUNT — reconciliation
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Return system stock levels for a physical count sheet.
   */
  async getStockCount(restaurantId: string) {
    const ingredients = await this.prisma.ingredient.findMany({
      where: { restaurantId, isActive: true },
      orderBy: { name: 'asc' },
      include: {
        stockMovements: {
          where: { type: StockMovementType.ADJUSTMENT },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return ingredients.map((ing) => {
      const lastCount = ing.stockMovements[0];
      return {
        ingredientId: ing.id,
        name: ing.name,
        unit: ing.unit,
        systemStock: ing.currentStock,
        lastPhysicalCount: lastCount
          ? {
              quantity: ing.currentStock, // after adjustment
              date: lastCount.createdAt,
            }
          : null,
        costPerUnit: ing.costPerUnit,
      };
    });
  }

  /**
   * Apply physical stock count — creates ADJUSTMENT movements for each variance.
   */
  async applyStockCount(
    restaurantId: string,
    data: StockCountDto,
    userId?: string,
  ) {
    const ingredientIds = data.counts.map((c) => c.ingredientId);
    const ingredients = await this.prisma.ingredient.findMany({
      where: { id: { in: ingredientIds }, restaurantId, isActive: true },
    });

    if (ingredients.length !== ingredientIds.length) {
      throw new BadRequestException(
        'One or more ingredients not found or inactive',
      );
    }

    const ingredientMap = new Map(ingredients.map((i) => [i.id, i]));
    const adjustments: Array<{
      ingredientId: string;
      name: string;
      unit: string;
      systemStock: number;
      actualQuantity: number;
      variance: number;
    }> = [];

    await this.prisma.$transaction(async (tx) => {
      for (const count of data.counts) {
        const ingredient = ingredientMap.get(count.ingredientId);
        const variance = count.actualQuantity - ingredient.currentStock;

        if (Math.abs(variance) < 0.001) {
          // No meaningful variance — skip
          continue;
        }

        // Update stock to actual
        await tx.ingredient.update({
          where: { id: count.ingredientId },
          data: { currentStock: count.actualQuantity },
        });

        // Create ADJUSTMENT movement
        const totalCost = Math.round(
          Math.abs(variance) * ingredient.costPerUnit,
        );
        await tx.stockMovement.create({
          data: {
            restaurantId,
            ingredientId: count.ingredientId,
            type: StockMovementType.ADJUSTMENT,
            quantity: variance,
            unitCost: ingredient.costPerUnit,
            totalCost,
            reason: `Physical count reconciliation`,
            createdBy: userId,
          },
        });

        adjustments.push({
          ingredientId: ingredient.id,
          name: ingredient.name,
          unit: ingredient.unit,
          systemStock: ingredient.currentStock,
          actualQuantity: count.actualQuantity,
          variance,
        });
      }
    });

    return {
      adjustmentsApplied: adjustments.length,
      totalItemsCounted: data.counts.length,
      adjustments,
      timestamp: new Date().toISOString(),
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // LOW-STOCK QUERY
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Return all ingredients where currentStock <= minStock.
   */
  async getLowStockIngredients(restaurantId: string) {
    const ingredients = await this.prisma.ingredient.findMany({
      where: {
        restaurantId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    return ingredients
      .filter((ing) => ing.currentStock <= ing.minStock)
      .map((ing) => ({
        id: ing.id,
        name: ing.name,
        unit: ing.unit,
        currentStock: ing.currentStock,
        minStock: ing.minStock,
        deficit: Math.round((ing.minStock - ing.currentStock) * 1000) / 1000,
        costPerUnit: ing.costPerUnit,
        supplierName: ing.supplierName,
        estimatedReorderCost: Math.round(
          (ing.minStock - ing.currentStock) * ing.costPerUnit * 2,
        ), // suggest reorder to 2× deficit
      }));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // HELPERS — low-stock alert emission + 86 system
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Emit low-stock alert via both the inventory namespace (dashboard)
   * and the kitchen namespace (KDS + dashboard).
   */
  private emitLowStockAlert(ingredient: {
    id: string;
    restaurantId: string;
    name: string;
    currentStock: number;
    minStock: number;
    unit: string;
  }) {
    const timestamp = new Date().toISOString();

    // 1. Inventory namespace → dashboard real-time widget
    this.inventoryGateway.broadcastLowStock(ingredient.restaurantId, {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      currentStock: ingredient.currentStock,
      minStock: ingredient.minStock,
      unit: ingredient.unit,
      timestamp,
    });

    // 2. Kitchen namespace → KDS + AlertBell on dashboard
    this.kitchenGateway.emitLowStockAlert(ingredient.restaurantId, {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      currentStock: ingredient.currentStock,
      minStockLevel: ingredient.minStock,
      unit: ingredient.unit,
    });

    this.logger.warn(
      `LOW STOCK ALERT: "${ingredient.name}" at ${ingredient.currentStock} ${ingredient.unit} ` +
        `(min: ${ingredient.minStock} ${ingredient.unit})`,
    );
  }

  /**
   * After a deduction, check stock level and emit alert + 86 if needed.
   * Called per-ingredient after deductRecipe() updates stock.
   *
   * V1 behavior:
   *  - Low stock alert when currentStock <= minStock
   *  - Log warning when stock goes negative (never block the kitchen)
   *  - Do NOT auto-86 (deferred to V2 — restaurants may have physical stock)
   */
  private async checkAndAlertLowStock(
    restaurantId: string,
    ingredientId: string,
    newStock: number,
    previousStock: number,
  ) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id: ingredientId },
    });

    if (!ingredient) return;

    // Emit low-stock alert if threshold just crossed
    const wasAbove = previousStock > ingredient.minStock;
    const isNowBelow = newStock <= ingredient.minStock;

    if (wasAbove && isNowBelow) {
      this.emitLowStockAlert({
        ...ingredient,
        currentStock: newStock,
      });
    }

    // Log warning if stock went negative
    if (newStock < 0) {
      this.logger.warn(
        `Stock for "${ingredient.name}" went negative (${newStock} ${ingredient.unit}). ` +
          `Physical stock may be available.`,
      );
    }
  }

  /**
   * Find all menu items that use a given ingredient and mark them as 86'd.
   * Broadcasts menu:item_86d WebSocket event so all connected clients update.
   *
   * NOTE: This is a V2 helper — currently NOT called from deductRecipe
   * because V1 follows the "never block the kitchen" rule. Kept here
   * so the 86 system is ready when auto86Enabled lands.
   */
  async mark86dAffectedItems(restaurantId: string, ingredientId: string) {
    // Find all menu items that use this ingredient
    const recipes = await this.prisma.recipe.findMany({
      where: { ingredientId },
      include: { menuItem: true },
    });

    for (const recipe of recipes) {
      // Skip if already 86'd
      if (recipe.menuItem.is86d) continue;

      // Mark menu item as 86'd
      await this.prisma.menuItem.update({
        where: { id: recipe.menuItemId },
        data: { is86d: true },
      });

      // Fetch ingredient name for the reason string
      const ingredient = await this.prisma.ingredient.findUnique({
        where: { id: ingredientId },
        select: { name: true },
      });

      // Notify KDS, customer QR menu, and dashboard
      this.kitchenGateway.emit86dAlert(restaurantId, {
        menuItemId: recipe.menuItemId,
        menuItemName: recipe.menuItem.name,
        reason: `${ingredient?.name ?? ingredientId} hết hàng`,
      });

      this.logger.warn(
        `AUTO-86: "${recipe.menuItem.name}" marked as 86'd — ingredient "${ingredient?.name}" out of stock`,
      );
    }
  }
}
