import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { MenuItem, MenuCategory, KitchenStation, RecipeItem } from '@restopro/shared';
import { Modal, Button, Input } from '@restopro/ui';
import RecipeBuilder from './RecipeBuilder';
import { MenuItemFormData } from '../types';

interface MenuItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MenuItemFormData) => void;
  categories: MenuCategory[];
  editingItem?: MenuItem | null;
  isSubmitting?: boolean;
}

const stationOptions: { value: KitchenStation; label: string }[] = [
  { value: KitchenStation.HOT_KITCHEN, label: 'Bếp nóng' },
  { value: KitchenStation.COLD_KITCHEN, label: 'Bếp lạnh' },
  { value: KitchenStation.BAR, label: 'Quầy bar' },
  { value: KitchenStation.DESSERT, label: 'Tráng miệng' },
  { value: KitchenStation.GRILL, label: 'Nướng' },
];

export default function MenuItemForm({
  isOpen,
  onClose,
  onSubmit,
  categories,
  editingItem,
  isSubmitting = false,
}: MenuItemFormProps) {
  const isEditing = !!editingItem;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<MenuItemFormData>({
    defaultValues: {
      name: '',
      nameIt: '',
      categoryId: categories[0]?.id ?? '',
      price: 0,
      description: '',
      image: '',
      station: KitchenStation.HOT_KITCHEN,
      isAvailable: true,
      prepTimeMinutes: 15,
      recipe: [],
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (editingItem) {
      reset({
        name: editingItem.name,
        nameIt: editingItem.nameIt ?? '',
        categoryId: editingItem.categoryId,
        price: editingItem.price,
        description: editingItem.description ?? '',
        image: editingItem.image ?? '',
        station: editingItem.station,
        isAvailable: editingItem.isAvailable,
        prepTimeMinutes: editingItem.prepTimeMinutes,
        recipe: editingItem.recipe ?? [],
      });
    } else {
      reset({
        name: '',
        nameIt: '',
        categoryId: categories[0]?.id ?? '',
        price: 0,
        description: '',
        image: '',
        station: KitchenStation.HOT_KITCHEN,
        isAvailable: true,
        prepTimeMinutes: 15,
        recipe: [],
      });
    }
  }, [editingItem, categories, reset]);

  const handleFormSubmit = (data: MenuItemFormData) => {
    onSubmit(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Chỉnh sửa món' : 'Thêm món mới'}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        {/* Tên món (required) */}
        <Input
          label="Tên món *"
          placeholder="VD: Bò Bít Tết Sốt Tiêu Đen"
          error={errors.name?.message}
          {...register('name', { required: 'Vui lòng nhập tên món' })}
        />

        {/* Tên tiếng Ý (optional) */}
        <Input
          label="Tên tiếng Ý"
          placeholder="VD: Bistecca al Pepe Nero"
          {...register('nameIt')}
        />

        {/* Danh mục + Giá — 2 columns */}
        <div className="grid grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Danh mục *
            </label>
            <select
              {...register('categoryId', { required: 'Vui lòng chọn danh mục' })}
              className="w-full bg-surface-medium border border-surface-light rounded-lg px-4 py-2.5 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              {categories
                .filter((c) => c.isActive)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-sm text-red-500">{errors.categoryId.message}</p>
            )}
          </div>

          {/* Price */}
          <Input
            label="Giá bán (VND) *"
            type="number"
            min={0}
            step={1000}
            placeholder="VD: 385000"
            error={errors.price?.message}
            {...register('price', {
              required: 'Vui lòng nhập giá',
              valueAsNumber: true,
              min: { value: 0, message: 'Giá phải >= 0' },
            })}
          />
        </div>

        {/* Station + Prep time — 2 columns */}
        <div className="grid grid-cols-2 gap-4">
          {/* Kitchen station */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Trạm bếp
            </label>
            <select
              {...register('station')}
              className="w-full bg-surface-medium border border-surface-light rounded-lg px-4 py-2.5 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              {stationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Prep time */}
          <Input
            label="Thời gian chuẩn bị (phút)"
            type="number"
            min={1}
            placeholder="15"
            {...register('prepTimeMinutes', { valueAsNumber: true })}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">Mô tả</label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Mô tả ngắn về món ăn..."
            className="w-full bg-surface-medium border border-surface-light rounded-lg px-4 py-2.5 text-primary text-sm placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
          />
        </div>

        {/* Image URL (simplified — full upload later) */}
        <Input
          label="URL ảnh"
          placeholder="https://..."
          hint="Upload ảnh sẽ được hỗ trợ sau khi kết nối Supabase Storage"
          {...register('image')}
        />

        {/* Available toggle */}
        <div className="flex items-center justify-between bg-surface-dark p-3 rounded-lg border border-surface-light">
          <div>
            <p className="text-sm font-medium text-primary">Có sẵn</p>
            <p className="text-xs text-text-secondary mt-0.5">
              Hiển thị món này trên thực đơn cho khách
            </p>
          </div>
          <Controller
            name="isAvailable"
            control={control}
            render={({ field }) => (
              <button
                type="button"
                role="switch"
                aria-checked={field.value}
                onClick={() => field.onChange(!field.value)}
                className={`
                  relative w-11 h-6 rounded-full transition-colors duration-200
                  ${field.value ? 'bg-green-500' : 'bg-surface-light'}
                `}
              >
                <span
                  className={`
                    absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow
                    transition-transform duration-200
                    ${field.value ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            )}
          />
        </div>

        {/* Recipe Builder */}
        <Controller
          name="recipe"
          control={control}
          render={({ field }) => (
            <RecipeBuilder recipe={field.value} onChange={field.onChange} />
          )}
        />

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-light">
          <Button variant="tertiary" type="button" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Cập nhật' : 'Thêm món'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
