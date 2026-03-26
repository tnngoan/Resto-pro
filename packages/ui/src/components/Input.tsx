import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, hint, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-primary mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full
              px-4 py-2.5
              bg-surface-medium
              border border-surface-light
              rounded-lg
              text-primary
              placeholder:text-tertiary
              focus:outline-none
              focus:ring-2
              focus:ring-gold-500
              focus:border-transparent
              transition-colors duration-200
              disabled:opacity-50
              disabled:cursor-not-allowed
              ${icon ? 'pl-10' : ''}
              ${error ? 'border-red-500 focus:ring-red-500' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1 text-sm text-secondary">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
