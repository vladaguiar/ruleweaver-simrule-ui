// Tests for Pagination component
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination, PaginationProps } from './Pagination';

describe('Pagination', () => {
  const defaultProps: PaginationProps = {
    currentPage: 0,
    totalPages: 5,
    totalElements: 50,
    pageSize: 10,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
  };

  const renderPagination = (props: Partial<PaginationProps> = {}) => {
    const mergedProps = { ...defaultProps, ...props };
    return render(<Pagination {...mergedProps} />);
  };

  it('should render nothing when totalPages is 0', () => {
    const { container } = renderPagination({ totalPages: 0 });
    expect(container.firstChild).toBeNull();
  });

  it('should display page info correctly', () => {
    renderPagination();
    expect(screen.getByText('Showing 1 to 10 of 50 results')).toBeInTheDocument();
  });

  it('should display correct page info for middle pages', () => {
    renderPagination({ currentPage: 2 });
    expect(screen.getByText('Showing 21 to 30 of 50 results')).toBeInTheDocument();
  });

  it('should display correct page info for last page with partial results', () => {
    renderPagination({ currentPage: 4, totalElements: 45 });
    expect(screen.getByText('Showing 41 to 45 of 45 results')).toBeInTheDocument();
  });

  it('should display 0 to 0 when totalElements is 0', () => {
    renderPagination({ totalElements: 0, totalPages: 1 });
    expect(screen.getByText('Showing 0 to 0 of 0 results')).toBeInTheDocument();
  });

  it('should disable previous button on first page', () => {
    renderPagination({ currentPage: 0 });
    const prevButton = screen.getByTitle('Previous page');
    expect(prevButton).toBeDisabled();
  });

  it('should disable next button on last page', () => {
    renderPagination({ currentPage: 4 });
    const nextButton = screen.getByTitle('Next page');
    expect(nextButton).toBeDisabled();
  });

  it('should enable navigation buttons on middle pages', () => {
    renderPagination({ currentPage: 2 });
    expect(screen.getByTitle('Previous page')).not.toBeDisabled();
    expect(screen.getByTitle('Next page')).not.toBeDisabled();
  });

  it('should call onPageChange when clicking next button', () => {
    const onPageChange = vi.fn();
    renderPagination({ currentPage: 0, onPageChange });

    fireEvent.click(screen.getByTitle('Next page'));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('should call onPageChange when clicking previous button', () => {
    const onPageChange = vi.fn();
    renderPagination({ currentPage: 2, onPageChange });

    fireEvent.click(screen.getByTitle('Previous page'));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('should call onPageChange when clicking first page button', () => {
    const onPageChange = vi.fn();
    renderPagination({ currentPage: 4, onPageChange });

    fireEvent.click(screen.getByTitle('First page'));
    expect(onPageChange).toHaveBeenCalledWith(0);
  });

  it('should call onPageChange when clicking last page button', () => {
    const onPageChange = vi.fn();
    renderPagination({ currentPage: 0, onPageChange });

    fireEvent.click(screen.getByTitle('Last page'));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('should call onPageChange when clicking page number', () => {
    const onPageChange = vi.fn();
    renderPagination({ currentPage: 0, onPageChange });

    // Page numbers are displayed as 1-based, so clicking "3" should pass 2 (0-based index)
    fireEvent.click(screen.getByText('3'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('should render page size selector by default', () => {
    renderPagination();
    expect(screen.getByText('Per page:')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should not render page size selector when showPageSizeSelector is false', () => {
    renderPagination({ showPageSizeSelector: false });
    expect(screen.queryByText('Per page:')).not.toBeInTheDocument();
  });

  it('should call onPageSizeChange when selecting new page size', () => {
    const onPageSizeChange = vi.fn();
    renderPagination({ onPageSizeChange });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '20' } });
    expect(onPageSizeChange).toHaveBeenCalledWith(20);
  });

  it('should render custom page size options', () => {
    renderPagination({ pageSizeOptions: [25, 50, 75] });
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent('25');
    expect(options[1]).toHaveTextContent('50');
    expect(options[2]).toHaveTextContent('75');
  });

  it('should not render page info when showPageInfo is false', () => {
    renderPagination({ showPageInfo: false });
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  });

  it('should not render first/last buttons when showFirstLast is false', () => {
    renderPagination({ showFirstLast: false });
    expect(screen.queryByTitle('First page')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Last page')).not.toBeInTheDocument();
  });

  it('should highlight current page', () => {
    renderPagination({ currentPage: 2 });
    const pageButton = screen.getByText('3');
    expect(pageButton.parentElement).toHaveClass('bg-[var(--color-primary)]');
  });

  it('should show all page numbers when totalPages <= 5', () => {
    renderPagination({ totalPages: 4, totalElements: 40 });
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.queryByText('...')).not.toBeInTheDocument();
  });

  it('should show ellipsis for many pages', () => {
    renderPagination({ totalPages: 10, totalElements: 100, currentPage: 5 });
    const ellipses = screen.getAllByText('...');
    expect(ellipses.length).toBeGreaterThan(0);
  });

  it('should always show first and last page for many pages', () => {
    // Hide page size selector to avoid conflicts with page numbers
    renderPagination({
      totalPages: 10,
      totalElements: 100,
      currentPage: 5,
      showPageSizeSelector: false
    });
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should not show page size selector if onPageSizeChange is not provided', () => {
    renderPagination({ onPageSizeChange: undefined });
    expect(screen.queryByText('Per page:')).not.toBeInTheDocument();
  });
});
