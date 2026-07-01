import type { Meta, StoryObj } from '@storybook/react';
import { PaymentCard } from './PaymentCard';

const meta: Meta<typeof PaymentCard> = {
  title: 'Components/PaymentCard',
  component: PaymentCard,
};

export default meta;
type Story = StoryObj<typeof PaymentCard>;

const noop = () => {};

export const Default: Story = {
  args: {
    state: 'default',
    brand: 'visa',
    last4: '4242',
    expiryMonth: '08',
    expiryYear: '27',
    cardholderName: 'Jane Doe',
    isSelected: false,
    onSelect: noop,
    onDeleteRequest: noop,
    onDeleteConfirm: noop,
    onDeleteCancel: noop,
  },
};

export const Selected: Story = {
  args: {
    state: 'selected',
    brand: 'mastercard',
    last4: '1881',
    expiryMonth: '11',
    expiryYear: '28',
    cardholderName: 'Jane Doe',
    isSelected: true,
    onSelect: noop,
    onDeleteRequest: noop,
    onDeleteConfirm: noop,
    onDeleteCancel: noop,
  },
};

export const Loading: Story = {
  args: {
    state: 'loading',
    isSelected: false,
    onDeleteRequest: noop,
    onDeleteConfirm: noop,
    onDeleteCancel: noop,
  },
};

export const Empty: Story = {
  args: {
    state: 'empty',
    isSelected: false,
    onDeleteRequest: noop,
    onDeleteConfirm: noop,
    onDeleteCancel: noop,
    onAddCard: noop,
  },
};

export const ErrorState: Story = {
  args: {
    state: 'error',
    brand: 'amex',
    last4: '0005',
    expiryMonth: '02',
    expiryYear: '26',
    cardholderName: 'Jane Doe',
    isSelected: false,
    errorMessage: 'Failed to load card details. Please retry.',
    onDeleteRequest: noop,
    onDeleteConfirm: noop,
    onDeleteCancel: noop,
  },
};
