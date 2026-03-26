/**
 * MenuCategoryTabs.tsx — Horizontal scrollable category filter tabs.
 * Includes "Tất cả" (All) as the first tab.
 */
import React from 'react';
import type { MenuCategory } from '@restopro/shared';

interface MenuCategoryTabsProps {
  categories: MenuCategory[];
  activeCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
}

export function MenuCategoryTabs({ categories, activeCategoryId, onSelect }: MenuCategoryTabsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto px-2 py-2 shrink-0 scrollbar-none">
      {/* "All" tab */}
      <button
        onClick={() => onSelect(null)}
        className={`px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors min-h-[44px] ${
          activeCategoryId === null
            ? 'bg-gold-500 text-surface-dark'
            : 'bg-surface-light text-secondary hover:text-primary hover:bg-surface-light/80'
        }`}
      >
        Tất cả
      </button>

      {categories
        .filter((c) => c.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors min-h-[44px] ${
              activeCategoryId === cat.id
                ? 'bg-gold-500 text-surface-dark'
                : 'bg-surface-light text-secondary hover:text-primary hover:bg-surface-light/80'
            }`}
          >
            {cat.name}
          </button>
        ))}
    </div>
  );
}
