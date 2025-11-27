// Pagination Component - Reusable pagination controls

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showPageInfo?: boolean;
  showFirstLast?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50, 100],
  showPageSizeSelector = true,
  showPageInfo = true,
  showFirstLast = true,
}: PaginationProps) {
  const hasPrevious = currentPage > 0;
  const hasNext = currentPage < totalPages - 1;

  const startItem = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(0);

      if (currentPage > 2) {
        pages.push('ellipsis');
      }

      // Show pages around current page
      const start = Math.max(1, currentPage - 1);
      const end = Math.min(totalPages - 2, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 3) {
        pages.push('ellipsis');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages - 1);
      }
    }

    return pages;
  };

  const buttonClasses =
    'flex items-center justify-center w-8 h-8 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
  const activeButtonClasses = 'bg-[var(--color-primary)] text-white';
  const inactiveButtonClasses =
    'hover:bg-[var(--color-surface)] border border-[var(--color-border)]';

  if (totalPages === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      {/* Page info */}
      {showPageInfo && (
        <div
          className="text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Showing {startItem} to {endItem} of {totalElements} results
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Page size selector */}
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2 mr-4">
            <span
              className="text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Per page:
            </span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 text-sm border rounded focus:outline-none focus:border-[var(--color-primary)]"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
              }}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* First page button */}
        {showFirstLast && (
          <button
            onClick={() => onPageChange(0)}
            disabled={!hasPrevious}
            className={buttonClasses + ' ' + inactiveButtonClasses}
            title="First page"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <ChevronsLeft size={16} />
          </button>
        )}

        {/* Previous page button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevious}
          className={buttonClasses + ' ' + inactiveButtonClasses}
          title="Previous page"
          style={{ color: 'var(--color-text-primary)' }}
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) =>
            page === 'ellipsis' ? (
              <span
                key={`ellipsis-${index}`}
                className="w-8 h-8 flex items-center justify-center text-sm"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`${buttonClasses} ${
                  currentPage === page
                    ? activeButtonClasses
                    : inactiveButtonClasses
                }`}
                style={
                  currentPage !== page ? { color: 'var(--color-text-primary)' } : {}
                }
              >
                <span className="text-sm">{page + 1}</span>
              </button>
            )
          )}
        </div>

        {/* Next page button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNext}
          className={buttonClasses + ' ' + inactiveButtonClasses}
          title="Next page"
          style={{ color: 'var(--color-text-primary)' }}
        >
          <ChevronRight size={16} />
        </button>

        {/* Last page button */}
        {showFirstLast && (
          <button
            onClick={() => onPageChange(totalPages - 1)}
            disabled={!hasNext}
            className={buttonClasses + ' ' + inactiveButtonClasses}
            title="Last page"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <ChevronsRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export default Pagination;
