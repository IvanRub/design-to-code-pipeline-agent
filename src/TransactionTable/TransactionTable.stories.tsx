import type { Meta, StoryObj } from '@storybook/react';
import { TransactionTable } from './TransactionTable';
import type { TransactionRow } from './TransactionTable';

const meta: Meta<typeof TransactionTable> = {
  title: 'Components/TransactionTable',
  component: TransactionTable,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof TransactionTable>;

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
    merchant: 'Beta Supplies Ltd',
    paymentMethod: 'Mastercard **** 1234',
  },
  {
    id: '3',
    date: '2026-06-03',
    amount: 200.0,
    status: 'failed',
    merchant: 'Gamma Goods International',
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

const defaultArgs = {
  rows: sampleRows,
  totalRows: sampleRows.length,
  page: 1,
  pageSize: 25 as const,
  sortColumn: null,
  sortDirection: 'ascending' as const,
  onSort: () => {},
  onPageChange: () => {},
  onPageSizeChange: () => {},
  onRowClick: () => {},
};

/** default — table with data rows, no active sort */
export const Default: Story = {
  name: 'default',
  args: {
    ...defaultArgs,
    state: 'default',
  },
};

/** row-hover — visual state (CSS :hover); story shows the table in normal state with a note */
export const RowHover: Story = {
  name: 'row-hover',
  args: {
    ...defaultArgs,
    state: 'default',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Hover over any data row to see the hover highlight. This is a CSS-only state triggered by :hover on <tr>.',
      },
    },
  },
};

/** sort-active — date column is the active sorted column */
export const SortActive: Story = {
  name: 'sort-active',
  args: {
    ...defaultArgs,
    state: 'default',
    sortColumn: 'date',
    sortDirection: 'ascending',
  },
};

/** sort-inactive — amount column is rendered without active sort (date is the active sort) */
export const SortInactive: Story = {
  name: 'sort-inactive',
  args: {
    ...defaultArgs,
    state: 'default',
    sortColumn: 'date',
    sortDirection: 'ascending',
  },
  parameters: {
    docs: {
      description: {
        story:
          'The "Amount", "Status", "Merchant", and "Payment Method" headers are in sort-inactive state while "Date" is sort-active.',
      },
    },
  },
};

/** loading — skeleton rows; sort buttons disabled; aria-busy=true */
export const Loading: Story = {
  name: 'loading',
  args: {
    ...defaultArgs,
    state: 'loading',
    rows: [],
    totalRows: 0,
  },
};

/** empty — no transactions found message */
export const Empty: Story = {
  name: 'empty',
  args: {
    ...defaultArgs,
    state: 'empty',
    rows: [],
    totalRows: 0,
  },
};

/** error — Alert rendered above table with error message */
export const Error: Story = {
  name: 'error',
  args: {
    ...defaultArgs,
    state: 'error',
    rows: [],
    totalRows: 0,
    errorMessage: 'Failed to load transactions. Please try again.',
  },
};

/** paginated — pagination controls shown when totalRows > pageSize */
export const Paginated: Story = {
  name: 'paginated',
  args: {
    ...defaultArgs,
    state: 'default',
    totalRows: 200,
    page: 2,
    pageSize: 25,
    sortColumn: 'date',
    sortDirection: 'descending',
  },
};
