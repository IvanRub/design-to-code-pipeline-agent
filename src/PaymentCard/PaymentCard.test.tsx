import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PaymentCard } from './PaymentCard';

expect.extend(toHaveNoViolations);

const noop = () => {};

describe('PaymentCard', () => {
  it('default state renders an unchecked radio card with visible card details', () => {
    render(
      <PaymentCard
        state="default"
        brand="visa"
        last4="4242"
        expiryMonth="08"
        expiryYear="27"
        cardholderName="Jane Doe"
        isSelected={false}
        onSelect={noop}
        onDeleteRequest={noop}
        onDeleteConfirm={noop}
        onDeleteCancel={noop}
      />
    );

    const radio = screen.getByRole('radio', { name: /card ending in 4242/i });
    expect(radio).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('button', { name: /delete card ending in 4242/i })).toBeInTheDocument();
  });

  it('selected state marks the radio as checked and shows a selected indicator', () => {
    render(
      <PaymentCard
        state="selected"
        brand="mastercard"
        last4="1881"
        cardholderName="Jane Doe"
        isSelected
        onSelect={noop}
        onDeleteRequest={noop}
        onDeleteConfirm={noop}
        onDeleteCancel={noop}
      />
    );

    const radio = screen.getByRole('radio', { name: /card ending in 1881/i });
    expect(radio).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByLabelText('Selected')).toBeInTheDocument();
  });

  it('loading state announces a status region and hides skeleton internals', () => {
    render(
      <PaymentCard
        state="loading"
        isSelected={false}
        onDeleteRequest={noop}
        onDeleteConfirm={noop}
        onDeleteCancel={noop}
      />
    );

    expect(screen.getByRole('status', { name: /loading payment card/i })).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('empty state shows a neutral message and an Add card button', () => {
    const onAddCard = vi.fn();
    render(
      <PaymentCard
        state="empty"
        isSelected={false}
        onDeleteRequest={noop}
        onDeleteConfirm={noop}
        onDeleteCancel={noop}
        onAddCard={onAddCard}
      />
    );

    expect(screen.getByText('No saved payment method')).toBeInTheDocument();
    const addButton = screen.getByRole('button', { name: /add card/i });
    addButton.click();
    expect(onAddCard).toHaveBeenCalledTimes(1);
  });

  it('error state surfaces an alert while preserving last-known card data', () => {
    render(
      <PaymentCard
        state="error"
        brand="amex"
        last4="0005"
        cardholderName="Jane Doe"
        isSelected={false}
        errorMessage="Failed to load card details. Please retry."
        onDeleteRequest={noop}
        onDeleteConfirm={noop}
        onDeleteCancel={noop}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/failed to load card details/i);
    expect(screen.getByLabelText(/card ending in 0005/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete card ending in 0005/i })).toBeInTheDocument();
  });

  it('has no axe accessibility violations', async () => {
    const { container } = render(
      <PaymentCard
        state="default"
        brand="visa"
        last4="4242"
        cardholderName="Jane Doe"
        isSelected={false}
        onSelect={noop}
        onDeleteRequest={noop}
        onDeleteConfirm={noop}
        onDeleteCancel={noop}
      />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
