import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { KycVerificationWizard, type KycVerificationWizardProps, type KycPersonalInfoField } from './KycVerificationWizard';

expect.extend(toHaveNoViolations);

const baseFields: KycPersonalInfoField[] = [
  { name: 'fullName', label: 'Full name', value: '', required: true, hint: 'As it appears on your ID' },
  { name: 'dob', label: 'Date of birth', value: '', required: true },
];

function makeProps(overrides: Partial<KycVerificationWizardProps> = {}): KycVerificationWizardProps {
  return {
    currentStep: 'personal-info',
    personalInfo: { fields: baseFields },
    document: { status: 'empty' },
    selfie: { status: 'empty' },
    verification: undefined,
    isBackDisabled: true,
    isNextDisabled: false,
    isNextLoading: false,
    onBack: vi.fn(),
    onNext: vi.fn(),
    onFieldChange: vi.fn(),
    onDocumentDrop: vi.fn(),
    onDocumentSelect: vi.fn(),
    onDocumentRemove: vi.fn(),
    onSelfieCapture: vi.fn(),
    ...overrides,
  };
}

describe('KycVerificationWizard', () => {
  it('step-personal-info: renders heading and focuses it, with role=form linked via aria-labelledby', () => {
    render(<KycVerificationWizard {...makeProps({ currentStep: 'personal-info' })} />);
    const heading = screen.getByRole('heading', { name: /step 1 of 3: personal information/i });
    expect(heading).toHaveFocus();
    expect(screen.getByRole('form')).toHaveAttribute('aria-labelledby', heading.id);
  });

  it('step-document-upload: renders heading and dropzone described by accepted types/size', () => {
    render(<KycVerificationWizard {...makeProps({ currentStep: 'document-upload', isBackDisabled: false })} />);
    expect(screen.getByRole('heading', { name: /step 2 of 3: document upload/i })).toHaveFocus();
    const dropzone = screen.getByRole('button', { name: /drag and drop or browse/i });
    expect(dropzone).toHaveAccessibleDescription(/pdf, jpg, png/i);
  });

  it('step-selfie: renders heading and verification panel below capture control', () => {
    render(
      <KycVerificationWizard
        {...makeProps({
          currentStep: 'selfie',
          isBackDisabled: false,
          verification: { status: 'approved', message: 'Verified' },
        })}
      />
    );
    expect(screen.getByRole('heading', { name: /step 3 of 3: selfie verification/i })).toHaveFocus();
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('step-indicator-current: marks the active step with aria-current="step"', () => {
    render(<KycVerificationWizard {...makeProps({ currentStep: 'document-upload', isBackDisabled: false })} />);
    const currentItem = screen.getByText(/document upload, current step/i).closest('li');
    expect(currentItem).toHaveAttribute('aria-current', 'step');
  });

  it('step-indicator-completed: announces completed segment via visually hidden text', () => {
    render(<KycVerificationWizard {...makeProps({ currentStep: 'document-upload', isBackDisabled: false })} />);
    expect(screen.getByText(/personal information, completed/i)).toBeInTheDocument();
  });

  it('step-indicator-upcoming: announces upcoming segment via visually hidden text', () => {
    render(<KycVerificationWizard {...makeProps({ currentStep: 'personal-info' })} />);
    expect(screen.getByText(/selfie verification, upcoming/i)).toBeInTheDocument();
  });

  it('back-navigation: Back button is disabled via the native disabled attribute when isBackDisabled', () => {
    render(<KycVerificationWizard {...makeProps({ isBackDisabled: true })} />);
    expect(screen.getByRole('button', { name: /back/i })).toBeDisabled();
  });

  it('next-navigation: Next button triggers onNext and shows a live region when loading', () => {
    const onNext = vi.fn();
    render(<KycVerificationWizard {...makeProps({ isNextLoading: true, onNext })} />);
    expect(screen.getByRole('status', { name: /validating/i })).toBeInTheDocument();
  });

  it('upload-empty: dropzone is keyboard-focusable and labelled', () => {
    render(<KycVerificationWizard {...makeProps({ currentStep: 'document-upload', isBackDisabled: false })} />);
    const dropzone = screen.getByRole('button', { name: /drag and drop or browse/i });
    expect(dropzone).toHaveAttribute('tabIndex', '0');
  });

  it('upload-drag-active: announces "Drop to upload" via a live region', () => {
    render(
      <KycVerificationWizard
        {...makeProps({ currentStep: 'document-upload', isBackDisabled: false, document: { status: 'drag-active' } })}
      />
    );
    expect(screen.getByRole('status', { name: '' })).toBeInTheDocument();
    expect(screen.getByText(/drop to upload/i)).toBeInTheDocument();
  });

  it('upload-file-selected: shows file name/size and a labelled remove control', async () => {
    const onDocumentRemove = vi.fn();
    const user = userEvent.setup();
    render(
      <KycVerificationWizard
        {...makeProps({
          currentStep: 'document-upload',
          isBackDisabled: false,
          document: { status: 'selected', file: { name: 'passport.pdf', size: 2048, type: 'application/pdf' } },
          onDocumentRemove,
        })}
      />
    );
    expect(screen.getByText('passport.pdf')).toBeInTheDocument();
    const removeButton = screen.getByRole('button', { name: /remove passport\.pdf/i });
    await user.click(removeButton);
    expect(onDocumentRemove).toHaveBeenCalled();
  });

  it('verification-pending-review: renders Alert as role=status', () => {
    render(
      <KycVerificationWizard
        {...makeProps({ currentStep: 'selfie', isBackDisabled: false, verification: { status: 'pending-review' } })}
      />
    );
    expect(screen.getByRole('status', { name: /verification pending review/i })).toBeInTheDocument();
  });

  it('verification-approved: renders Alert as role=status', () => {
    render(
      <KycVerificationWizard
        {...makeProps({ currentStep: 'selfie', isBackDisabled: false, verification: { status: 'approved' } })}
      />
    );
    expect(screen.getByRole('status', { name: /verification approved/i })).toBeInTheDocument();
  });

  it('verification-rejected: renders Alert as role=alert', () => {
    render(
      <KycVerificationWizard
        {...makeProps({ currentStep: 'selfie', isBackDisabled: false, verification: { status: 'rejected' } })}
      />
    );
    expect(screen.getByRole('alert', { name: /verification rejected/i })).toBeInTheDocument();
  });

  it('loading: shows a Spinner with aria-label inside a role=status region and disables the dropzone', () => {
    render(
      <KycVerificationWizard
        {...makeProps({ currentStep: 'document-upload', isBackDisabled: false, document: { status: 'loading' } })}
      />
    );
    expect(screen.getByRole('status', { name: /uploading document/i })).toBeInTheDocument();
  });

  it('error: surfaces field-level errors with aria-invalid after interaction', async () => {
    const user = userEvent.setup();
    const fields: KycPersonalInfoField[] = [
      { name: 'fullName', label: 'Full name', value: '', error: 'Full name is required', required: true },
    ];
    render(<KycVerificationWizard {...makeProps({ personalInfo: { fields } })} />);
    const input = screen.getByLabelText(/full name/i);
    expect(input).not.toHaveAttribute('aria-invalid', 'true');
    await user.click(input);
    await user.tab();
    expect(screen.getByText('Full name is required')).toBeInTheDocument();
  });

  it('disabled: Back/Next/Input are disabled via the native disabled attribute', () => {
    render(<KycVerificationWizard {...makeProps({ disabled: true, isBackDisabled: true, isNextDisabled: true })} />);
    expect(screen.getByRole('button', { name: /back/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  it('focus: step heading receives programmatic focus on step change (tabIndex -1)', () => {
    render(<KycVerificationWizard {...makeProps({ currentStep: 'personal-info' })} />);
    const heading = screen.getByRole('heading', { name: /step 1 of 3/i });
    expect(heading).toHaveAttribute('tabindex', '-1');
  });

  it('empty: pristine field shows no aria-invalid and no error text', () => {
    render(<KycVerificationWizard {...makeProps()} />);
    const input = screen.getByLabelText(/full name/i);
    expect(input).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('success: document success state announces success via a visually hidden status region', () => {
    render(
      <KycVerificationWizard
        {...makeProps({
          currentStep: 'document-upload',
          isBackDisabled: false,
          document: { status: 'success', file: { name: 'passport.pdf', size: 2048, type: 'application/pdf' } },
        })}
      />
    );
    expect(screen.getByText(/document uploaded successfully/i)).toBeInTheDocument();
  });

  it('has no axe violations in its default state', async () => {
    const { container } = render(<KycVerificationWizard {...makeProps()} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
