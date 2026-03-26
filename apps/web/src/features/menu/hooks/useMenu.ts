import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api';
import { MenuItem, MenuCategory } from '@restopro/shared';
import { MenuItemFormData } from '../types';
import { mockCategories, mockMenuItems } from '../../../data/mockMenu';

// ─── Query Keys ──────────────────────────────────────────────────────────────

const menuKeys = {
  all: ['menu'] as const,
  categories: (restaurantId: string) =>
    [...menuKeys.all, 'categories', restaurantId] as const,
  items: (restaurantId: string, categoryId?: string) =>
    [...menuKeys.all, 'items', restaurantId, categoryId ?? 'all'] as const,
  item: (itemId: string) =>
    [...menuKeys.all, 'item', itemId] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Fetch all menu categories for a restaurant.
 * Falls back to mock data if the API is not available.
 */
export function useMenuCategories(restaurantId: string) {
  return useQuery({
    queryKey: menuKeys.categories(restaurantId),
    queryFn: async (): Promise<MenuCategory[]> => {
      try {
        const data = await apiClient.get<MenuCategory[]>(
          `/menu/categories?restaurantId=${restaurantId}`,
        );
        return data;
      } catch {
        // Fallback to mock data when API is not ready
        console.warn('[useMenuCategories] API unavailable, using mock data');
        return mockCategories;
      }
    },
  });
}

/**
 * Fetch menu items for a restaurant, optionally filtered by category.
 * Falls back to mock data if the API is not available.
 */
export function useMenuItems(restaurantId: string, categoryId?: string) {
  return useQuery({
    queryKey: menuKeys.items(restaurantId, categoryId),
    queryFn: async (): Promise<MenuItem[]> => {
      try {
        const params = new URLSearchParams({ restaurantId });
        if (categoryId) params.set('categoryId', categoryId);
        const data = await apiClient.get<MenuItem[]>(
          `/menu/items?${params.toString()}`,
        );
        return data;
      } catch {
        // Fallback to mock data
        console.warn('[useMenuItems] API unavailable, using mock data');
        if (categoryId) {
          return mockMenuItems.filter((item) => item.categoryId === categoryId);
        }
        return mockMenuItems;
      }
    },
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/** Create a new menu item */
export function useCreateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MenuItemFormData): Promise<MenuItem> => {
      return apiClient.post<MenuItem>('/menu/items', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all });
    },
  });
}

/** Update an existing menu item */
export function useUpdateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<MenuItemFormData>;
    }): Promise<MenuItem> => {
      return apiClient.patch<MenuItem>(`/menu/items/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all });
    },
  });
}

/** Toggle item availability (on/off) */
export function useToggleAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      isAvailable,
    }: {
      id: string;
      isAvailable: boolean;
    }): Promise<MenuItem> => {
      return apiClient.patch<MenuItem>(`/menu/items/${id}`, { isAvailable });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all });
    },
  });
}

/** Mark item as 86'd (out of stock) or un-86'd */
export function useMark86d() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      is86d,
    }: {
      id: string;
      is86d: boolean;
    }): Promise<MenuItem> => {
      return apiClient.patch<MenuItem>(`/menu/items/${id}`, {
        is86d,
        isAvailable: !is86d,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all });
    },
  });
}

/** Delete a menu item */
export function useDeleteMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      return apiClient.delete(`/menu/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all });
    },
  });
}
