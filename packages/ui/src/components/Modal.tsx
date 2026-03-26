import React, { forwardRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ isOpen, onClose, title, children, className = '', ...props }, ref) => {
    if (!isOpen) {
      return null;
    }

    return (
      <>
        {/* Scrim */}
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          ref={ref}
          className={`
            fixed inset-0 z-50
            flex items-center justify-center
            p-4
          `}
          {...props}
        >
          <div
            className={`
              bg-surface-medium
              rounded-[12px]
              border-t-4 border-gold-500
              max-w-2xl
              w-full
              max-h-[90vh]
              overflow-y-auto
              shadow-xl
              ${className}
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between p-6 border-b border-surface-light">
                <h2 className="text-xl font-bold text-primary">{title}</h2>
                <button
                  onClick={onClose}
                  className="text-secondary hover:text-primary transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="p-6">{children}</div>
          </div>
        </div>
      </>
    );
  }
);

Modal.displayName = 'Modal';
