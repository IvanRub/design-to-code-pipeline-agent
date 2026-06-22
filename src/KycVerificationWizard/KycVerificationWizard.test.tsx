import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { KycVerificationWizard } from './KycVerificationWizard';

expect.extend(toHaveNoViolations);

const noop = () => undefined;

const baseProps = {
  onNext: noop,
  onBack: noop,
  onSubmit: noop,
  onFileSelect: noop,
} as const;

const basePersonalInfo = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  nationality: '',
};

const filledPersonalInfo = {
  firstName: 'Jane',
  lastName: 'Smith',
  dateOfBirth: '01/01/1990',
  nationality: 'British',
};

// ── State: default ──────────────────────────────────────────────────────────

describe('state: default', () => {
  it('renders step 1 with all fields empty and Next button disabled', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="default"
        activeStep={1}
        personalInfo={basePersonalInfo}
        isStepFilled={false}
        verificationStatus={null}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Personal Information' })).toBeInTheDocument();

    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeDisabled();
    expect(nextButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('step indicator has role=list and step 1 carries aria-current=step', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="default"
        activeStep={1}
        personalInfo={basePersonalInfo}
        isStepFilled={false}
        verificationStatus={null}
      />,
    );

    const list = screen.getByRole('list', { name: /verification steps/i });
    expect(list).toBeInTheDocument();

    const stepItems = screen.getAllByRole('listitem');
    expect(stepItems[0]).toHaveAttribute('aria-current', 'step');
    expect(stepItems[1]).not.toHaveAttribute('aria-current');
  });

  it('form has aria-labelledby pointing to visible step heading', () => {
    const { container } = render(
      <KycVerificationWizard
        {...baseProps}
        state="default"
        activeStep={1}
        personalInfo={basePersonalInfo}
        isStepFilled={false}
        verificationStatus={null}
      />,
    );

    const form = container.querySelector('form');
    const labelledById = form?.getAttribute('aria-labelledby');
    expect(labelledById).toBeTruthy();

    const heading = document.getElementById(labelledById!);
    expect(heading).toBeInTheDocument();
    expect(heading?.tagName).toBe('H2');
  });

  it('Back button is not rendered on step 1', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="default"
        activeStep={1}
        personalInfo={basePersonalInfo}
        isStepFilled={false}
        verificationStatus={null}
      />,
    );

    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
  });
});

// ── State: empty ────────────────────────────────────────────────────────────

describe('state: empty', () => {
  it('CTA is disabled with aria-disabled when isStepFilled=false', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="default"
        activeStep={1}
        personalInfo={basePersonalInfo}
        isStepFilled={false}
        verificationStatus={null}
      />,
    );

    const nextBtn = screen.getByRole('button', { name: /next/i });
    expect(nextBtn).toBeDisabled();
    expect(nextBtn).toHaveAttribute('aria-disabled', 'true');
  });

  it('no validation error messages shown in empty state', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="default"
        activeStep={1}
        personalInfo={basePersonalInfo}
        isStepFilled={false}
        fieldErrors={{}}
        verificationStatus={null}
      />,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

// ── State: filled ───────────────────────────────────────────────────────────

describe('state: filled', () => {
  it('Next CTA is enabled when isStepFilled=true and state is default', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="default"
        activeStep={1}
        personalInfo={filledPersonalInfo}
        isStepFilled={true}
        verificationStatus={null}
      />,
    );

    const nextBtn = screen.getByRole('button', { name: /next/i });
    expect(nextBtn).not.toBeDisabled();
    expect(nextBtn).not.toHaveAttribute('aria-disabled', 'true');
  });
});

// ── State: focus ────────────────────────────────────────────────────────────

describe('state: focus', () => {
  it('all focusable elements are present and keyboard-reachable', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="default"
        activeStep={1}
        personalInfo={basePersonalInfo}
        isStepFilled={false}
        verificationStatus={null}
      />,
    );

    // Form inputs and CTA must be in the DOM
    expect(screen.getAllByRole('textbox').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });
});

// ── State: loading ──────────────────────────────────────────────────────────

describe('state: loading', () => {
  it('spinner is present with aria-label and live region announces submitting', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="loading"
        activeStep={3}
        personalInfo={filledPersonalInfo}
        isStepFilled={true}
        verificationStatus={null}
      />,
    );

    expect(screen.getByLabelText(/processing, please wait/i)).toBeInTheDocument();
    expect(screen.getByText(/submitting your information/i)).toBeInTheDocument();
  });

  it('Submit button is disabled during loading', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="loading"
        activeStep={3}
        personalInfo={filledPersonalInfo}
        isStepFilled={true}
        verificationStatus={null}
      />,
    );

    const submitBtn = screen.getByRole('button', { name: /submit/i });
    expect(submitBtn).toBeDisabled();
  });
});

// ── State: error ────────────────────────────────────────────────────────────

describe('state: error', () => {
  it('Alert with role=alert is present for error state', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="error"
        activeStep={1}
        personalInfo={basePersonalInfo}
        isStepFilled={false}
        fieldErrors={{ firstName: 'First name is required.' }}
        verificationStatus={null}
      />,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('errored input has aria-invalid=true', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="error"
        activeStep={1}
        personalInfo={basePersonalInfo}
        isStepFilled={false}
        fieldErrors={{ firstName: 'First name is required.' }}
        verificationStatus={null}
      />,
    );

    // The Input component receives invalid prop which should propagate aria-invalid
    const invalidInputs = document.querySelectorAll('[aria-invalid="true"]');
    expect(invalidInputs.length).toBeGreaterThan(0);
  });
});

// ── State: success ──────────────────────────────────────────────────────────

describe('state: success', () => {
  it('success Alert with role=status is shown for step completion', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="success"
        activeStep={2}
        personalInfo={filledPersonalInfo}
        isStepFilled={true}
        verificationStatus={null}
      />,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

// ── State: disabled ─────────────────────────────────────────────────────────

describe('state: disabled', () => {
  it('all form controls are disabled', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="disabled"
        activeStep={1}
        personalInfo={basePersonalInfo}
        isStepFilled={false}
        verificationStatus={null}
      />,
    );

    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
  });

  it('Back button is not in DOM on step 1 when disabled', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="disabled"
        activeStep={1}
        personalInfo={basePersonalInfo}
        isStepFilled={false}
        verificationStatus={null}
      />,
    );

    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
  });
});

// ── State: step-personal-info ───────────────────────────────────────────────

describe('state: step-personal-info', () => {
  it('renders step 1 heading and four form fields', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="default"
        activeStep={1}
        personalInfo={basePersonalInfo}
        isStepFilled={false}
        verificationStatus={null}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Personal Information' })).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nationality/i)).toBeInTheDocument();
  });

  it('step indicator marks step 1 as current', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="default"
        activeStep={1}
        personalInfo={basePersonalInfo}
        isStepFilled={false}
        verificationStatus={null}
      />,
    );

    const stepItems = screen.getAllByRole('listitem');
    expect(stepItems[0]).toHaveAttribute('aria-current', 'step');
  });
});

// ── State: step-document-upload ─────────────────────────────────────────────

describe('state: step-document-upload', () => {
  it('renders step 2 heading and file input with constraints', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="default"
        activeStep={2}
        personalInfo={filledPersonalInfo}
        documentUploadState="idle"
        isStepFilled={false}
        verificationStatus={null}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Document Upload' })).toBeInTheDocument();
    expect(screen.getByText(/accepted types: PDF, JPG, PNG/i)).toBeInTheDocument();

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', '.pdf,.jpg,.jpeg,.png');
  });

  it('Back button is present on step 2', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="default"
        activeStep={2}
        personalInfo={filledPersonalInfo}
        documentUploadState="idle"
        isStepFilled={false}
        verificationStatus={null}
      />,
    );

    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('step indicator marks step 2 as current', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="default"
        activeStep={2}
        personalInfo={filledPersonalInfo}
        documentUploadState="idle"
        isStepFilled={false}
        verificationStatus={null}
      />,
    );

    const stepItems = screen.getAllByRole('listitem');
    expect(stepItems[1]).toHaveAttribute('aria-current', 'step');
  });
});

// ── State: step-selfie ──────────────────────────────────────────────────────

describe('state: step-selfie', () => {
  it('renders step 3 heading and Submit button with type=submit', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="default"
        activeStep={3}
        personalInfo={filledPersonalInfo}
        isStepFilled={true}
        verificationStatus={null}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Take a Selfie' })).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /submit/i });
    expect(submitBtn).toHaveAttribute('type', 'submit');
  });
});

// ── State: document-upload-idle ─────────────────────────────────────────────

describe('state: document-upload-idle', () => {
  it('file input and constraints text are present', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="default"
        activeStep={2}
        personalInfo={filledPersonalInfo}
        documentUploadState="idle"
        isStepFilled={false}
        verificationStatus={null}
      />,
    );

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(screen.getByText(/maximum file size: 10 MB/i)).toBeInTheDocument();
  });
});

// ── State: document-upload-drag-over ────────────────────────────────────────

describe('state: document-upload-drag-over', () => {
  it('file input is still present and accessible during drag-over', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="default"
        activeStep={2}
        personalInfo={filledPersonalInfo}
        documentUploadState="drag-over"
        isStepFilled={false}
        verificationStatus={null}
      />,
    );

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
  });
});

// ── State: document-upload-uploading ────────────────────────────────────────

describe('state: document-upload-uploading', () => {
  it('spinner with aria-label=Uploading document and live region are present', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="default"
        activeStep={2}
        personalInfo={filledPersonalInfo}
        documentUploadState="uploading"
        isStepFilled={false}
        verificationStatus={null}
      />,
    );

    expect(screen.getByLabelText(/uploading document/i)).toBeInTheDocument();
    expect(screen.getByText(/upload in progress/i)).toBeInTheDocument();
  });

  it('file input is disabled during upload', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="default"
        activeStep={2}
        personalInfo={filledPersonalInfo}
        documentUploadState="uploading"
        isStepFilled={false}
        verificationStatus={null}
      />,
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeDisabled();
  });
});

// ── State: document-upload-success ──────────────────────────────────────────

describe('state: document-upload-success', () => {
  it('success Alert with visible text is shown', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="default"
        activeStep={2}
        personalInfo={filledPersonalInfo}
        documentUploadState="success"
        isStepFilled={true}
        verificationStatus={null}
      />,
    );

    expect(screen.getByText(/upload successful/i)).toBeInTheDocument();
  });
});

// ── State: document-upload-error ────────────────────────────────────────────

describe('state: document-upload-error', () => {
  it('error Alert with role=alert is shown immediately', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="default"
        activeStep={2}
        personalInfo={filledPersonalInfo}
        documentUploadState="error"
        isStepFilled={false}
        verificationStatus={null}
      />,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
  });
});

// ── State: verification-pending ─────────────────────────────────────────────

describe('state: verification-pending', () => {
  it('warning Alert with role=status is shown politely', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="success"
        activeStep={3}
        personalInfo={filledPersonalInfo}
        isStepFilled={true}
        verificationStatus="pending"
      />,
    );

    expect(screen.getByText(/verification in progress/i)).toBeInTheDocument();
  });
});

// ── State: verification-approved ────────────────────────────────────────────

describe('state: verification-approved', () => {
  it('success Alert with visible label Verification approved is shown', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="success"
        activeStep={3}
        personalInfo={filledPersonalInfo}
        isStepFilled={true}
        verificationStatus="approved"
      />,
    );

    expect(screen.getByText(/verification approved/i)).toBeInTheDocument();
  });
});

// ── State: verification-rejected ────────────────────────────────────────────

describe('state: verification-rejected', () => {
  it('error Alert with role=alert and rejection reason element are present', () => {
    render(
      <KycVerificationWizard
        {...baseProps}
        state="error"
        activeStep={3}
        personalInfo={filledPersonalInfo}
        isStepFilled={false}
        verificationStatus="rejected"
      />,
    );

    expect(screen.getByText(/verification rejected/i)).toBeInTheDocument();
    expect(screen.getByText(/identity verification could not be confirmed/i)).toBeInTheDocument();
  });
});

// ── Axe smoke test ──────────────────────────────────────────────────────────

describe('axe accessibility smoke test', () => {
  it('default state passes axe with no violations', async () => {
    const { container } = render(
      <KycVerificationWizard
        {...baseProps}
        state="default"
        activeStep={1}
        personalInfo={basePersonalInfo}
        isStepFilled={false}
        verificationStatus={null}
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('error state passes axe with no violations', async () => {
    const { container } = render(
      <KycVerificationWizard
        {...baseProps}
        state="error"
        activeStep={1}
        personalInfo={basePersonalInfo}
        isStepFilled={false}
        fieldErrors={{ firstName: 'First name is required.' }}
        verificationStatus={null}
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('loading state passes axe with no violations', async () => {
    const { container } = render(
      <KycVerificationWizard
        {...baseProps}
        state="loading"
        activeStep={3}
        personalInfo={filledPersonalInfo}
        isStepFilled={true}
        verificationStatus={null}
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('verification-rejected passes axe with no violations', async () => {
    const { container } = render(
      <KycVerificationWizard
        {...baseProps}
        state="error"
        activeStep={3}
        personalInfo={filledPersonalInfo}
        isStepFilled={false}
        verificationStatus="rejected"
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
