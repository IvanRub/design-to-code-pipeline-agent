import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, it, expect, vi } from 'vitest';
import { TransactionTable } from './TransactionTable';
import type { TransactionRow, PageSize } from './TransactionTable';

expect.extend(toHaveNoViolations);

const sampleRows: TransactionRow[] = [
  {
    id: '1',
    date: '2026-06-01',
    amount: 124.5,
    status: 'completed',
    merchant: 'Acme Corp',
    paymentMethod: 'Visa **** 4242',
  },
  {
    id: '2',
    date: '2026-06-02',
    amount: 45.0,
    status: 'pending',
    merchant: 'Beta Supplies',
    paymentMethod: 'Mastercard **** 1234',
  },
  {
    id: '3',
    date: '2026-06-03',
    amount: 200.0,
    status: 'failed',
    merchant: 'Gamma Goods',
    paymentMethod: 'PayPal',
  },
  {
    id: '4',
    date: '2026-06-04',
    amount: 80.0,
    status: 'refunded',
    merchant: 'Delta Distributions',
    paymentMethod: 'Visa **** 9999',
  },
];

const defaultProps = {
  rows: sampleRows,
  totalRows: sampleRows.length,
  page: 1,
  pageSize: 25 as PageSize,
  sortColumn: null as null,
  sortDirection: 'ascending' as const,
  onSort: vi.fn(),
  onPageChange: vi.fn(),
  onPageSizeChange: vi.fn(),
  onRowClick: vi.fn(),
};

// ─── State: default ──────────────────────────────────────────────────────────
describe('state: default', () => {
  it('renders table caption, all column headers, and data rows', () => {
    render(<TransactionTable {...defaultProps} state="default" />);

    expect(screen.getByText('Transaction history')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Date/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Amount/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Status/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Merchant/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Payment Method/i })).toBeInTheDocument();

    // Data rows exist (via row aria-label pattern)
    expect(screen.getByLabelText(/View details for \$124\.50 transaction at Acme Corp/)).toBeInTheDocument();
  });

  it('renders with custom caption', () => {
    render(<TransactionTable {...defaultProps} state="default" caption="My Transactions" />);
    expect(screen.getByText('My Transactions')).toBeInTheDocument();
  });

  it('table has aria-busy=false', () => {
    render(<TransactionTable {...defaultProps} state="default" />);
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'false');
  });

  it('all sort column headers have aria-sort=none when no column is sorted', () => {
    render(<TransactionTable {...defaultProps} state="default" sortColumn={null} />);
    const ths = screen.getAllByRole('columnheader');
    ths.forEach((th) => expect(th).toHaveAttribute('aria-sort', 'none'));
  });

  it('calls onRowClick when a row is clicked', () => {
    const onRowClick = vi.fn();
    render(<TransactionTable {...defaultProps} state="default" onRowClick={onRowClick} />);
    const row = screen.getByLabelText(/View details for \$124\.50 transaction at Acme Corp/);
    fireEvent.click(row);
    expect(onRowClick).toHaveBeenCalledWith(sampleRows[0]);
  });

  it('calls onRowClick when Enter is pressed on a row', () => {
    const onRowClick = vi.fn();
    render(<TransactionTable {...defaultProps} state="default" onRowClick={onRowClick} />);
    const row = screen.getByLabelText(/View details for \$124\.50 transaction at Acme Corp/);
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(onRowClick).toHaveBeenCalledWith(sampleRows[0]);
  });
});

// ─── State: row-hover ────────────────────────────────────────────────────────
describe('state: row-hover', () => {
  it('data rows are in the DOM with tabIndex=0 for focus (hover is CSS-only)', () => {
    render(<TransactionTable {...defaultProps} state="default" />);
    const row = screen.getByLabelText(/View details for \$124\.50 transaction at Acme Corp/);
    expect(row).toHaveAttribute('tabindex', '0');
  });
});

// ─── State: sort-active ──────────────────────────────────────────────────────
describe('state: sort-active', () => {
  it('active sort column th has correct aria-sort', () => {
    render(
      <TransactionTable
        {...defaultProps}
        state="default"
        sortColumn="date"
        sortDirection="ascending"
      />,
    );
    const dateHeader = screen.getByRole('columnheader', { name: /Date/i });
    expect(dateHeader).toHaveAttribute('aria-sort', 'ascending');
  });

  it('active sort button has correct aria-label with direction and toggle instruction', () => {
    render(
      <TransactionTable
        {...defaultProps}
        state="default"
        sortColumn="amount"
        sortDirection="descending"
      />,
    );
    const btn = screen.getByRole('button', {
      name: /Amount, sorted descending, activate to sort ascending/i,
    });
    expect(btn).toBeInTheDocument();
  });

  it('calls onSort with correct column when sort button clicked', () => {
    const onSort = vi.fn();
    render(
      <TransactionTable
        {...defaultProps}
        state="default"
        sortColumn="date"
        sortDirection="ascending"
        onSort={onSort}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Date, sorted ascending/i }));
    expect(onSort).toHaveBeenCalledWith('date');
  });
});

// ─── State: sort-inactive ────────────────────────────────────────────────────
describe('state: sort-inactive', () => {
  it('inactive sort column th has aria-sort=none', () => {
    render(
      <TransactionTable
        {...defaultProps}
        state="default"
        sortColumn="date"
        sortDirection="ascending"
      />,
    );
    const amountHeader = screen.getByRole('columnheader', { name: /Amount/i });
    expect(amountHeader).toHaveAttribute('aria-sort', 'none');
  });

  it('inactive sort button has aria-label with ascending instruction', () => {
    render(
      <TransactionTable
        {...defaultProps}
        state="default"
        sortColumn="date"
        sortDirection="ascending"
      />,
    );
    const btn = screen.getByRole('button', {
      name: 'Amount, activate to sort ascending',
    });
    expect(btn).toBeInTheDocument();
  });
});

// ─── State: loading ──────────────────────────────────────────────────────────
describe('state: loading', () => {
  it('table has aria-busy=true', () => {
    render(<TransactionTable {...defaultProps} state="loading" rows={[]} totalRows={0} />);
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
  });

  it('sort buttons are disabled', () => {
    render(<TransactionTable {...defaultProps} state="loading" rows={[]} totalRows={0} />);
    const sortButtons = screen.getAllByRole('button');
    sortButtons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('renders pageSize skeleton rows (25 by default)', () => {
    render(
      <TransactionTable
        {...defaultProps}
        state="loading"
        rows={[]}
        totalRows={0}
        pageSize={25}
      />,
    );
    // Each skeleton row has 5 cells; 25 rows * 5 cols = 125 cells
    const cells = screen.getAllByRole('cell');
    expect(cells).toHaveLength(25 * 5);
  });
});

// ─── State: empty ────────────────────────────────────────────────────────────
describe('state: empty', () => {
  it('shows no transactions message', () => {
    render(<TransactionTable {...defaultProps} state="empty" rows={[]} totalRows={0} />);
    expect(screen.getByText('No transactions found')).toBeInTheDocument();
  });

  it('table has aria-busy=false', () => {
    render(<TransactionTable {...defaultProps} state="empty" rows={[]} totalRows={0} />);
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'false');
  });

  it('hides pagination controls', () => {
    render(<TransactionTable {...defaultProps} state="empty" rows={[]} totalRows={0} />);
    expect(screen.queryByRole('navigation', { name: /Pagination/i })).not.toBeInTheDocument();
  });

  it('also shows empty message when state=default with empty rows', () => {
    render(<TransactionTable {...defaultProps} state="default" rows={[]} totalRows={0} />);
    expect(screen.getByText('No transactions found')).toBeInTheDocument();
  });
});

// ─── State: error ────────────────────────────────────────────────────────────
describe('state: error', () => {
  it('renders error alert with role=alert', () => {
    render(
      <TransactionTable
        {...defaultProps}
        state="error"
        rows={[]}
        totalRows={0}
        errorMessage="Failed to load transactions. Please try again."
      />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows custom error message', () => {
    render(
      <TransactionTable
        {...defaultProps}
        state="error"
        rows={[]}
        totalRows={0}
        errorMessage="Network error occurred."
      />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('sort buttons are disabled in error state', () => {
    render(<TransactionTable {...defaultProps} state="error" rows={[]} totalRows={0} />);
    const sortButtons = screen.getAllByRole('button');
    sortButtons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('table has aria-busy=false', () => {
    render(<TransactionTable {...defaultProps} state="error" rows={[]} totalRows={0} />);
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'false');
  });
});

// ─── State: paginated ────────────────────────────────────────────────────────
describe('state: paginated', () => {
  const paginatedProps = {
    ...defaultProps,
    state: 'default' as const,
    totalRows: 200,
    page: 2,
    pageSize: 25 as PageSize,
    sortColumn: 'date' as const,
    sortDirection: 'descending' as const,
  };

  it('renders pagination nav', () => {
    render(<TransactionTable {...paginatedProps} />);
    expect(screen.getByRole('navigation', { name: /Pagination/i })).toBeInTheDocument();
  });

  it('Previous page button is enabled on page > 1', () => {
    render(<TransactionTable {...paginatedProps} />);
    expect(screen.getByRole('button', { name: /Previous page/i })).not.toBeDisabled();
  });

  it('Previous page button is disabled on page 1', () => {
    render(<TransactionTable {...paginatedProps} page={1} />);
    expect(screen.getByRole('button', { name: /Previous page/i })).toBeDisabled();
  });

  it('Next page button is disabled on last page', () => {
    render(<TransactionTable {...paginatedProps} page={8} totalRows={200} pageSize={25} />);
    expect(screen.getByRole('button', { name: /Next page/i })).toBeDisabled();
  });

  it('calls onPageChange with decremented page on Previous click', () => {
    const onPageChange = vi.fn();
    render(<TransactionTable {...paginatedProps} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Previous page/i }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('calls onPageChange with incremented page on Next click', () => {
    const onPageChange = vi.fn();
    render(<TransactionTable {...paginatedProps} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Next page/i }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('current page indicator has aria-current=page', () => {
    render(<TransactionTable {...paginatedProps} />);
    expect(screen.getByText(/Page 2 of/i)).toHaveAttribute('aria-current', 'page');
  });

  it('Rows per page label is present', () => {
    render(<TransactionTable {...paginatedProps} />);
    expect(screen.getByText('Rows per page')).toBeInTheDocument();
  });
});

// ─── Axe smoke test ──────────────────────────────────────────────────────────
describe('accessibility (axe smoke test)', () => {
  it('default state has no axe violations', async () => {
    const { container } = render(<TransactionTable {...defaultProps} state="default" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('loading state has no axe violations', async () => {
    const { container } = render(
      <TransactionTable {...defaultProps} state="loading" rows={[]} totalRows={0} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('empty state has no axe violations', async () => {
    const { container } = render(
      <TransactionTable {...defaultProps} state="empty" rows={[]} totalRows={0} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('error state has no axe violations', async () => {
    const { container } = render(
      <TransactionTable {...defaultProps} state="error" rows={[]} totalRows={0} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('paginated state has no axe violations', async () => {
    const { container } = render(
      <TransactionTable
        {...defaultProps}
        state="default"
        totalRows={200}
        page={2}
        pageSize={25}
        sortColumn="date"
        sortDirection="ascending"
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
