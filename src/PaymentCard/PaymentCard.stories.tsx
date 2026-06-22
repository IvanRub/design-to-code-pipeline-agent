import type { Meta, StoryObj } from '@storybook/react';
import { PaymentCard } from './PaymentCard';

const meta: Meta<typeof PaymentCard> = {
  title: 'Components/PaymentCard',
  component: PaymentCard,
  // All instances should be rendered inside a radiogroup as per spec accessibility requirements
  decorators: [
    (Story) => (
      <div role="radiogroup" aria-label="Saved payment methods" style={{ maxWidth: 480 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    brand: 'visa',
    last4: '4242',
    expiry: '12/27',
    cardholderName: 'Jane Smith',
  },
};

export default meta;
type Story = StoryObj<typeof PaymentCard>;

/** Default — unselected card in its resting state. */
export const Default: Story = {
  args: {
    state: 'default',
    selected: false,
  },
};

/** Selected — card chosen as the active payment method. */
export const Selected: Story = {
  args: {
    state: 'default',
    selected: true,
  },
};

/** Hover — visual affordance applied via CSS :hover on a default unselected card.
 *  Uses @storybook/addon-pseudo-states to simulate the :hover pseudo-class. */
export const Hover: Story = {
  args: {
    state: 'default',
    selected: false,
  },
  parameters: {
    pseudo: { hover: true },
  },
};

/** FocusVisible — focus ring applied via CSS :focus-visible on the card root.
 *  Uses @storybook/addon-pseudo-states to simulate the :focus-visible pseudo-class. */
export const FocusVisible: Story = {
  args: {
    state: 'default',
    selected: false,
  },
  parameters: {
    pseudo: { focusVisible: true },
  },
};

/** Loading — card content replaced with skeleton placeholders while data loads. */
export const Loading: Story = {
  args: {
    state: 'loading',
    selected: false,
  },
};

/** Empty — no saved payment methods; prompts user to add a card. */
export const Empty: Story = {
  args: {
    state: 'empty',
  },
  // Empty state is not a radio element; remove the radiogroup decorator role conflict
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 480 }}>
        <Story />
      </div>
    ),
  ],
};

/** Error — delete or load operation failed; displays inline error message. */
export const Error: Story = {
  args: {
    state: 'error',
    selected: false,
    errorMessage: 'Failed to delete card. Please try again.',
  },
};

/** Disabled — card is expired or pending verification; controls are muted and non-interactive. */
export const Disabled: Story = {
  args: {
    state: 'disabled',
    selected: false,
  },
};

/** DisabledSelected — disabled card that was previously selected. */
export const DisabledSelected: Story = {
  name: 'Disabled (selected)',
  args: {
    state: 'disabled',
    selected: true,
  },
};

/** Mastercard variant */
export const Mastercard: Story = {
  args: {
    brand: 'mastercard',
    state: 'default',
    selected: false,
  },
};

/** Amex variant */
export const Amex: Story = {
  args: {
    brand: 'amex',
    last4: '1005',
    state: 'default',
    selected: false,
  },
};
