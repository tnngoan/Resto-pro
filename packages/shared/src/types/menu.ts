export interface RecipeItem {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
}

export enum KitchenStation {
  HOT_KITCHEN = 'HOT_KITCHEN',
  COLD_KITCHEN = 'COLD_KITCHEN',
  BAR = 'BAR',
  DESSERT = 'DESSERT',
  GRILL = 'GRILL',
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  nameIt?: string;
  description?: string;
  price: number; // VND integer
  image?: string;
  isAvailable: boolean;
  is86d: boolean; // Out of stock
  recipe: RecipeItem[];
  prepTimeMinutes: number;
  station: KitchenStation;
  createdAt: string;
  updatedAt: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  nameIt?: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
