/**
 * MenuPanel.tsx — Scrollable menu items grid with category filtering.
 *
 * Fetches categories and items, caches them in IndexedDB for offline.
 */
import React, { useState, useEffect, useMemo } from 'react';
import type { MenuItem, MenuCategory } from '@restopro/shared';
import { api } from '@/lib/api';
import { setCache, getCache } from '@/lib/offlineStore';
import { MenuCategoryTabs } from './MenuCategoryTabs';
import { MenuItemButton } from './MenuItemButton';

interface MenuPanelProps {
  onSelectItem: (item: MenuItem) => void;
}

export function MenuPanel({ onSelectItem }: MenuPanelProps) {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data (network-first, cache-fallback handled by api.ts)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        // Fetch in parallel
        const [catRes, itemRes] = await Promise.all([
          api.get<{ data: MenuCategory[] } | MenuCategory[]>('/menu-categories'),
          api.get<{ data: MenuItem[] } | MenuItem[]>('/menu-items'),
        ]);

        if (cancelled) return;

        if (!('queued' in catRes)) {
          const cats = Array.isArray(catRes.data)
            ? catRes.data
            : (catRes.data as { data: MenuCategory[] }).data;
          setCategories(cats);
          await setCache('menu_categories', cats);
        }

        if (!('queued' in itemRes)) {
          const items = Array.isArray(itemRes.data)
            ? itemRes.data
            : (itemRes.data as { data: MenuItem[] }).data;
          setMenuItems(items);
          await setCache('menu_items', items);
        }
      } catch {
        // Load from cache
        const cachedCats = await getCache<MenuCategory[]>('menu_categories');
        const cachedItems = await getCache<MenuItem[]>('menu_items');
        if (!cancelled) {
          if (cachedCats) setCategories(cachedCats);
          if (cachedItems) setMenuItems(cachedItems);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter items by selected category
  const filteredItems = useMemo(() => {
    const available = menuItems.filter((i) => i.isAvailable);
    if (!activeCategoryId) return available;
    return available.filter((i) => i.categoryId === activeCategoryId);
  }, [menuItems, activeCategoryId]);

  // Also show 86'd items at the bottom (greyed out)
  const unavailableItems = useMemo(() => {
    const items = menuItems.filter((i) => i.is86d);
    if (!activeCategoryId) return items;
    return items.filter((i) => i.categoryId === activeCategoryId);
  }, [menuItems, activeCategoryId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-tertiary">
        <span className="text-sm">Đang tải thực đơn...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Category tabs */}
      <MenuCategoryTabs
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelect={setActiveCategoryId}
      />

      {/* Menu items grid */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
          {filteredItems.map((item) => (
            <MenuItemButton key={item.id} item={item} onTap={onSelectItem} />
          ))}
          {unavailableItems.map((item) => (
            <MenuItemButton key={item.id} item={item} onTap={onSelectItem} />
          ))}
        </div>

        {filteredItems.length === 0 && unavailableItems.length === 0 && (
          <div className="flex items-center justify-center h-32 text-tertiary text-sm">
            Không có món nào
          </div>
        )}
      </div>
    </div>
  );
}
