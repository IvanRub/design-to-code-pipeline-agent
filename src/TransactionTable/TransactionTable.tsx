import React, { useEffect, useRef } from 'react';
import { Alert, Skeleton, Icon, Select, Button, FormField } from '@acme/ui';
import styles from './TransactionTable.module.css';

export type SortColumn = 'date' | 'amount' | 'status' | 'merchant' | 'paymentMethod';
export type SortDirection = 'ascending' | 'descending';
export type PageSize = 25 | 50 | 100;
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type TableState = 'default' | 'loading' | 'empty' | 'error';

export interface TransactionRow {
  id: string;
  date: string;
  amount: number;
  status: TransactionStatus;
  merchant: string;
  paymentMethod: string;
}

export interface TransactionTableProps {
  state: TableState;
  rows: TransactionRow[];
  totalRows: number;
  page: number;
  pageSize: PageSize;
  sortColumn: SortColumn | null;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: PageSize) => void;
  onRowClick: (row: TransactionRow) => void;
  errorMessage?: string;
  caption?: string;
}

const COLUMNS: Array<{ key: SortColumn; label: string }> = [
  { key: 'date', label: 'Date' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status' },
  { key: 'merchant', label: 'Merchant' },
  { key: 'paymentMethod', label: 'Payment Method' },
];

const PAGE_SIZE_OPTIONS = [
  { label: '25', value: '25' },
  { label: '50', value: '50' },
  { label: '100', value: '100' },
];

function getSortButtonAriaLabel(
  columnLabel: string,
  isActive: boolean,
  direction: SortDirection,
): string {
  if (isActive) {
    const opposite = direction === 'ascending' ? 'descending' : 'ascending';
    return `${columnLabel}, sorted ${direction}, activate to sort ${opposite}`;
  }
  return `${columnLabel}, activate to sort ascending`;
}

function getSortIconName(isActive: boolean, direction: SortDirection): string {
  if (!isActive) return 'chevrons-up-down';
  return direction === 'ascending' ? 'chevron-up' : 'chevron-down';
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function buildStatusMessage(
  tableState: TableState,
  rows: TransactionRow[],
  page: number,
  pageSize: PageSize,
  totalRows: number,
  sortColumn: SortColumn | null,
  sortDirection: SortDirection,
): string {
  if (tableState === 'loading') return 'Loading transactions';
  if (tableState === 'error') return '';
  if (tableState === 'empty' || rows.length === 0) return 'No transactions found';

  const startRow = (page - 1) * pageSize + 1;
  const endRow = Math.min(page * pageSize, totalRows);
  const sortPart = sortColumn
    ? `, sorted by ${sortColumn} ${sortDirection}`
    : '';
  return `Showing ${startRow} to ${endRow} of ${totalRows} transactions${sortPart}`;
}

/** TransactionTable — financial transaction history table covering default, row-hover, sort-active, sort-inactive, loading, empty, error, and paginated states. */
export function TransactionTable({
  state,
  rows,
  totalRows,
  page,
  pageSize,
  sortColumn,
  sortDirection,
  onSort,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  errorMessage,
  caption = 'Transaction history',
}: TransactionTableProps): React.ReactElement {
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const prevStateRef = useRef<TableState>(state);

  const statusMessage = buildStatusMessage(
    state,
    rows,
    page,
    pageSize,
    totalRows,
    sortColumn,
    sortDirection,
  );

  // Update the live region on state/sort/page transitions
  useEffect(() => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = statusMessage;
    }
    prevStateRef.current = state;
  }, [statusMessage, state]);

  const isLoading = state === 'loading';
  const isError = state === 'error';
  const isEmpty = state === 'empty' || (state === 'default' && rows.length === 0);
  const showPagination = totalRows > pageSize && !isLoading && !isError && !isEmpty;

  const totalPages = Math.ceil(totalRows / pageSize);
  const isFirstPage = page === 1;
  const isLastPage = page * pageSize >= totalRows;

  function handleRowKeyDown(e: React.KeyboardEvent<HTMLTableRowElement>, row: TransactionRow): void {
    if (e.key === 'Enter') {
      onRowClick(row);
    }
  }

  function handlePageSizeChange(value: string): void {
    const parsed = parseInt(value, 10) as PageSize;
    if (parsed === 25 || parsed === 50 || parsed === 100) {
      onPageSizeChange(parsed);
    }
  }

  const sortButtonsDisabled = isLoading || isError;

  return (
    <div className={styles.container}>
      {/* Visually-hidden live region for screen-reader announcements */}
      <div
        ref={liveRegionRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={styles.srOnly}
      />

      {/* Error alert rendered above table */}
      {isError && (
        <Alert
          tone="error"
          role="alert"
          title={errorMessage ?? 'Failed to load transactions. Please try again.'}
        />
      )}

      <div className={styles.tableWrapper}>
        <table
          className={styles.table}
          aria-busy={isLoading ? 'true' : 'false'}
        >
          <caption className={styles.caption}>{caption}</caption>
          <colgroup>
            <col className={styles.colDate} />
            <col className={styles.colAmount} />
            <col className={styles.colStatus} />
            <col className={styles.colMerchant} />
            <col className={styles.colPaymentMethod} />
          </colgroup>
          <thead>
            <tr>
              {COLUMNS.map((col) => {
                const isActive = sortColumn === col.key;
                const ariaSortValue = isActive ? sortDirection : 'none';
                const buttonAriaLabel = getSortButtonAriaLabel(col.label, isActive, sortDirection);
                const iconName = getSortIconName(isActive, sortDirection);
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={ariaSortValue}
                    className={`${styles.th} ${isActive ? styles.thActive : styles.thInactive}`}
                  >
                    <button
                      type="button"
                      className={`${styles.sortButton} ${isActive ? styles.sortButtonActive : ''}`}
                      aria-label={buttonAriaLabel}
                      onClick={() => onSort(col.key)}
                      disabled={sortButtonsDisabled}
                    >
                      <span className={styles.sortButtonText}>{col.label}</span>
                      <Icon
                        name={iconName}
                        size={14}
                        aria-hidden={true}
                      />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Loading state: skeleton rows */}
          {isLoading && (
            <tbody>
              {Array.from({ length: pageSize }).map((_, idx) => (
                <tr key={idx} className={styles.skeletonRow}>
                  {COLUMNS.map((col) => (
                    <td key={col.key} className={styles.td}>
                      <Skeleton width="100%" height="20px" radius="sm" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}

          {/* Empty state */}
          {!isLoading && !isError && isEmpty && (
            <tbody>
              <tr>
                <td colSpan={5} className={styles.emptyCell}>
                  No transactions found
                </td>
              </tr>
            </tbody>
          )}

          {/* Data rows */}
          {!isLoading && !isError && !isEmpty && (
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={styles.dataRow}
                  tabIndex={0}
                  onClick={() => onRowClick(row)}
                  onKeyDown={(e) => handleRowKeyDown(e, row)}
                  aria-label={`View details for ${formatAmount(row.amount)} transaction at ${row.merchant} on ${row.date}`}
                >
                  <td className={styles.td}>{row.date}</td>
                  <td className={styles.td}>{formatAmount(row.amount)}</td>
                  <td className={styles.td}>
                    <span className={`${styles.badge} ${styles[`badge_${row.status}`]}`}>
                      {capitalize(row.status)}
                    </span>
                  </td>
                  <td className={`${styles.td} ${styles.truncateCell}`} title={row.merchant}>
                    {row.merchant}
                  </td>
                  <td className={`${styles.td} ${styles.truncateCell}`} title={row.paymentMethod}>
                    {row.paymentMethod}
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <nav aria-label="Pagination" className={styles.pagination}>
          <div className={styles.paginationNav}>
            <Button
              variant="secondary"
              size="sm"
              aria-label="Previous page"
              disabled={isFirstPage}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>

            <span
              className={styles.pageIndicator}
              aria-current="page"
            >
              Page {page} of {totalPages}
            </span>

            <Button
              variant="secondary"
              size="sm"
              aria-label="Next page"
              disabled={isLastPage}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>

          <div className={styles.paginationSizeWrapper}>
            <FormField label="Rows per page" htmlFor="pageSize">
              <Select
                options={PAGE_SIZE_OPTIONS}
                disabled={false}
              />
            </FormField>
          </div>
        </nav>
      )}
    </div>
  );
}
