import { MenuItem, KitchenStation } from '@restopro/shared';
import { Pencil, Ban, CheckCircle, Clock, Flame } from 'lucide-react';
import { formatVND } from '../../../lib/format';

interface MenuItemCardProps {
  item: MenuItem;
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

export default function MenuItemCard({ item, onEdit, onToggle86 }: MenuItemCardProps) {
  const isUnavailable = item.is86d || !item.isAvailable;

  return (
    <div
      className={`
        bg-surface-base border border-surface-light rounded-card overflow-hidden
        hover:border-gold transition-all duration-200 group
        ${isUnavailable ? 'opacity-60' : ''}
      `}
    >
      {/* Image / Placeholder */}
      <div className="relative h-40 bg-surface-dark flex items-center justify-center overflow-hidden">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-text-tertiary">
            <Flame size={32} />
            <span className="text-xs">Chưa có ảnh</span>
          </div>
        )}

        {/* 86'd overlay */}
        {item.is86d && (
          <div className="absolute inset-0 bg-red-900/70 flex items-center justify-center">
            <span className="text-white font-bold text-lg tracking-wider">86'd — HẾT</span>
          </div>
        )}

        {/* Station badge */}
        <div className="absolute top-2 right-2 bg-surface-base/80 backdrop-blur-sm text-text-secondary text-xs px-2 py-1 rounded">
          {stationLabels[item.station]}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Name + Italian name */}
        <div>
          <h3 className="text-text-primary font-semibold text-sm leading-tight">
            {item.name}
          </h3>
          {item.nameIt && (
            <p className="text-text-tertiary text-xs italic mt-0.5">{item.nameIt}</p>
          )}
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-text-secondary text-xs line-clamp-2">{item.description}</p>
        )}

        {/* Price + Prep time */}
        <div className="flex items-center justify-between">
          <span className="text-gold font-bold text-lg">{formatVND(item.price)}</span>
          <div className="flex items-center gap-1 text-text-tertiary text-xs">
            <Clock size={12} />
            <span>{item.prepTimeMinutes} phút</span>
          </div>
        </div>

        {/* Status + Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-surface-light">
          {/* Availability status */}
          <div className="flex items-center gap-1.5">
            {isUnavailable ? (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs text-red-400 font-medium">
                  {item.is86d ? 'Hết hàng (86)' : 'Không có sẵn'}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-green-400 font-medium">Có sẵn</span>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggle86(item)}
              title={item.is86d ? 'Bỏ đánh dấu 86' : 'Đánh dấu 86 (hết hàng)'}
              className={`
                p-1.5 rounded transition-colors
                ${
                  item.is86d
                    ? 'text-green-400 hover:bg-green-500/10'
                    : 'text-text-tertiary hover:text-red-400 hover:bg-red-500/10'
                }
              `}
            >
              {item.is86d ? <CheckCircle size={16} /> : <Ban size={16} />}
            </button>
            <button
              onClick={() => onEdit(item)}
              title="Chỉnh sửa"
              className="p-1.5 rounded text-text-tertiary hover:text-gold hover:bg-gold/10 transition-colors"
            >
              <Pencil size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
