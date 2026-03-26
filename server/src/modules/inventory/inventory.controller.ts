import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { InventoryService } from './inventory.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { StockUpdateDto } from './dto/stock-update.dto';
import { WasteLogDto } from './dto/waste-log.dto';
import { StockCountDto } from './dto/stock-count.dto';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  // ── Ingredients ──────────────────────────────────────────────────────────

  @Get('ingredients')
  @Roles('OWNER', 'MANAGER', 'KITCHEN')
  async getIngredients(@CurrentUser() user: any) {
    return this.inventoryService.getIngredients(user.restaurantId);
  }

  @Get('ingredients/low-stock')
  @Roles('OWNER', 'MANAGER')
  async getLowStockIngredients(@CurrentUser() user: any) {
    return this.inventoryService.getLowStockIngredients(user.restaurantId);
  }

  @Get('ingredients/:id')
  @Roles('OWNER', 'MANAGER', 'KITCHEN')
  async getIngredient(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.getIngredient(id);
  }

  @Post('ingredients')
  @Roles('OWNER', 'MANAGER')
  async createIngredient(
    @Body() dto: CreateIngredientDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.createIngredient(
      user.restaurantId,
      dto,
      user.id,
    );
  }

  @Patch('ingredients/:id')
  @Roles('OWNER', 'MANAGER')
  async updateIngredient(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIngredientDto,
  ) {
    return this.inventoryService.updateIngredient(id, dto);
  }

  @Patch('ingredients/:id/stock')
  @Roles('OWNER', 'MANAGER')
  async updateStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StockUpdateDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.updateStock(id, dto, user.id);
  }

  // ── Recipes ──────────────────────────────────────────────────────────────

  @Get('recipes')
  @Roles('OWNER', 'MANAGER', 'KITCHEN')
  async getRecipes(@CurrentUser() user: any) {
    return this.inventoryService.getRecipes(user.restaurantId);
  }

  @Post('recipes')
  @Roles('OWNER', 'MANAGER')
  async createRecipe(
    @Body() dto: CreateRecipeDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.createRecipe(user.restaurantId, dto);
  }

  // ── Waste Tracking ───────────────────────────────────────────────────────

  @Post('waste')
  @Roles('OWNER', 'MANAGER', 'KITCHEN')
  async trackWaste(@Body() dto: WasteLogDto, @CurrentUser() user: any) {
    return this.inventoryService.trackWaste(
      user.restaurantId,
      dto,
      user.id,
    );
  }

  // ── Stock Count (Physical Reconciliation) ────────────────────────────────

  @Get('stock-count')
  @Roles('OWNER', 'MANAGER')
  async getStockCount(@CurrentUser() user: any) {
    return this.inventoryService.getStockCount(user.restaurantId);
  }

  @Post('stock-count')
  @Roles('OWNER', 'MANAGER')
  async applyStockCount(
    @Body() dto: StockCountDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.applyStockCount(
      user.restaurantId,
      dto,
      user.id,
    );
  }
}
