import { MenuCategory, MenuItem } from '@restopro/shared';

interface MenuCategoryListProps {
  categories: MenuCategory[];
  items: MenuItem[];
  selectedCategoryId?: string;
  onSelectCategory: (categoryId?: string) => void;
}

export default function MenuCategoryList({
  categories,
  items,
  selectedCategoryId,
  onSelectCategory,
}: MenuCategoryListProps) {
  // Count items per category
  const countByCategory = categories.reduce<Record<string, number>>((acc, cat) => {
    acc[cat.id] = items.filter((item) => item.categoryId === cat.id).length;
    return acc;
  }, {});

  const totalCount = items.length;

  return (
    <div className="flex flex-wrap gap-2">
      {/* "All" tab */}
      <button
        onClick={() => onSelectCategory(undefined)}
        className={`
          px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
          ${
            !selectedCategoryId
              ? 'bg-gold text-surface-base'
              : 'bg-surface-light text-text-secondary hover:text-text-primary hover:bg-surface-base'
          }
        `}
      >
        Tất cả
        <span className="ml-2 text-xs opacity-75">({totalCount})</span>
      </button>

      {/* Category tabs */}
      {categories
        .filter((cat) => cat.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${
                selectedCategoryId === category.id
                  ? 'bg-gold text-surface-base'
                  : 'bg-surface-light text-text-secondary hover:text-text-primary hover:bg-surface-base'
              }
            `}
          >
            {category.name}
            <span className="ml-2 text-xs opacity-75">
              ({countByCategory[category.id] ?? 0})
            </span>
          </button>
        ))}
    </div>
  );
}
