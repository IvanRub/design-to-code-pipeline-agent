import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PaymentCard } from './PaymentCard';

expect.extend(toHaveNoViolations);

// Shared fixture props
const baseProps = {
  brand: 'visa' as const,
  last4: '4242',
  expiry: '12/27',
  cardholderName: 'Jane Smith',
};

/**
 * Wraps PaymentCard in the required radiogroup container as specified in spec.accessibility.
 */
function renderInGroup(ui: React.ReactElement) {
  return render(
    <div role="radiogroup" aria-label="Saved payment methods">
      {ui}
    </div>,
  );
}

// ── Default state ─────────────────────────────────────────────────────────────

describe('Default state', () => {
  it('renders a radio element with aria-checked false', () => {
    renderInGroup(<PaymentCard {...baseProps} state="default" selected={false} />);
    const radio = screen.getByRole('radio', { name: /Visa card ending in 4242/i });
    expect(radio).toBeInTheDocument();
    expect(radio).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn();
    renderInGroup(
      <PaymentCard {...baseProps} state="default" selected={false} onSelect={onSelect} />,
    );
    const radio = screen.getByRole('radio', { name: /Visa card ending in 4242/i });
    fireEvent.click(radio);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('calls onSelect when Enter key pressed', () => {
    const onSelect = vi.fn();
    renderInGroup(
      <PaymentCard {...baseProps} state="default" selected={false} onSelect={onSelect} />,
    );
    const radio = screen.getByRole('radio', { name: /Visa card ending in 4242/i });
    fireEvent.keyDown(radio, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('calls onSelect when Space key pressed', () => {
    const onSelect = vi.fn();
    renderInGroup(
      <PaymentCard {...baseProps} state="default" selected={false} onSelect={onSelect} />,
    );
    const radio = screen.getByRole('radio', { name: /Visa card ending in 4242/i });
    fireEvent.keyDown(radio, { key: ' ' });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('masked number text is aria-hidden', () => {
    renderInGroup(<PaymentCard {...baseProps} state="default" selected={false} />);
    // The visual masked number span should carry aria-hidden
    const maskedSpan = document.querySelector('[aria-hidden="true"]');
    expect(maskedSpan).toBeInTheDocument();
  });

  it('delete button has accessible label', () => {
    renderInGroup(
      <PaymentCard {...baseProps} state="default" selected={false} onDelete={vi.fn()} />,
    );
    expect(
      screen.getByRole('button', { name: /Delete Visa card ending in 4242/i }),
    ).toBeInTheDocument();
  });

  it('delete button calls onDelete when clicked', () => {
    const onDelete = vi.fn();
    renderInGroup(
      <PaymentCard {...baseProps} state="default" selected={false} onDelete={onDelete} />,
    );
    const deleteBtn = screen.getByRole('button', { name: /Delete Visa card ending in 4242/i });
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});

// ── Selected state ────────────────────────────────────────────────────────────

describe('Selected state', () => {
  it('renders a radio element with aria-checked true', () => {
    renderInGroup(<PaymentCard {...baseProps} state="default" selected={true} />);
    const radio = screen.getByRole('radio', { name: /Visa card ending in 4242/i });
    expect(radio).toHaveAttribute('aria-checked', 'true');
  });

  it('selected card has tabIndex 0', () => {
    renderInGroup(<PaymentCard {...baseProps} state="default" selected={true} />);
    const radio = screen.getByRole('radio', { name: /Visa card ending in 4242/i });
    expect(radio).toHaveAttribute('tabindex', '0');
  });
});

// ── Loading state ─────────────────────────────────────────────────────────────

describe('Loading state', () => {
  it('card root has aria-busy true', () => {
    renderInGroup(<PaymentCard {...baseProps} state="loading" />);
    const radio = screen.getByRole('radio');
    expect(radio).toHaveAttribute('aria-busy', 'true');
  });

  it('card root is aria-disabled in loading state', () => {
    renderInGroup(<PaymentCard {...baseProps} state="loading" />);
    const radio = screen.getByRole('radio');
    expect(radio).toHaveAttribute('aria-disabled', 'true');
  });

  it('card is not keyboard-focusable (tabIndex -1) in loading state', () => {
    renderInGroup(<PaymentCard {...baseProps} state="loading" />);
    const radio = screen.getByRole('radio');
    expect(radio).toHaveAttribute('tabindex', '-1');
  });

  it('does not invoke onSelect or onDelete in loading state', () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();
    renderInGroup(
      <PaymentCard {...baseProps} state="loading" onSelect={onSelect} onDelete={onDelete} />,
    );
    // No interactive controls are exposed in loading state
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

// ── Empty state ───────────────────────────────────────────────────────────────

describe('Empty state', () => {
  it('renders empty placeholder text', () => {
    render(<PaymentCard {...baseProps} state="empty" />);
    expect(
      screen.getByText(/No saved payment methods/i),
    ).toBeInTheDocument();
  });

  it('empty card has correct aria-label', () => {
    render(<PaymentCard {...baseProps} state="empty" />);
    expect(
      screen.getByLabelText(/No saved payment methods. Add a card to get started./i),
    ).toBeInTheDocument();
  });

  it('does not render a radio element in empty state', () => {
    render(<PaymentCard {...baseProps} state="empty" />);
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('empty state container has role region', () => {
    render(<PaymentCard {...baseProps} state="empty" />);
    expect(screen.getByRole('region')).toBeInTheDocument();
  });
});

// ── Error state ───────────────────────────────────────────────────────────────

describe('Error state', () => {
  const errorMessage = 'Failed to delete card. Please try again.';

  it('renders an alert with error tone', () => {
    renderInGroup(
      <PaymentCard {...baseProps} state="error" errorMessage={errorMessage} />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('card root has aria-describedby pointing to the alert', () => {
    renderInGroup(
      <PaymentCard {...baseProps} state="error" errorMessage={errorMessage} />,
    );
    const radio = screen.getByRole('radio');
    const alert = screen.getByRole('alert');
    expect(radio).toHaveAttribute('aria-describedby', alert.id);
  });

  it('displays the errorMessage content', () => {
    renderInGroup(
      <PaymentCard {...baseProps} state="error" errorMessage={errorMessage} />,
    );
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});

// ── Disabled state ────────────────────────────────────────────────────────────

describe('Disabled state', () => {
  it('card root has aria-disabled true', () => {
    renderInGroup(<PaymentCard {...baseProps} state="disabled" />);
    const radio = screen.getByRole('radio');
    expect(radio).toHaveAttribute('aria-disabled', 'true');
  });

  it('card root has tabIndex -1 when disabled', () => {
    renderInGroup(<PaymentCard {...baseProps} state="disabled" />);
    const radio = screen.getByRole('radio');
    expect(radio).toHaveAttribute('tabindex', '-1');
  });

  it('delete button is disabled', () => {
    renderInGroup(<PaymentCard {...baseProps} state="disabled" onDelete={vi.fn()} />);
    const deleteBtn = screen.getByRole('button', { name: /Delete Visa card ending in 4242/i });
    expect(deleteBtn).toBeDisabled();
  });

  it('delete button has aria-disabled true when state is disabled', () => {
    renderInGroup(<PaymentCard {...baseProps} state="disabled" onDelete={vi.fn()} />);
    const deleteBtn = screen.getByRole('button', { name: /Delete Visa card ending in 4242/i });
    expect(deleteBtn).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not call onSelect when clicked in disabled state', () => {
    const onSelect = vi.fn();
    renderInGroup(
      <PaymentCard {...baseProps} state="disabled" onSelect={onSelect} />,
    );
    const radio = screen.getByRole('radio');
    fireEvent.click(radio);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('does not call onDelete when delete button clicked in disabled state', () => {
    const onDelete = vi.fn();
    renderInGroup(
      <PaymentCard {...baseProps} state="disabled" onDelete={onDelete} />,
    );
    const deleteBtn = screen.getByRole('button', { name: /Delete Visa card ending in 4242/i });
    fireEvent.click(deleteBtn);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('disabled+selected card has aria-checked true', () => {
    renderInGroup(<PaymentCard {...baseProps} state="disabled" selected={true} />);
    const radio = screen.getByRole('radio');
    // aria-checked must reflect `selected` even when disabled (Fix 1)
    expect(radio).toHaveAttribute('aria-checked', 'true');
    // card must still be aria-disabled
    expect(radio).toHaveAttribute('aria-disabled', 'true');
  });
});

// ── isFirstInGroup — roving tabindex ─────────────────────────────────────────

describe('isFirstInGroup prop', () => {
  it('isFirstInGroup=true, selected=false gives tabIndex 0', () => {
    renderInGroup(
      <PaymentCard {...baseProps} state="default" selected={false} isFirstInGroup={true} />,
    );
    const radio = screen.getByRole('radio', { name: /Visa card ending in 4242/i });
    expect(radio).toHaveAttribute('tabindex', '0');
  });

  it('isFirstInGroup=false, selected=false gives tabIndex -1', () => {
    renderInGroup(
      <PaymentCard {...baseProps} state="default" selected={false} isFirstInGroup={false} />,
    );
    const radio = screen.getByRole('radio', { name: /Visa card ending in 4242/i });
    expect(radio).toHaveAttribute('tabindex', '-1');
  });

  it('isFirstInGroup=true is ignored when disabled (tabIndex stays -1)', () => {
    renderInGroup(
      <PaymentCard {...baseProps} state="disabled" selected={false} isFirstInGroup={true} />,
    );
    const radio = screen.getByRole('radio', { name: /Visa card ending in 4242/i });
    expect(radio).toHaveAttribute('tabindex', '-1');
  });
});

// ── axe accessibility smoke test ──────────────────────────────────────────────

describe('Accessibility — axe smoke test', () => {
  it('default state has no axe violations', async () => {
    const { container } = renderInGroup(
      <PaymentCard {...baseProps} state="default" selected={false} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('selected state has no axe violations', async () => {
    const { container } = renderInGroup(
      <PaymentCard {...baseProps} state="default" selected={true} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('loading state has no axe violations', async () => {
    const { container } = renderInGroup(
      <PaymentCard {...baseProps} state="loading" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('empty state has no axe violations', async () => {
    const { container } = render(
      <PaymentCard {...baseProps} state="empty" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('error state has no axe violations', async () => {
    const { container } = renderInGroup(
      <PaymentCard
        {...baseProps}
        state="error"
        errorMessage="Failed to delete card. Please try again."
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('disabled state has no axe violations', async () => {
    const { container } = renderInGroup(
      <PaymentCard {...baseProps} state="disabled" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
