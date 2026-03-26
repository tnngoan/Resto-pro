import React, { forwardRef } from 'react';

type BadgeVariant =
  | 'default'
  | 'gold'
  | 'crimson'
  | 'green'
  | 'muted'
  | 'blue'
  | 'red';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-light text-primary',
  gold: 'bg-gold-600 text-white',
  crimson: 'bg-crimson-600 text-white',
  green: 'bg-green-600 text-white',
  muted: 'bg-surface-light text-secondary',
  blue: 'bg-blue-600 text-white',
  red: 'bg-red-600 text-white',
};

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ variant = 'default', children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          inline-flex items-center justify-center
          px-3 py-1
          text-sm font-semibold
          rounded-full
          whitespace-nowrap
          ${variantStyles[variant]}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';
