import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TransactionTable, type Transaction } from './TransactionTable';

expect.extend(toHaveNoViolations);

const transactions: Transaction[] = [
  {
    id: 'txn_1',
    date: '2026-06-01',
    amount: 42.5,
    status: 'completed',
    merchant: 'Coffee Roasters',
    paymentMethod: 'Visa •••• 4242',
  },
  {
    id: 'txn_2',
    date: '2026-06-03',
    amount: 129.99,
    status: 'pending',
    merchant: 'Cloud Hosting Co',
    paymentMethod: 'Mastercard •••• 1881',
  },
  {
    id: 'txn_3',
    date: '2026-06-05',
    amount: 15.0,
    status: 'failed',
    merchant: 'Streaming Plus',
    paymentMethod: 'Visa •••• 4242',
  },
  {
    id: 'txn_4',
    date: '2026-06-06',
    amount: 60.0,
    status: 'refunded',
    merchant: 'Office Supplies Inc',
    paymentMethod: 'Amex •••• 1005',
  },
];

const noop = () => {};

const baseProps = {
  page: 1,
  pageSize: 25 as const,
  totalCount: transactions.length,
  onPageChange: noop,
  onPageSizeChange: noop,
};

describe('TransactionTable', () => {
  it('renders the default state as a native table with rows', () => {
    render(<TransactionTable {...baseProps} transactions={transactions} state="idle" />);

    const table = screen.getByRole('table', { name: 'Transactions' });
    expect(table).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(5);
    expect(screen.getByText('Coffee Roasters')).toBeInTheDocument();
  });

  it('renders the sorted state with aria-sort and an accessible sort button', () => {
    render(
      <TransactionTable
        {...baseProps}
        transactions={transactions}
        state="idle"
        sortColumn="amount"
        sortDirection="ascending"
        onSortChange={noop}
      />,
    );

    const amountHeader = screen.getByRole('columnheader', { name: /amount/i });
    expect(amountHeader).toHaveAttribute('aria-sort', 'ascending');
    expect(
      screen.getByRole('button', { name: /amount, sorted ascending, activate to sort descending/i }),
    ).toBeInTheDocument();
  });

  it('renders the paginated state with a Pagination nav and disables bounds correctly', () => {
    render(
      <TransactionTable
        {...baseProps}
        transactions={transactions}
        state="idle"
        page={2}
        pageSize={25}
        totalCount={120}
      />,
    );

    const nav = screen.getByRole('navigation', { name: 'Pagination' });
    expect(within(nav).getByRole('button', { name: 'Previous page' })).toBeEnabled();
    expect(within(nav).getByRole('button', { name: 'Next page' })).toBeEnabled();
    expect(within(nav).getByText('Page 2 of 5')).toBeInTheDocument();
  });

  it('renders the status:pending chip with text label', () => {
    render(
      <TransactionTable {...baseProps} transactions={[transactions[1]]} totalCount={1} state="idle" />,
    );
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders the status:completed chip with text label', () => {
    render(
      <TransactionTable {...baseProps} transactions={[transactions[0]]} totalCount={1} state="idle" />,
    );
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders the status:failed chip with text label', () => {
    render(
      <TransactionTable {...baseProps} transactions={[transactions[2]]} totalCount={1} state="idle" />,
    );
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('renders the status:refunded chip with text label', () => {
    render(
      <TransactionTable {...baseProps} transactions={[transactions[3]]} totalCount={1} state="idle" />,
    );
    expect(screen.getByText('Refunded')).toBeInTheDocument();
  });

  it('renders row-clickable rows that are keyboard operable', async () => {
    const user = userEvent.setup();
    const handleRowClick = vi.fn();
    render(
      <TransactionTable
        {...baseProps}
        transactions={transactions}
        state="idle"
        onRowClick={handleRowClick}
      />,
    );

    const row = screen.getByRole('button', { name: /transaction on .*coffee.*|transaction on .*completed.*/i });
    row.focus();
    await user.keyboard('{Enter}');
    expect(handleRowClick).toHaveBeenCalledWith('txn_1');
  });

  it('renders the loading state with skeleton rows and an announced status', () => {
    render(<TransactionTable {...baseProps} transactions={[]} state="loading" />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading transactions');
  });

  it('renders the empty state with a plain-text message and no error styling', () => {
    render(<TransactionTable {...baseProps} transactions={[]} totalCount={0} state="empty" />);
    expect(screen.getByText('No transactions match your filters')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders the error state using the Alert primitive with role="alert"', () => {
    render(
      <TransactionTable
        {...baseProps}
        transactions={[]}
        state="error"
        errorMessage="Could not load transactions."
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load transactions.');
  });

  it('has no detectable accessibility violations (axe smoke test)', async () => {
    const { container } = render(
      <TransactionTable {...baseProps} transactions={transactions} state="idle" onRowClick={noop} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
