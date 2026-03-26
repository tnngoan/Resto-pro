import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Table } from '@restopro/shared';
import { Modal, Button, Input } from '@restopro/ui';

interface TableFormData {
  name: string;
  capacity: number;
  zone: string;
}

interface TableFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TableFormData) => void;
  editingTable?: Table | null;
  existingZones: string[];
  isSubmitting?: boolean;
}

export default function TableForm({
  isOpen,
  onClose,
  onSubmit,
  editingTable,
  existingZones,
  isSubmitting = false,
}: TableFormProps) {
  const isEditing = !!editingTable;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TableFormData>({
    defaultValues: {
      name: '',
      capacity: 4,
      zone: 'Tầng 1',
    },
  });

  useEffect(() => {
    if (editingTable) {
      reset({
        name: editingTable.name,
        capacity: editingTable.capacity,
        zone: editingTable.zone ?? 'Tầng 1',
      });
    } else {
      reset({
        name: '',
        capacity: 4,
        zone: existingZones[0] ?? 'Tầng 1',
      });
    }
  }, [editingTable, existingZones, reset]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Chỉnh sửa bàn' : 'Thêm bàn mới'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Table name */}
        <Input
          label="Tên bàn *"
          placeholder="VD: Bàn 18, VIP 04"
          error={errors.name?.message}
          {...register('name', { required: 'Vui lòng nhập tên bàn' })}
        />

        {/* Capacity */}
        <Input
          label="Số chỗ ngồi *"
          type="number"
          min={1}
          max={50}
          error={errors.capacity?.message}
          {...register('capacity', {
            required: 'Vui lòng nhập số chỗ',
            valueAsNumber: true,
            min: { value: 1, message: 'Tối thiểu 1 chỗ' },
            max: { value: 50, message: 'Tối đa 50 chỗ' },
          })}
        />

        {/* Zone */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Khu vực
          </label>
          <select
            {...register('zone')}
            className="w-full bg-surface-medium border border-surface-light rounded-lg px-4 py-2.5 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            {existingZones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-text-secondary">
            Khu vực hiện có. Để thêm khu vực mới, nhập tên trực tiếp.
          </p>
          {/* Allow custom zone entry */}
          <input
            {...register('zone')}
            type="text"
            placeholder="Hoặc nhập tên khu vực mới..."
            className="mt-2 w-full bg-surface-medium border border-surface-light rounded-lg px-4 py-2.5 text-primary text-sm placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-light">
          <Button variant="tertiary" type="button" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Cập nhật' : 'Thêm bàn'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
