import React, { forwardRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

interface TableProps<T> extends React.TableHTMLAttributes<HTMLTableElement> {
  columns: Column<T>[];
  data: T[];
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  sortKey?: keyof T;
  sortDirection?: 'asc' | 'desc';
  onRowClick?: (row: T) => void;
  pagination?: {
    currentPage: number;
    pageSize: number;
    total: number;
    onNextPage: () => void;
    onPreviousPage: () => void;
  };
}

export const Table = forwardRef<HTMLTableElement, TableProps<any>>(
  (
    {
      columns,
      data,
      onSort,
      sortKey,
      sortDirection,
      onRowClick,
      pagination,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div className="overflow-x-auto">
        <table
          ref={ref}
          className={`w-full text-sm ${className}`}
          {...props}
        >
          {/* Header */}
          <thead>
            <tr className="bg-surface-light border-b border-surface-dark">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-6 py-3 text-left font-semibold text-secondary"
                  style={{ width: col.width }}
                >
                  <button
                    onClick={() => {
                      if (col.sortable && onSort) {
                        const newDirection =
                          sortKey === col.key && sortDirection === 'asc'
                            ? 'desc'
                            : 'asc';
                        onSort(col.key, newDirection);
                      }
                    }}
                    disabled={!col.sortable}
                    className="flex items-center gap-2 hover:text-primary disabled:cursor-default transition-colors"
                  >
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <span className="text-gold-500">
                        {sortDirection === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </span>
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                onClick={() => onRowClick?.(row)}
                className={`
                  border-b border-surface-light
                  ${idx % 2 === 0 ? 'bg-surface-dark' : 'bg-[#2A2A2A]'}
                  hover:bg-surface-medium
                  transition-colors
                  ${onRowClick ? 'cursor-pointer' : ''}
                `}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-6 py-4 text-primary">
                    {col.render
                      ? col.render(row[col.key], row)
                      : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty state */}
        {data.length === 0 && (
          <div className="text-center py-12">
            <p className="text-secondary">Không có dữ liệu</p>
          </div>
        )}

        {/* Pagination footer */}
        {pagination && (
          <div className="flex items-center justify-between p-4 border-t border-surface-light bg-surface-light">
            <p className="text-sm text-secondary">
              Hiển thị {(pagination.currentPage - 1) * pagination.pageSize + 1}{' '}
              đến {Math.min(pagination.currentPage * pagination.pageSize, pagination.total)} của{' '}
              {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={pagination.onPreviousPage}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 rounded border border-surface-dark text-secondary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                onClick={pagination.onNextPage}
                disabled={
                  pagination.currentPage * pagination.pageSize >=
                  pagination.total
                }
                className="px-3 py-1 rounded border border-surface-dark text-secondary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

Table.displayName = 'Table';
