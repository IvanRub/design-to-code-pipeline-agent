import { useMemo, type KeyboardEvent } from 'react';
import { Alert, Button, Icon, Select, Skeleton } from '@acme/ui';
import styles from './TransactionTable.module.css';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type SortColumn = 'date' | 'amount' | 'status' | 'merchant' | 'paymentMethod';
export type SortDirection = 'ascending' | 'descending' | 'none';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  status: TransactionStatus;
  merchant: string;
  paymentMethod: string;
}

export interface TransactionTableProps {
  transactions: Transaction[];
  sortColumn?: SortColumn | null;
  sortDirection?: SortDirection;
  onSortChange?: (column: string, direction: 'ascending' | 'descending') => void;
  page: number;
  pageSize: 25 | 50 | 100;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: 25 | 50 | 100) => void;
  onRowClick?: (transactionId: string) => void;
  state: 'idle' | 'loading' | 'empty' | 'error';
  errorMessage?: string;
  isRowNavigating?: boolean;
}

const COLUMNS: { key: SortColumn; label: string }[] = [
  { key: 'date', label: 'Date' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status' },
  { key: 'merchant', label: 'Merchant' },
  { key: 'paymentMethod', label: 'Payment method' },
];

const STATUS_LABEL: Record<TransactionStatus, string> = {
  pending: 'Pending',
  completed: 'Completed',
  failed: 'Failed',
  refunded: 'Refunded',
};

const PAGE_SIZE_OPTIONS = [
  { label: '25', value: '25' },
  { label: '50', value: '50' },
  { label: '100', value: '100' },
];

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(iso),
  );
}

function formatDateFull(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));
}

function nextSortDirection(
  column: SortColumn,
  sortColumn?: SortColumn | null,
  sortDirection?: SortDirection,
): 'ascending' | 'descending' {
  if (sortColumn === column && sortDirection === 'ascending') {
    return 'descending';
  }
  return 'ascending';
}

function sortButtonLabel(label: string, isActive: boolean, sortDirection?: SortDirection): string {
  if (!isActive || sortDirection === 'none' || sortDirection === undefined) {
    return `${label}, not sorted, activate to sort ascending`;
  }
  const nextDirection = sortDirection === 'ascending' ? 'descending' : 'ascending';
  return `${label}, sorted ${sortDirection}, activate to sort ${nextDirection}`;
}

function StatusChip({ status }: { status: TransactionStatus }) {
  const chipClass = {
    pending: styles.chipPending,
    completed: styles.chipCompleted,
    failed: styles.chipFailed,
    refunded: styles.chipRefunded,
  }[status];

  return <span className={`${styles.chip} ${chipClass}`}>{STATUS_LABEL[status]}</span>;
}

/**
 * Displays a fintech user's transaction history with sorting, pagination and
 * row-level navigation, covering idle/loading/empty/error states plus per-row
 * status badges.
 */
export function TransactionTable({
  transactions,
  sortColumn = null,
  sortDirection = 'none',
  onSortChange,
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  state,
  errorMessage,
  isRowNavigating = false,
}: TransactionTableProps) {
  // "empty" is reachable either via the explicit `state === 'empty'` prop value
  // or via `state === 'idle'` with a zero-length `transactions` array, per spec.
  const isEmpty = state === 'empty' || (state === 'idle' && transactions.length === 0);
  const isDefault = state === 'idle' && transactions.length > 0;
  const isSorted = sortColumn !== null && sortDirection !== 'none';
  const isPaginated = totalCount > pageSize;
  const isRowClickable = typeof onRowClick === 'function';

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  const liveMessage = useMemo(() => {
    if (state === 'loading') {
      return 'Loading transactions';
    }
    if (isSorted && sortColumn) {
      return `Sorted by ${sortColumn} ${sortDirection}`;
    }
    if (isPaginated) {
      return `Showing rows ${rangeStart}-${rangeEnd} of ${totalCount}`;
    }
    return '';
  }, [state, isSorted, sortColumn, sortDirection, isPaginated, rangeStart, rangeEnd, totalCount]);

  const handleSortClick = (column: SortColumn) => {
    if (!onSortChange) {
      return;
    }
    onSortChange(column, nextSortDirection(column, sortColumn, sortDirection));
  };

  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, transactionId: string) => {
    if (!isRowClickable || isRowNavigating) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onRowClick?.(transactionId);
    }
  };

  const rowAccessibleName = (transaction: Transaction) =>
    `Transaction on ${formatDateFull(transaction.date)}, ${formatAmount(transaction.amount)}, ${
      STATUS_LABEL[transaction.status]
    }, view details`;

  if (state === 'error') {
    return (
      <div className={styles.root}>
        <div className={styles.errorWrapper}>
          <Alert tone="error" role="alert" title="Unable to load transactions">
            {errorMessage ?? 'Something went wrong while loading transactions.'}
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.statusRegion} role="status" aria-live="polite">
        {liveMessage}
      </div>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <caption className={styles.visuallyHidden}>Transactions</caption>
          <thead>
            <tr>
              {COLUMNS.map((column) => {
                const isActiveColumn = sortColumn === column.key;
                const ariaSort = isActiveColumn && sortDirection !== 'none' ? sortDirection : 'none';
                return (
                  <th key={column.key} scope="col" aria-sort={ariaSort}>
                    {onSortChange ? (
                      <button
                        type="button"
                        className={styles.sortButton}
                        onClick={() => handleSortClick(column.key)}
                        aria-label={sortButtonLabel(column.label, isActiveColumn, sortDirection)}
                      >
                        <span aria-hidden="true">{column.label}</span>
                        {isActiveColumn && sortDirection !== 'none' && (
                          <Icon
                            name={sortDirection === 'ascending' ? 'arrow-up' : 'arrow-down'}
                            size={14}
                            aria-hidden
                          />
                        )}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {state === 'loading' &&
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={`skeleton-row-${rowIndex}`}>
                  {COLUMNS.map((column) => (
                    <td key={column.key}>
                      <Skeleton width="100%" height="16px" radius="sm" />
                    </td>
                  ))}
                </tr>
              ))}

            {isEmpty && (
              <tr>
                <td className={styles.emptyCell} colSpan={COLUMNS.length}>
                  No transactions match your filters
                </td>
              </tr>
            )}

            {isDefault &&
              transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className={isRowClickable ? styles.rowClickable : undefined}
                  role={isRowClickable ? 'button' : undefined}
                  tabIndex={isRowClickable ? 0 : undefined}
                  aria-disabled={isRowClickable && isRowNavigating ? 'true' : undefined}
                  aria-label={isRowClickable ? rowAccessibleName(transaction) : undefined}
                  onClick={
                    isRowClickable && !isRowNavigating ? () => onRowClick?.(transaction.id) : undefined
                  }
                  onKeyDown={
                    isRowClickable ? (event) => handleRowKeyDown(event, transaction.id) : undefined
                  }
                >
                  <td>
                    <span aria-hidden="true">{formatDateShort(transaction.date)}</span>
                    <span className={styles.visuallyHidden}>{formatDateFull(transaction.date)}</span>
                  </td>
                  <td>
                    <span aria-hidden="true">{formatAmount(transaction.amount)}</span>
                    <span className={styles.visuallyHidden}>
                      {transaction.amount.toFixed(2)} US dollars
                    </span>
                  </td>
                  <td>
                    <StatusChip status={transaction.status} />
                  </td>
                  <td>{transaction.merchant}</td>
                  <td>{transaction.paymentMethod}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {isPaginated && (
        <nav className={styles.pagination} aria-label="Pagination">
          <Button
            variant="ghost"
            size="sm"
            disabled={isFirstPage}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <Icon name="chevron-left" size={16} aria-hidden />
          </Button>
          <span aria-current="page" className={styles.pageIndicator}>
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={isLastPage}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <Icon name="chevron-right" size={16} aria-hidden />
          </Button>
          <label className={styles.pageSizeLabel} htmlFor="transaction-table-page-size">
            Rows per page
          </label>
          <Select
            options={PAGE_SIZE_OPTIONS}
            value={String(pageSize)}
            onChange={(value: string) => onPageSizeChange(Number(value) as 25 | 50 | 100)}
            id="transaction-table-page-size"
          />
        </nav>
      )}
    </div>
  );
}
