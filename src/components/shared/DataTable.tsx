"use client";

import { useState, type ReactNode } from "react";
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFns,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  useTable,
  type CellData,
  type ColumnDef,
  type PaginationState,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns,
  sortFns,
});

export type DataTableFeatures = typeof dataTableFeatures;

export type DataTableColumnDef<
  TData extends RowData,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TValue extends CellData = any,
> = ColumnDef<DataTableFeatures, TData, TValue>;

export function createDataTableColumnHelper<TData extends RowData>() {
  return createColumnHelper<DataTableFeatures, TData>();
}

export interface ServerPaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
}

export interface ClientPaginationConfig {
  pageSize?: number;
}

export interface DataTableProps<TData extends RowData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: DataTableColumnDef<TData, any>[];
  data: TData[];
  searchPlaceholder?: string;
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  toolbarSlot?: ReactNode;
  pagination?: ServerPaginationMeta | ClientPaginationConfig;
  isLoading?: boolean;
  emptyState?: ReactNode;
  onRowClick?: (row: TData) => void;
  className?: string;
}

function isServerPagination(
  pagination: ServerPaginationMeta | ClientPaginationConfig | undefined
): pagination is ServerPaginationMeta {
  return Boolean(
    pagination &&
      "totalPages" in pagination &&
      "page" in pagination &&
      "totalItems" in pagination
  );
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  searchPlaceholder = "Cari data...",
  searchable,
  searchValue,
  onSearchChange,
  toolbarSlot,
  pagination,
  isLoading = false,
  emptyState,
  onRowClick,
  className,
}: DataTableProps<TData>) {
  const [internalSearch, setInternalSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const serverMode = isServerPagination(pagination);
  const defaultPageSize = serverMode
    ? pagination.limit
    : (pagination?.pageSize ?? 10);

  const [clientPagination, setClientPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });

  const activeSearch = searchValue !== undefined ? searchValue : internalSearch;
  const showSearch =
    searchable ?? (Boolean(searchPlaceholder) && (Boolean(onSearchChange) || data.length > 0 || activeSearch.length > 0));

  const table = useTable(
    {
      features: dataTableFeatures,
      data,
      columns,
      manualPagination: serverMode,
      pageCount: serverMode ? Math.max(1, pagination.totalPages) : undefined,
      rowCount: serverMode ? pagination.totalItems : undefined,
      state: {
        sorting,
        globalFilter: onSearchChange ? undefined : activeSearch,
        pagination: serverMode
          ? {
              pageIndex: Math.max(0, pagination.page - 1),
              pageSize: pagination.limit,
            }
          : clientPagination,
      },
      onSortingChange: setSorting,
      onGlobalFilterChange: onSearchChange
        ? undefined
        : (updater) => {
            const next =
              typeof updater === "function" ? updater(activeSearch) : updater;
            setInternalSearch(String(next ?? ""));
            setClientPagination((prev) => ({ ...prev, pageIndex: 0 }));
          },
      onPaginationChange: serverMode ? undefined : setClientPagination,
    },
    (state) => ({
      sorting: state.sorting,
      globalFilter: state.globalFilter,
      pagination: state.pagination,
    })
  );

  const rows = table.getRowModel().rows;
  const currentPage = serverMode
    ? pagination.page
    : table.state.pagination.pageIndex + 1;
  const totalPages = serverMode
    ? Math.max(1, pagination.totalPages)
    : Math.max(1, table.getPageCount());
  const totalItems = serverMode ? pagination.totalItems : table.getRowCount();

  const canPrev = serverMode ? currentPage > 1 : table.getCanPreviousPage();
  const canNext = serverMode
    ? currentPage < totalPages
    : table.getCanNextPage();

  const handlePrevPage = () => {
    if (!canPrev) return;
    if (serverMode) {
      pagination.onPageChange?.(currentPage - 1);
    } else {
      table.previousPage();
    }
  };

  const handleNextPage = () => {
    if (!canNext) return;
    if (serverMode) {
      pagination.onPageChange?.(currentPage + 1);
    } else {
      table.nextPage();
    }
  };

  const handleSearchInput = (nextValue: string) => {
    if (onSearchChange) {
      onSearchChange(nextValue);
    } else {
      setInternalSearch(nextValue);
      setClientPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {(showSearch || toolbarSlot) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {showSearch ? (
            <div className="relative w-full sm:max-w-xs">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={activeSearch}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-8 bg-card"
                aria-label={searchPlaceholder}
              />
            </div>
          ) : (
            <div />
          )}
          {toolbarSlot ? (
            <div className="flex flex-wrap items-center gap-2">
              {toolbarSlot}
            </div>
          ) : null}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1.5 rounded py-1 text-left transition-colors hover:text-foreground"
                        >
                          <table.FlexRender header={header} />
                          {sorted === "asc" ? (
                            <ArrowUp className="size-3.5 text-primary" />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="size-3.5 text-primary" />
                          ) : (
                            <ArrowUpDown className="size-3.5 opacity-40" />
                          )}
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rowIdx) => (
                <TableRow key={`skeleton-${rowIdx}`} className="hover:bg-transparent">
                  {columns.map((_, colIdx) => (
                    <TableCell key={`skeleton-cell-${rowIdx}-${colIdx}`}>
                      <Skeleton className="h-5 w-full max-w-[180px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={
                    onRowClick ? () => onRowClick(row.original) : undefined
                  }
                  className={cn(
                    onRowClick &&
                      "cursor-pointer transition-colors hover:bg-muted/60"
                  )}
                >
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={Math.max(1, columns.length)}
                  className="p-6"
                >
                  {emptyState ?? (
                    <EmptyState
                      title="Belum ada data"
                      description="Data akan muncul di sini setelah tersedia atau sesuai filter yang dipilih."
                      className="border-0 bg-transparent py-8"
                    />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && (totalItems > 0 || currentPage > 1) ? (
        <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <div>
            Menampilkan{" "}
            <span className="font-medium text-foreground">{rows.length}</span>{" "}
            dari{" "}
            <span className="font-medium text-foreground">{totalItems}</span>{" "}
            item
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={!canPrev}
            >
              <ChevronLeft className="size-3.5" />
              <span>Sebelumnya</span>
            </Button>
            <span className="px-1 font-mono text-xs text-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!canNext}
            >
              <span>Berikutnya</span>
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
