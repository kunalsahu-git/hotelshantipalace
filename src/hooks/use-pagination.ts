import { useState, useMemo, useEffect } from 'react';

export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export function usePagination<T>(items: T[], defaultPageSize: PageSize = 25) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState<PageSize>(defaultPageSize);

  // Reset to page 1 whenever the filtered result set changes size
  useEffect(() => {
    setPage(1);
  }, [items.length]);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  );

  const setPageSize = (size: PageSize) => {
    setPageSizeState(size);
    setPage(1);
  };

  return {
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems,
    totalPages,
    // Only show pagination UI when total exceeds the minimum page size
    showPagination: totalItems > 25,
  };
}
