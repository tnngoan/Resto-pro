import { MenuItem, MenuCategory, KitchenStation } from '@restopro/shared';
import { Pencil, Ban, CheckCircle, Clock } from 'lucide-react';
import { formatVND } from '../../../lib/format';

interface MenuItemTableProps {
  items: MenuItem[];
  categories: MenuCategory[];
  onEdit: (item: MenuItem) => void;
  onToggle86: (item: MenuItem) => void;
}

const stationLabels: Record<KitchenStation, string> = {
  [KitchenStation.HOT_KITCHEN]: 'Bếp nóng',
  [KitchenStation.COLD_KITCHEN]: 'Bếp lạnh',
  [KitchenStation.BAR]: 'Quầy bar',
  [KitchenStation.DESSERT]: 'Tráng miệng',
  [KitchenStation.GRILL]: 'Nướng',
};

export default function MenuItemTable({
  items,
  categories,
  onEdit,
  onToggle86,
}: MenuItemTableProps) {
  const categoryMap = categories.reduce<Record<string, string>>((acc, cat) => {
    acc[cat.id] = cat.name;
    return acc;
  }, {});

  return (
    <div className="bg-surface-base border border-surface-light rounded-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-light border-b border-surface-light">
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Tên món</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Danh mục</th>
              <th className="text-right px-4 py-3 text-text-secondary font-medium">Giá</th>
              <th className="text-center px-4 py-3 text-text-secondary font-medium">Trạm bếp</th>
              <th className="text-center px-4 py-3 text-text-secondary font-medium">Thời gian</th>
              <th className="text-center px-4 py-3 text-text-secondary font-medium">Trạng thái</th>
              <th className="text-center px-4 py-3 text-text-secondary font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-light">
            {items.map((item) => {
              const isUnavailable = item.is86d || !item.isAvailable;
              return (
                <tr
                  key={item.id}
                  className={`
                    hover:bg-surface-light/50 transition-colors
                    ${isUnavailable ? 'opacity-60' : ''}
                  `}
                >
                  {/* Name */}
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-text-primary font-medium">{item.name}</span>
                      {item.nameIt && (
                        <span className="block text-text-tertiary text-xs italic mt-0.5">
                          {item.nameIt}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 text-text-secondary">
                    {categoryMap[item.categoryId] ?? '—'}
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3 text-right text-gold font-semibold">
                    {formatVND(item.price)}
                  </td>

                  {/* Station */}
                  <td className="px-4 py-3 text-center text-text-secondary text-xs">
                    {stationLabels[item.station]}
                  </td>

                  {/* Prep time */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-text-tertiary text-xs">
                      <Clock size={12} />
                      <span>{item.prepTimeMinutes}p</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    {isUnavailable ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        {item.is86d ? '86' : 'Tắt'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Có sẵn
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onToggle86(item)}
                        title={item.is86d ? 'Bỏ 86' : 'Đánh dấu 86'}
                        className={`
                          p-1.5 rounded transition-colors
                          ${
                            item.is86d
                              ? 'text-green-400 hover:bg-green-500/10'
                              : 'text-text-tertiary hover:text-red-400 hover:bg-red-500/10'
                          }
                        `}
                      >
                        {item.is86d ? <CheckCircle size={14} /> : <Ban size={14} />}
                      </button>
                      <button
                        onClick={() => onEdit(item)}
                        title="Chỉnh sửa"
                        className="p-1.5 rounded text-text-tertiary hover:text-gold hover:bg-gold/10 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-text-tertiary">
                  Không tìm thấy món ăn nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
