import { useState } from 'react';
import { RecipeItem, Ingredient } from '@restopro/shared';
import { Plus, Trash2 } from 'lucide-react';
import { mockIngredients } from '../../../data/mockIngredients';

interface RecipeBuilderProps {
  recipe: RecipeItem[];
  onChange: (recipe: RecipeItem[]) => void;
}

export default function RecipeBuilder({ recipe, onChange }: RecipeBuilderProps) {
  const [ingredients] = useState<Ingredient[]>(mockIngredients);

  const addItem = () => {
    if (ingredients.length === 0) return;
    const first = ingredients[0];
    onChange([
      ...recipe,
      {
        ingredientId: first.id,
        ingredientName: first.name,
        quantity: 0,
        unit: first.unit,
      },
    ]);
  };

  const removeItem = (index: number) => {
    onChange(recipe.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof RecipeItem, value: string | number) => {
    const updated = recipe.map((item, i) => {
      if (i !== index) return item;

      if (field === 'ingredientId') {
        const selected = ingredients.find((ing) => ing.id === value);
        return {
          ...item,
          ingredientId: value as string,
          ingredientName: selected?.name ?? '',
          unit: selected?.unit ?? item.unit,
        };
      }

      if (field === 'quantity') {
        return { ...item, quantity: Number(value) || 0 };
      }

      return { ...item, [field]: value };
    });
    onChange(updated);
  };

  // Available ingredients not already in recipe
  const usedIds = new Set(recipe.map((r) => r.ingredientId));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-primary">
          Công thức (nguyên liệu)
        </label>
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold/80 transition-colors"
        >
          <Plus size={14} />
          Thêm nguyên liệu
        </button>
      </div>

      {recipe.length === 0 && (
        <p className="text-text-tertiary text-xs py-4 text-center border border-dashed border-surface-light rounded-lg">
          Chưa có nguyên liệu. Nhấn "Thêm nguyên liệu" để bắt đầu.
        </p>
      )}

      {recipe.map((item, index) => (
        <div
          key={index}
          className="flex items-center gap-3 bg-surface-dark p-3 rounded-lg border border-surface-light"
        >
          {/* Ingredient selector */}
          <select
            value={item.ingredientId}
            onChange={(e) => updateItem(index, 'ingredientId', e.target.value)}
            className="flex-1 bg-surface-medium border border-surface-light rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            {ingredients.map((ing) => (
              <option
                key={ing.id}
                value={ing.id}
                disabled={usedIds.has(ing.id) && ing.id !== item.ingredientId}
              >
                {ing.name}
              </option>
            ))}
          </select>

          {/* Quantity */}
          <input
            type="number"
            min={0}
            step="any"
            value={item.quantity || ''}
            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
            placeholder="Số lượng"
            className="w-24 bg-surface-medium border border-surface-light rounded-lg px-3 py-2 text-sm text-primary text-right focus:outline-none focus:ring-2 focus:ring-gold-500"
          />

          {/* Unit (read-only, derived from ingredient) */}
          <span className="text-text-secondary text-sm w-12">{item.unit}</span>

          {/* Delete */}
          <button
            type="button"
            onClick={() => removeItem(index)}
            className="p-1.5 text-text-tertiary hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
