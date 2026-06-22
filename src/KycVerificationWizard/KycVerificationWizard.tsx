import React, { useEffect, useRef } from 'react';
import { Button, Input, FormField, Card, Alert, Spinner, Icon } from '@acme/ui';
import styles from './KycVerificationWizard.module.css';

/** Fields for step 1 Personal Info */
export interface PersonalInfoFields {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
}

/** Props for KycVerificationWizard — covers all spec states */
export interface KycVerificationWizardProps {
  state: 'default' | 'loading' | 'error' | 'success' | 'disabled';
  activeStep: 1 | 2 | 3;
  verificationStatus?: 'pending' | 'approved' | 'rejected' | null;
  personalInfo?: PersonalInfoFields;
  documentUploadState?: 'idle' | 'drag-over' | 'uploading' | 'success' | 'error';
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
  onFileSelect?: (files: FileList) => void;
  fieldErrors?: Record<string, string>;
  isStepFilled?: boolean;
}

const STEPS = [
  { id: 1, label: 'Personal Info' },
  { id: 2, label: 'Document Upload' },
  { id: 3, label: 'Selfie' },
] as const;

const STEP_HEADING_IDS = {
  1: 'kyc-step-1-heading',
  2: 'kyc-step-2-heading',
  3: 'kyc-step-3-heading',
} as const;

/**
 * KycVerificationWizard — multi-step KYC identity verification form.
 * Covers states: default, empty, filled, focus, loading, error, success, disabled,
 * step-personal-info, step-document-upload, step-selfie, document-upload-idle,
 * document-upload-drag-over, document-upload-uploading, document-upload-success,
 * document-upload-error, verification-pending, verification-approved, verification-rejected.
 */
export function KycVerificationWizard({
  state,
  activeStep,
  verificationStatus = null,
  personalInfo,
  documentUploadState = 'idle',
  onNext,
  onBack,
  onSubmit,
  onFileSelect,
  fieldErrors = {},
  isStepFilled = false,
}: KycVerificationWizardProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Move focus to step heading on step change (SC 2.4.3)
  useEffect(() => {
    headingRef.current?.focus();
  }, [activeStep]);

  const isDisabled = state === 'disabled';
  const isLoading = state === 'loading';
  // CTA is actionable only when step is filled and not loading/disabled
  const isCtaDisabled = !isStepFilled || isLoading || isDisabled;
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  const headingId = STEP_HEADING_IDS[activeStep];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0 && onFileSelect) {
      onFileSelect(files);
    }
  }

  function handleDropZoneKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  }

  function renderStepIndicator() {
    return (
      <ol role="list" className={styles.stepIndicator} aria-label="Verification steps">
        {STEPS.map((step) => {
          const isCurrent = step.id === activeStep;
          const isCompleted = step.id < activeStep;
          return (
            <li
              key={step.id}
              role="listitem"
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={step.label}
              className={[
                styles.stepItem,
                isCurrent ? styles.stepItemCurrent : '',
                isCompleted ? styles.stepItemCompleted : '',
              ].join(' ')}
            >
              <span className={styles.stepNumber} aria-hidden="true">
                {isCompleted ? (
                  <Icon name="check" size={14} aria-hidden={true} />
                ) : (
                  step.id
                )}
              </span>
              <span className={styles.stepLabel}>{step.label}</span>
            </li>
          );
        })}
      </ol>
    );
  }

  function renderPersonalInfoStep() {
    const firstName = personalInfo?.firstName ?? '';
    const lastName = personalInfo?.lastName ?? '';
    const dateOfBirth = personalInfo?.dateOfBirth ?? '';
    const nationality = personalInfo?.nationality ?? '';

    return (
      <div className={styles.stepContent}>
        {/* Error summary at top of step (SC 1.3.1, 4.1.3) */}
        {(state === 'error' || hasFieldErrors) && (
          <Alert
            tone="error"
            title="Please correct the errors below"
            role="alert"
          />
        )}

        <div className={styles.fieldRow}>
          <FormField
            label="First name"
            htmlFor="kyc-first-name"
            error={fieldErrors['firstName']}
            required
          >
            <Input
              value={firstName}
              disabled={isDisabled || isLoading}
              invalid={!!fieldErrors['firstName']}
              aria-describedby={fieldErrors['firstName'] ? 'kyc-first-name-error' : undefined}
            />
          </FormField>
          <FormField
            label="Last name"
            htmlFor="kyc-last-name"
            error={fieldErrors['lastName']}
            required
          >
            <Input
              value={lastName}
              disabled={isDisabled || isLoading}
              invalid={!!fieldErrors['lastName']}
              aria-describedby={fieldErrors['lastName'] ? 'kyc-last-name-error' : undefined}
            />
          </FormField>
        </div>

        <FormField
          label="Date of birth"
          htmlFor="kyc-dob"
          error={fieldErrors['dateOfBirth']}
          hint="Format: DD/MM/YYYY"
          required
        >
          <Input
            value={dateOfBirth}
            disabled={isDisabled || isLoading}
            invalid={!!fieldErrors['dateOfBirth']}
            aria-describedby={fieldErrors['dateOfBirth'] ? 'kyc-dob-error' : 'kyc-dob-hint'}
          />
        </FormField>

        <FormField
          label="Nationality"
          htmlFor="kyc-nationality"
          error={fieldErrors['nationality']}
          required
        >
          <Input
            value={nationality}
            disabled={isDisabled || isLoading}
            invalid={!!fieldErrors['nationality']}
            aria-describedby={fieldErrors['nationality'] ? 'kyc-nationality-error' : undefined}
          />
        </FormField>
      </div>
    );
  }

  function renderDocumentUploadStep() {
    const isDragOver = documentUploadState === 'drag-over';
    const isUploading = documentUploadState === 'uploading';
    const isUploadSuccess = documentUploadState === 'success';
    const isUploadError = documentUploadState === 'error';

    return (
      <div className={styles.stepContent}>
        {(state === 'error' || hasFieldErrors) && (
          <Alert
            tone="error"
            title="Please correct the errors below"
            role="alert"
          />
        )}

        <div
          role="group"
          aria-labelledby="kyc-upload-label"
          aria-describedby="kyc-upload-constraints"
          className={[
            styles.dropZone,
            isDragOver ? styles.dropZoneDragOver : '',
            isUploading ? styles.dropZoneUploading : '',
            isUploadSuccess ? styles.dropZoneSuccess : '',
            isUploadError ? styles.dropZoneError : '',
            isDisabled || isLoading ? styles.dropZoneDisabled : '',
          ].join(' ')}
          tabIndex={isDisabled || isLoading || isUploading ? -1 : 0}
          onKeyDown={handleDropZoneKeyDown}
        >
          <label id="kyc-upload-label" htmlFor="kyc-file-input" className={styles.uploadLabel}>
            {/* Drag-and-drop copy hidden at lg breakpoint per responsive spec */}
            <span className={styles.dragCopy} aria-hidden="true">
              Drag and drop your file here, or
            </span>{' '}
            <span className={styles.uploadButtonText}>choose a file</span>
          </label>

          <input
            ref={fileInputRef}
            id="kyc-file-input"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className={styles.fileInput}
            onChange={handleFileChange}
            disabled={isDisabled || isLoading || isUploading}
            aria-describedby="kyc-upload-constraints"
          />

          <p id="kyc-upload-constraints" className={styles.uploadConstraints}>
            Accepted types: PDF, JPG, PNG. Maximum file size: 10 MB.
          </p>

          {isUploading && (
            <>
              <Spinner size="sm" aria-label="Uploading document" />
              {/* Polite live region for upload progress (SC 4.1.3) */}
              <div role="status" aria-live="polite" className={styles.srOnly}>
                Upload in progress
              </div>
            </>
          )}

          {isUploadSuccess && (
            <Alert tone="success" title="Upload successful" role="status" />
          )}

          {isUploadError && (
            <Alert
              tone="error"
              title="Upload failed. Please try again."
              role="alert"
            />
          )}
        </div>
      </div>
    );
  }

  function renderSelfieStep() {
    return (
      <div className={styles.stepContent}>
        {(state === 'error' || hasFieldErrors) && (
          <Alert
            tone="error"
            title="Please correct the errors below"
            role="alert"
          />
        )}

        <div
          role="group"
          aria-labelledby="kyc-selfie-label"
          aria-describedby="kyc-selfie-constraints"
          className={[
            styles.dropZone,
            isDisabled || isLoading ? styles.dropZoneDisabled : '',
          ].join(' ')}
          tabIndex={isDisabled || isLoading ? -1 : 0}
          onKeyDown={handleDropZoneKeyDown}
        >
          <label id="kyc-selfie-label" htmlFor="kyc-selfie-input" className={styles.uploadLabel}>
            <span className={styles.dragCopy} aria-hidden="true">
              Drag and drop your selfie here, or
            </span>{' '}
            <span className={styles.uploadButtonText}>choose a photo</span>
          </label>

          <input
            id="kyc-selfie-input"
            type="file"
            accept=".jpg,.jpeg,.png"
            className={styles.fileInput}
            onChange={handleFileChange}
            disabled={isDisabled || isLoading}
            aria-describedby="kyc-selfie-constraints"
          />

          <p id="kyc-selfie-constraints" className={styles.uploadConstraints}>
            Accepted types: JPG, PNG. Maximum file size: 10 MB. Must show your face clearly.
          </p>
        </div>
      </div>
    );
  }

  function renderVerificationStatus() {
    if (!verificationStatus) return null;

    if (verificationStatus === 'pending') {
      return (
        <Alert
          tone="warning"
          title="Verification in progress"
          role="status"
        />
      );
    }

    if (verificationStatus === 'approved') {
      return (
        <Alert
          tone="success"
          title="Verification approved"
          role="status"
        />
      );
    }

    if (verificationStatus === 'rejected') {
      return (
        <>
          <Alert
            tone="error"
            title="Verification rejected"
            role="alert"
            aria-describedby="kyc-rejection-reason"
          />
          <p id="kyc-rejection-reason" className={styles.rejectionReason}>
            Your identity verification could not be confirmed. Please review your submitted
            documents and try again, or contact support if you need assistance.
          </p>
        </>
      );
    }

    return null;
  }

  function renderStepContent() {
    if (activeStep === 1) return renderPersonalInfoStep();
    if (activeStep === 2) return renderDocumentUploadStep();
    return renderSelfieStep();
  }

  function renderStepHeading() {
    const headings: Record<1 | 2 | 3, string> = {
      1: 'Personal Information',
      2: 'Document Upload',
      3: 'Take a Selfie',
    };
    return (
      // tabIndex={-1} allows programmatic focus without a native Tab stop
      <h2
        id={headingId}
        ref={headingRef}
        tabIndex={-1}
        className={styles.stepHeading}
      >
        {headings[activeStep]}
      </h2>
    );
  }

  function renderNavigation() {
    const showBack = activeStep > 1;
    const isLastStep = activeStep === 3;

    return (
      <div className={styles.navigation}>
        {/* Back button removed from DOM on step 1 to avoid orphaned tab stop (SC 2.1.1) */}
        {showBack && (
          <Button
            variant="secondary"
            size="md"
            disabled={isDisabled || isLoading}
            type="button"
            onClick={onBack}
          >
            Back
          </Button>
        )}

        {isLastStep ? (
          <Button
            variant="primary"
            size="md"
            type="submit"
            disabled={isCtaDisabled}
            loading={isLoading}
            aria-disabled={isCtaDisabled}
          >
            {isLoading ? 'Submitting…' : 'Submit'}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            type="button"
            disabled={isCtaDisabled}
            loading={isLoading}
            aria-disabled={isCtaDisabled}
            onClick={onNext}
          >
            Next
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <Card elevation="md" padding="lg">
        {renderStepIndicator()}

        {/* Polite live region for loading state (SC 4.1.3) */}
        {isLoading && (
          <div role="status" aria-live="polite" className={styles.srOnly}>
            Submitting your information
          </div>
        )}

        {/* Success alert for step completion */}
        {state === 'success' && !verificationStatus && (
          <Alert
            tone="success"
            title="Step completed successfully"
            role="status"
          />
        )}

        {/* Verification outcome — displayed inline, not modal */}
        {renderVerificationStatus()}

        {/* Loading spinner */}
        {isLoading && (
          <div className={styles.spinnerWrapper}>
            <Spinner size="md" aria-label="Processing, please wait" />
          </div>
        )}

        <form
          aria-labelledby={headingId}
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className={styles.form}
          noValidate
        >
          {renderStepHeading()}
          {renderStepContent()}
          {renderNavigation()}
        </form>
      </Card>
    </div>
  );
}
