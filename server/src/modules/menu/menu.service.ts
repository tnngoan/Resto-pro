import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { MenuQueryDto } from './dto/menu-query.dto';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all active categories with item count, sorted by sortOrder
   */
  async getCategories(restaurantId: string) {
    const categories = await this.prisma.menuCategory.findMany({
      where: {
        restaurantId,
        isActive: true,
      },
      include: {
        _count: {
          select: { menuItems: { where: { isAvailable: true, is86d: false } } },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    return {
      data: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        nameIt: cat.nameIt,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        sortOrder: cat.sortOrder,
        itemCount: cat._count.menuItems,
      })),
    };
  }

  /**
   * Get menu items with optional filtering by category, search, availability
   */
  async getMenuItems(restaurantId: string, filters?: MenuQueryDto) {
    const limit = filters?.limit ?? 50;
    const where: any = {
      restaurantId,
      isAvailable: true,
      is86d: false,
    };

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { nameIt: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Cursor-based pagination
    const items = await this.prisma.menuItem.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            nameIt: true,
            slug: true,
          },
        },
        recipes: {
          include: {
            ingredient: {
              select: {
                id: true,
                name: true,
                unit: true,
              },
            },
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
      take: limit + 1, // Fetch one extra to determine if there's a next page
      ...(filters?.cursor && {
        skip: 1,
        cursor: {
          id: filters.cursor,
        },
      }),
    });

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, -1) : items;
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    return {
      data: data.map((item) => ({
        id: item.id,
        name: item.name,
        nameIt: item.nameIt,
        description: item.description,
        descriptionIt: item.descriptionIt,
        price: item.price,
        imageUrl: item.imageUrl,
        category: item.category,
        station: item.station,
        prepTimeMinutes: item.prepTimeMinutes,
        allergens: item.allergens,
        tags: item.tags,
        recipes: item.recipes.map((r) => ({
          ingredientId: r.ingredientId,
          ingredientName: r.ingredient.name,
          quantity: r.quantity,
          unit: r.unit,
        })),
      })),
      meta: {
        hasMore,
        nextCursor,
      },
    };
  }

  /**
   * Get single menu item with all details
   */
  async getMenuItem(id: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            nameIt: true,
            slug: true,
          },
        },
        recipes: {
          include: {
            ingredient: {
              select: {
                id: true,
                name: true,
                unit: true,
                currentStock: true,
                costPerUnit: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    return {
      data: {
        id: item.id,
        name: item.name,
        nameIt: item.nameIt,
        description: item.description,
        descriptionIt: item.descriptionIt,
        price: item.price,
        imageUrl: item.imageUrl,
        category: item.category,
        station: item.station,
        prepTimeMinutes: item.prepTimeMinutes,
        isAvailable: item.isAvailable,
        is86d: item.is86d,
        allergens: item.allergens,
        tags: item.tags,
        recipes: item.recipes.map((r) => ({
          ingredientId: r.ingredientId,
          ingredientName: r.ingredient.name,
          quantity: r.quantity,
          unit: r.unit,
          currentStock: r.ingredient.currentStock,
          costPerUnit: r.ingredient.costPerUnit,
        })),
      },
    };
  }

  /**
   * Create a new menu item
   */
  async createMenuItem(restaurantId: string, data: CreateMenuItemDto) {
    // Verify category belongs to restaurant
    const category = await this.prisma.menuCategory.findUnique({
      where: { id: data.categoryId },
    });

    if (!category || category.restaurantId !== restaurantId) {
      throw new BadRequestException('Invalid category for this restaurant');
    }

    const item = await this.prisma.menuItem.create({
      data: {
        restaurantId,
        categoryId: data.categoryId,
        name: data.name,
        nameIt: data.nameIt,
        description: data.description,
        descriptionIt: data.descriptionIt,
        price: data.price,
        imageUrl: data.imageUrl,
        station: data.station || 'HOT_KITCHEN',
        prepTimeMinutes: data.prepTimeMinutes || 15,
        allergens: data.allergens || [],
        tags: data.tags || [],
        sortOrder: data.sortOrder || 0,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            nameIt: true,
          },
        },
      },
    });

    return {
      data: {
        id: item.id,
        name: item.name,
        nameIt: item.nameIt,
        price: item.price,
        category: item.category,
        station: item.station,
      },
    };
  }

  /**
   * Update menu item (partial update)
   */
  async updateMenuItem(id: string, data: UpdateMenuItemDto) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    // If changing category, verify it exists and belongs to same restaurant
    if (data.categoryId && data.categoryId !== item.categoryId) {
      const newCategory = await this.prisma.menuCategory.findUnique({
        where: { id: data.categoryId },
      });

      if (!newCategory || newCategory.restaurantId !== item.restaurantId) {
        throw new BadRequestException('Invalid category for this restaurant');
      }
    }

    const updated = await this.prisma.menuItem.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.nameIt !== undefined && { nameIt: data.nameIt }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.descriptionIt !== undefined && { descriptionIt: data.descriptionIt }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.station !== undefined && { station: data.station }),
        ...(data.prepTimeMinutes !== undefined && { prepTimeMinutes: data.prepTimeMinutes }),
        ...(data.allergens !== undefined && { allergens: data.allergens }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            nameIt: true,
          },
        },
      },
    });

    return {
      data: {
        id: updated.id,
        name: updated.name,
        nameIt: updated.nameIt,
        price: updated.price,
        category: updated.category,
      },
    };
  }

  /**
   * Toggle item availability
   */
  async toggleAvailability(id: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    const updated = await this.prisma.menuItem.update({
      where: { id },
      data: {
        isAvailable: !item.isAvailable,
      },
    });

    return {
      data: {
        id: updated.id,
        name: updated.name,
        isAvailable: updated.isAvailable,
      },
    };
  }

  /**
   * Mark item as 86'd (out of stock)
   */
  async mark86d(id: string, is86d: boolean) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    const updated = await this.prisma.menuItem.update({
      where: { id },
      data: { is86d },
    });

    return {
      data: {
        id: updated.id,
        name: updated.name,
        is86d: updated.is86d,
      },
    };
  }

  /**
   * Create a new menu category
   */
  async createCategory(restaurantId: string, data: CreateCategoryDto) {
    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');

    const category = await this.prisma.menuCategory.create({
      data: {
        restaurantId,
        name: data.name,
        nameIt: data.nameIt,
        slug,
        description: data.description,
        imageUrl: data.imageUrl,
        sortOrder: data.sortOrder || 0,
      },
    });

    return {
      data: {
        id: category.id,
        name: category.name,
        nameIt: category.nameIt,
        slug: category.slug,
      },
    };
  }

  /**
   * Update menu category
   */
  async updateCategory(id: string, data: UpdateCategoryDto) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const updated = await this.prisma.menuCategory.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.nameIt !== undefined && { nameIt: data.nameIt }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });

    return {
      data: {
        id: updated.id,
        name: updated.name,
        nameIt: updated.nameIt,
      },
    };
  }
}
