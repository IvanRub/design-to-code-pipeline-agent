import { useEffect, useRef } from 'react';
import { Button, Alert, Spinner, Skeleton, Icon } from '@acme/ui';
import styles from './PaymentCard.module.css';

/** Discriminated state for the mutually-exclusive lifecycle of a saved payment card. */
export type PaymentCardState = 'default' | 'selected' | 'loading' | 'empty' | 'error';

export type CardBrand = 'visa' | 'mastercard' | 'amex';

const BRAND_LABEL: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
};

export interface PaymentCardProps {
  /** Mutually-exclusive lifecycle state of the card widget. */
  state: PaymentCardState;
  brand?: CardBrand;
  last4?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cardholderName?: string;
  /** Orthogonal flag: whether this card is the merchant's selected default. */
  isSelected: boolean;
  errorMessage?: string;
  /** Orthogonal flag: a delete confirm/cancel request is in flight. */
  isDeleting?: boolean;
  onSelect?: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onAddCard?: () => void;
  /** Orthogonal flag: the delete confirmation surface is open. */
  isDeleteConfirmOpen?: boolean;
}

/**
 * Merchant dashboard widget displaying a saved payment method, supporting selection as the
 * default card and a confirmed delete flow. Covers default, selected, loading, empty and error
 * states as a radio item within a radiogroup of saved cards.
 */
export function PaymentCard({
  state,
  brand,
  last4,
  expiryMonth,
  expiryYear,
  cardholderName,
  isSelected,
  errorMessage,
  isDeleting = false,
  onSelect,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onAddCard,
  isDeleteConfirmOpen = false,
}: PaymentCardProps): JSX.Element {
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const wasConfirmOpen = useRef(isDeleteConfirmOpen);

  useEffect(() => {
    if (wasConfirmOpen.current && !isDeleteConfirmOpen) {
      deleteButtonRef.current?.focus();
    }
    wasConfirmOpen.current = isDeleteConfirmOpen;
  }, [isDeleteConfirmOpen]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (isDeleteConfirmOpen) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onDeleteCancel();
      }
      return;
    }
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      onSelect?.();
    }
  };

  if (state === 'loading') {
    return (
      <div
        className={styles.card}
        role="status"
        aria-label="Loading payment card"
      >
        <div className={styles.body} aria-hidden="true">
          <Skeleton width="32px" height="32px" radius="sm" />
          <div className={styles.details}>
            <Skeleton width="140px" height="16px" radius="sm" />
            <Skeleton width="90px" height="12px" radius="sm" />
            <Skeleton width="110px" height="12px" radius="sm" />
          </div>
        </div>
      </div>
    );
  }

  if (state === 'empty') {
    return (
      <div
        className={styles.card}
        role="group"
        aria-label="No saved payment method"
      >
        <p className={styles.emptyMessage}>No saved payment method</p>
        <Button variant="primary" size="md" onClick={onAddCard}>
          Add card
        </Button>
      </div>
    );
  }

  const selected = state === 'selected' || isSelected;
  const cardClassName = [
    styles.card,
    selected ? styles.selected : '',
    state === 'error' ? styles.error : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.wrapper}>
      <div
        className={cardClassName}
        role="radio"
        aria-checked={selected}
        tabIndex={state === 'error' ? -1 : 0}
        onClick={state === 'error' ? undefined : onSelect}
        onKeyDown={handleKeyDown}
      >
        {state === 'error' && errorMessage ? (
          <Alert tone="error" role="alert" title={errorMessage} />
        ) : null}

        <div className={styles.body}>
          {brand ? (
            <Icon name={brand} size={32} aria-label={BRAND_LABEL[brand]} />
          ) : null}
          <div className={styles.details}>
            <span className={styles.maskedNumber} aria-label={`Card ending in ${last4 ?? ''}`}>
              {`**** **** **** ${last4 ?? ''}`}
            </span>
            <span className={styles.meta}>
              {cardholderName}
              {expiryMonth && expiryYear ? ` · Exp ${expiryMonth}/${expiryYear}` : ''}
            </span>
          </div>
          {selected ? (
            <Icon name="check" size={20} aria-label="Selected" />
          ) : null}
        </div>

        <div className={styles.actions}>
          <Button
            ref={deleteButtonRef}
            variant="secondary"
            size="sm"
            disabled={state === 'loading'}
            onClick={(event: React.MouseEvent) => {
              event.stopPropagation();
              onDeleteRequest();
            }}
            aria-label={`Delete card ending in ${last4 ?? ''}`}
          >
            Delete
          </Button>
        </div>
      </div>

      <div role="status" className={styles.visuallyHidden}>
        {selected && brand && last4 ? `${BRAND_LABEL[brand]} ending in ${last4} selected` : ''}
      </div>

      {isDeleteConfirmOpen ? (
        <div
          className={styles.overlay}
          role="alertdialog"
          aria-label={`Delete card ending in ${last4 ?? ''}?`}
        >
          <div className={styles.confirmSurface}>
            <p className={styles.confirmMessage}>{`Delete card ending in ${last4 ?? ''}?`}</p>
            <div className={styles.confirmActions}>
              <Button
                variant="secondary"
                size="sm"
                disabled={isDeleting}
                onClick={onDeleteCancel}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isDeleting}
                onClick={onDeleteConfirm}
              >
                {isDeleting ? (
                  <Spinner size="sm" aria-label="Deleting card" />
                ) : (
                  'Confirm'
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
