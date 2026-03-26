import { KitchenStation, RecipeItem } from '@restopro/shared';

/** Form data for creating/editing a menu item */
export interface MenuItemFormData {
  name: string;
  nameIt?: string;
  categoryId: string;
  price: number;
  description?: string;
  image?: string;
  station: KitchenStation;
  isAvailable: boolean;
  prepTimeMinutes: number;
  recipe: RecipeItem[];
}

/** View mode toggle for menu listing */
export type MenuViewMode = 'grid' | 'list';

/** Filter/sort options for menu items */
export interface MenuFilters {
  categoryId?: string;
  search: string;
  showUnavailable: boolean;
}
