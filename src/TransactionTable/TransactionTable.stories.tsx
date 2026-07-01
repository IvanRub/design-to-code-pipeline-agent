import type { Meta, StoryObj } from '@storybook/react';
import { TransactionTable, type Transaction } from './TransactionTable';

const meta: Meta<typeof TransactionTable> = {
  title: 'Components/TransactionTable',
  component: TransactionTable,
};

export default meta;
type Story = StoryObj<typeof TransactionTable>;

const baseTransactions: Transaction[] = [
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

export const Default: Story = {
  args: {
    transactions: baseTransactions,
    page: 1,
    pageSize: 25,
    totalCount: baseTransactions.length,
    onPageChange: noop,
    onPageSizeChange: noop,
    state: 'idle',
  },
};

export const Sorted: Story = {
  args: {
    ...Default.args,
    sortColumn: 'amount',
    sortDirection: 'ascending',
    onSortChange: noop,
  },
};

export const Paginated: Story = {
  args: {
    ...Default.args,
    page: 2,
    pageSize: 25,
    totalCount: 120,
  },
};

export const StatusPending: Story = {
  name: 'status:pending',
  args: {
    ...Default.args,
    transactions: [baseTransactions[1]],
    totalCount: 1,
  },
};

export const StatusCompleted: Story = {
  name: 'status:completed',
  args: {
    ...Default.args,
    transactions: [baseTransactions[0]],
    totalCount: 1,
  },
};

export const StatusFailed: Story = {
  name: 'status:failed',
  args: {
    ...Default.args,
    transactions: [baseTransactions[2]],
    totalCount: 1,
  },
};

export const StatusRefunded: Story = {
  name: 'status:refunded',
  args: {
    ...Default.args,
    transactions: [baseTransactions[3]],
    totalCount: 1,
  },
};

export const RowClickable: Story = {
  name: 'row-clickable',
  args: {
    ...Default.args,
    onRowClick: noop,
  },
};

export const Loading: Story = {
  args: {
    ...Default.args,
    transactions: [],
    state: 'loading',
  },
};

export const Empty: Story = {
  args: {
    ...Default.args,
    transactions: [],
    totalCount: 0,
    state: 'empty',
  },
};

export const ErrorState: Story = {
  name: 'error',
  args: {
    ...Default.args,
    transactions: [],
    state: 'error',
    errorMessage: 'We could not load your transactions. Please try again.',
  },
};
