import { motion } from 'framer-motion';
import { useRef, useEffect } from 'react';

interface Category {
  id: string;
  vietnamese: string;
}

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export default function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to active tab
  useEffect(() => {
    if (activeButtonRef.current && scrollContainerRef.current) {
      activeButtonRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeCategory]);

  return (
    <div className="sticky top-0 bg-surface-base border-b border-surface-light z-10">
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-hide"
      >
        <div className="flex gap-2 px-6 py-4 min-w-max">
          {categories.map((cat) => (
            <motion.button
              ref={activeCategory === cat.id ? activeButtonRef : undefined}
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              whileTap={{ scale: 0.95 }}
              className={`
                px-4 py-2 rounded-button font-medium text-sm whitespace-nowrap
                transition-all duration-200
                ${
                  activeCategory === cat.id
                    ? 'bg-gold text-surface-base'
                    : 'bg-surface-light text-text-secondary hover:text-text-primary'
                }
              `}
            >
              {cat.vietnamese}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
