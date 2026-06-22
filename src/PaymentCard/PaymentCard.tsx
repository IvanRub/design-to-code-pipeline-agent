import React, { useId } from 'react';
import { Card, Alert, Skeleton, Icon, Button } from '@acme/ui';
import styles from './PaymentCard.module.css';

/** Props for the PaymentCard component. Exported for consumer type-safety. */
export interface PaymentCardProps {
  brand: 'visa' | 'mastercard' | 'amex';
  last4: string;
  expiry: string;
  cardholderName: string;
  selected?: boolean;
  state?: 'default' | 'loading' | 'empty' | 'error' | 'disabled';
  errorMessage?: string;
  /**
   * Mark this card as the first in its radiogroup. When no card is selected,
   * the first card must receive tabIndex=0 so the group is reachable via keyboard
   * (roving tabindex pattern — spec.accessibility).
   * The parent is responsible for setting isFirstInGroup=true on the first rendered card.
   */
  isFirstInGroup?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
}

/**
 * PaymentCard — displays a single stored payment card for the saved-payment-methods list.
 * Covers states: default, selected, loading, empty, error, disabled.
 * Must be rendered inside a parent <div role="radiogroup" aria-label="Saved payment methods">.
 *
 * Roving tabindex:
 *   tabIndex = isDisabled || state==='loading' ? -1 : (isSelected || isFirstInGroup) ? 0 : -1
 * The parent must set isFirstInGroup=true on the first card when no card is selected.
 */
export function PaymentCard({
  brand,
  last4,
  expiry,
  cardholderName,
  selected = false,
  state = 'default',
  errorMessage,
  isFirstInGroup = false,
  onSelect,
  onDelete,
}: PaymentCardProps) {
  const errorAlertId = useId();

  // Capitalise brand for human-readable labels
  const brandLabel = brand.charAt(0).toUpperCase() + brand.slice(1);

  const cardAriaLabel = `${brandLabel} card ending in ${last4}, expires ${expiry}, ${cardholderName}`;

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (state === 'empty') {
    return (
      // Fix 4: use role='region' so the aria-label is reliably announced by AT
      <div
        role="region"
        className={`${styles.card} ${styles.cardEmpty}`}
        aria-label="No saved payment methods. Add a card to get started."
      >
        <Card elevation="sm" padding="lg">
          <p className={styles.emptyText}>
            No saved payment methods. Add a card to get started.
          </p>
        </Card>
      </div>
    );
  }

  // ── Loading state ────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div
        className={`${styles.card} ${styles.cardLoading}`}
        role="radio"
        aria-checked={false}
        aria-disabled="true"
        aria-busy="true"
        tabIndex={-1}
      >
        <Card elevation="sm" padding="lg">
          <div className={styles.cardInner}>
            <div className={styles.brandIconSlot}>
              <Skeleton width="40px" height="24px" radius="sm" />
            </div>
            <div className={styles.cardInfo}>
              <div className={styles.maskedNumber}>
                <Skeleton width="140px" height="16px" radius="sm" />
              </div>
              <div className={styles.metaRow}>
                <Skeleton width="60px" height="14px" radius="sm" />
                <Skeleton width="100px" height="14px" radius="sm" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ── Disabled, Default, Selected, Error states ────────────────────────────────
  const isDisabled = state === 'disabled';
  const isError = state === 'error';
  // isSelected drives visual styling only — not ARIA (see Fix 1)
  const isSelected = selected && !isDisabled && !isError;

  const cardStateClass = isDisabled
    ? styles.cardDisabled
    : isError
    ? styles.cardError
    : isSelected
    ? styles.cardSelected
    : styles.cardDefault;

  // Fix 1: aria-checked must reflect `selected` directly, even when disabled.
  // The click/keydown guards below already prevent interaction when isDisabled.
  const ariaChecked = selected;

  // Fix 5: roving tabindex — first card in group gets tabIndex=0 when nothing is selected
  const tabIndexValue =
    isDisabled || state === 'loading' ? -1 : isSelected || isFirstInGroup ? 0 : -1;

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (isDisabled || isError) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.();
    }
  }

  function handleClick() {
    if (isDisabled || isError) return;
    onSelect?.();
  }

  function handleDeleteClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (isDisabled) return;
    onDelete?.();
  }

  return (
    <div
      className={`${styles.card} ${cardStateClass}`}
      role="radio"
      aria-checked={ariaChecked}
      aria-disabled={isDisabled || undefined}
      aria-label={cardAriaLabel}
      aria-describedby={isError ? errorAlertId : undefined}
      tabIndex={tabIndexValue}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <Card elevation={isSelected ? 'md' : 'sm'} padding="lg">
        <div className={styles.cardInner}>
          {/* Brand icon */}
          <div className={styles.brandIconSlot}>
            {/* aria-hidden Icon paired with sr-only span for WCAG 1.1.1 */}
            <Icon
              name={brand}
              size={40}
              aria-hidden={true}
            />
            <span className={styles.srOnly}>{brandLabel}</span>
          </div>

          {/* Card information column */}
          <div className={styles.cardInfo}>
            {/* Masked card number — aria-hidden so AT reads card root label instead */}
            <span
              className={styles.maskedNumber}
              aria-hidden="true"
            >
              **** **** **** {last4}
            </span>

            <div className={styles.metaRow}>
              <span className={styles.expiry}>{expiry}</span>
              <span className={styles.cardholderName}>{cardholderName}</span>
            </div>

            {/* Error alert inline */}
            {isError && errorMessage && (
              <Alert
                id={errorAlertId}
                tone="error"
                role="alert"
                title={errorMessage}
              />
            )}
          </div>

          {/* Delete button
              Fix 3: explicitly set aria-disabled='true' when disabled so screen readers
              announce the disabled state even if the Button component does not forward
              the native `disabled` attribute as aria-disabled automatically. */}
          <Button
            variant="ghost"
            size="sm"
            type="button"
            aria-label={`Delete ${brandLabel} card ending in ${last4}`}
            disabled={isDisabled}
            aria-disabled={isDisabled || undefined}
            className={styles.deleteButton}
            onClick={handleDeleteClick}
          >
            <Icon name="trash" size={16} aria-hidden={true} />
          </Button>
        </div>
      </Card>
    </div>
  );
}
