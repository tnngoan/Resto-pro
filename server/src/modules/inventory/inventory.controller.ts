import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get('ingredients')
  @Roles('OWNER', 'MANAGER', 'KITCHEN')
  async getIngredients(@CurrentUser() user: any) {
    return this.inventoryService.getIngredients(user.restaurantId);
  }

  @Get('recipes')
  @Roles('OWNER', 'MANAGER', 'KITCHEN')
  async getRecipes(@CurrentUser() user: any) {
    return this.inventoryService.getRecipes(user.restaurantId);
  }

  @Post('ingredients')
  @Roles('OWNER', 'MANAGER')
  async createIngredient(
    @Body() createIngredientDto: any,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.createIngredient(
      user.restaurantId,
      createIngredientDto,
    );
  }

  @Patch('ingredients/:id/stock')
  @Roles('OWNER', 'MANAGER')
  async updateStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.inventoryService.updateStock(id, quantity);
  }

  @Post('recipes')
  @Roles('OWNER', 'MANAGER')
  async createRecipe(
    @Body() createRecipeDto: any,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.createRecipe(
      user.restaurantId,
      createRecipeDto,
    );
  }

  @Post('waste')
  @Roles('OWNER', 'MANAGER', 'KITCHEN')
  async trackWaste(@Body() wasteDto: any, @CurrentUser() user: any) {
    return this.inventoryService.trackWaste(user.restaurantId, wasteDto);
  }

  @Get('stock-count')
  @Roles('OWNER', 'MANAGER')
  async getStockCount(@CurrentUser() user: any) {
    return this.inventoryService.getStockCount(user.restaurantId);
  }
}
