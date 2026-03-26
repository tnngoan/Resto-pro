import React, { forwardRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  change?: {
    percentage: number;
    isPositive: boolean;
  };
  sparklineData?: number[];
  icon?: React.ReactNode;
}

export const KPICard = forwardRef<HTMLDivElement, KPICardProps>(
  ({ label, value, change, sparklineData, icon, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          bg-surface-medium
          border border-surface-light
          rounded-[12px]
          p-6
          ${className}
        `}
        {...props}
      >
        {/* Header with icon */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-secondary">{label}</p>
          {icon && <div className="text-gold-500">{icon}</div>}
        </div>

        {/* Main value */}
        <p className="text-4xl font-bold text-primary mb-3">{value}</p>

        {/* Change indicator */}
        {change && (
          <div className="flex items-center gap-2">
            {change.isPositive ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-500">
                  +{change.percentage}%
                </span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-500">
                  {change.percentage}%
                </span>
              </>
            )}
            <span className="text-xs text-secondary">vs. last period</span>
          </div>
        )}

        {/* Sparkline placeholder */}
        {sparklineData && (
          <div className="mt-4 pt-4 border-t border-surface-light">
            <div className="h-12 bg-surface-light rounded opacity-50 flex items-end gap-1 p-2">
              {sparklineData.map((point, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gold-500 rounded-sm"
                  style={{
                    height: `${(point / Math.max(...sparklineData)) * 100}%`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

KPICard.displayName = 'KPICard';
