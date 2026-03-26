import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { MenuService } from './menu.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { MenuQueryDto } from './dto/menu-query.dto';

@Controller('menu')
export class MenuController {
  constructor(private menuService: MenuService) {}

  /**
   * Get all active categories (public endpoint for QR menu)
   */
  @Get('categories')
  async getCategories(@Query('restaurantId') restaurantId: string) {
    return this.menuService.getCategories(restaurantId);
  }

  /**
   * Get menu items with optional filtering (public for QR menu)
   */
  @Get('items')
  async getItems(
    @Query('restaurantId') restaurantId: string,
    @Query() filters: MenuQueryDto,
  ) {
    return this.menuService.getMenuItems(restaurantId, filters);
  }

  /**
   * Get single menu item (public)
   */
  @Get('items/:id')
  async getItem(@Param('id') id: string) {
    return this.menuService.getMenuItem(id);
  }

  /**
   * Create menu item (protected: OWNER, MANAGER)
   */
  @Post('items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  async createItem(
    @Body() createItemDto: CreateMenuItemDto,
    @CurrentUser() user: any,
  ) {
    return this.menuService.createMenuItem(user.restaurantId, createItemDto);
  }

  /**
   * Update menu item (protected)
   */
  @Patch('items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  async updateItem(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateMenuItemDto,
  ) {
    return this.menuService.updateMenuItem(id, updateItemDto);
  }

  /**
   * Toggle item availability
   */
  @Patch('items/:id/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  async toggleAvailability(@Param('id') id: string) {
    return this.menuService.toggleAvailability(id);
  }

  /**
   * Mark item as 86'd (out of stock) - kitchen can also do this
   */
  @Patch('items/:id/86d')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER', 'KITCHEN')
  async mark86d(
    @Param('id') id: string,
    @Body('is86d') is86d: boolean,
  ) {
    return this.menuService.mark86d(id, is86d);
  }

  /**
   * Create menu category
   */
  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  async createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
    @CurrentUser() user: any,
  ) {
    return this.menuService.createCategory(user.restaurantId, createCategoryDto);
  }

  /**
   * Update menu category
   */
  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.menuService.updateCategory(id, updateCategoryDto);
  }
}
