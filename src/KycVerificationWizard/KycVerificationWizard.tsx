import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react';
import { Alert, Button, Card, FormField, Icon, Input, Spinner } from '@acme/ui';
import styles from './KycVerificationWizard.module.css';

export type KycStep = 'personal-info' | 'document-upload' | 'selfie';

export interface KycPersonalInfoField {
  name: string;
  label: string;
  value: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export interface KycPersonalInfo {
  fields: KycPersonalInfoField[];
}

export type KycDocumentStatus = 'empty' | 'drag-active' | 'selected' | 'loading' | 'error' | 'success';

export interface KycDocument {
  status: KycDocumentStatus;
  file?: { name: string; size: number; type: string };
  error?: string;
}

export type KycSelfieStatus = 'empty' | 'captured' | 'loading' | 'error';

export interface KycSelfie {
  status: KycSelfieStatus;
  imageUrl?: string;
  error?: string;
}

export type KycVerificationStatus = 'pending-review' | 'approved' | 'rejected';

export interface KycVerification {
  status: KycVerificationStatus;
  message?: string;
}

export interface KycVerificationWizardProps {
  currentStep: KycStep;
  personalInfo: KycPersonalInfo;
  document: KycDocument;
  selfie: KycSelfie;
  verification?: KycVerification;
  isBackDisabled: boolean;
  isNextDisabled: boolean;
  isNextLoading: boolean;
  onBack: () => void;
  onNext: () => void;
  onFieldChange: (name: string, value: string) => void;
  onDocumentDrop: (files: FileList) => void;
  onDocumentSelect: (files: FileList) => void;
  onDocumentRemove: () => void;
  onSelfieCapture: (image: File | Blob) => void;
  disabled?: boolean;
}

const STEP_ORDER: KycStep[] = ['personal-info', 'document-upload', 'selfie'];

const STEP_LABELS: Record<KycStep, string> = {
  'personal-info': 'Personal information',
  'document-upload': 'Document upload',
  selfie: 'Selfie verification',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * A 3-step KYC identity verification wizard (personal info, document upload, selfie)
 * ending in a pending-review / approved / rejected verification outcome. Fully
 * prop-driven state machine; every visual state is reachable via props.
 */
export function KycVerificationWizard({
  currentStep,
  personalInfo,
  document: documentState,
  selfie,
  verification,
  isBackDisabled,
  isNextDisabled,
  isNextLoading,
  onBack,
  onNext,
  onFieldChange,
  onDocumentDrop,
  onDocumentSelect,
  onDocumentRemove,
  onSelfieCapture,
  disabled = false,
}: KycVerificationWizardProps) {
  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const headingId = 'kyc-step-heading';

  // Focus the step heading on every step transition so keyboard/AT users are never stranded.
  useEffect(() => {
    headingRef.current?.focus();
  }, [currentStep]);

  const stepHeadingText = useMemo(() => {
    const stepNumber = currentStepIndex + 1;
    return `Step ${stepNumber} of ${STEP_ORDER.length}: ${STEP_LABELS[currentStep]}`;
  }, [currentStep, currentStepIndex]);

  const handleFieldBlur = (name: string) => {
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
  };

  const handleDropzoneKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleDropzoneDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files.length > 0) {
      onDocumentDrop(event.dataTransfer.files);
    }
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onDocumentSelect(event.target.files);
    }
  };

  const handleRemoveFile = () => {
    onDocumentRemove();
    dropzoneRef.current?.focus();
  };

  const handleSelfieInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onSelfieCapture(event.target.files[0]);
    }
  };

  const dropzoneDescriptionId = 'kyc-dropzone-description';
  const dropzoneErrorId = 'kyc-dropzone-error';
  const isDropzoneDisabled = disabled || documentState.status === 'loading';

  return (
    <div
      className={styles.root}
      role="form"
      aria-labelledby={headingId}
      data-disabled={disabled || undefined}
    >
      <ol className={styles.stepIndicator} aria-label="Verification progress">
        {STEP_ORDER.map((step, index) => {
          const isCurrent = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;
          const isUpcoming = index > currentStepIndex;
          const segmentClassName = [
            styles.stepSegment,
            isCurrent ? styles.stepSegmentCurrent : '',
            isCompleted ? styles.stepSegmentCompleted : '',
            isUpcoming ? styles.stepSegmentUpcoming : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <li key={step} className={segmentClassName} aria-current={isCurrent ? 'step' : undefined}>
              <span className={styles.stepSegmentMarker} aria-hidden="true">
                {isCompleted ? <Icon name="check" size={14} aria-hidden /> : index + 1}
              </span>
              <span className={styles.stepSegmentLabel}>{STEP_LABELS[step]}</span>
              <span className={styles.visuallyHidden}>
                {STEP_LABELS[step]}, {isCurrent ? 'current step' : isCompleted ? 'completed' : 'upcoming'}
              </span>
            </li>
          );
        })}
      </ol>

      <Card elevation="sm" padding="lg">
        <h2 id={headingId} ref={headingRef} tabIndex={-1} className={styles.stepHeading}>
          {stepHeadingText}
        </h2>

        {currentStep === 'personal-info' && (
          <div className={styles.fieldsGrid}>
            {personalInfo.fields.map((field) => {
              const fieldId = `kyc-field-${field.name}`;
              const isTouched = touchedFields[field.name];
              const showError = isTouched && Boolean(field.error);
              return (
                <FormField
                  key={field.name}
                  label={field.label}
                  htmlFor={fieldId}
                  error={showError ? field.error : undefined}
                  hint={!showError ? field.hint : undefined}
                  required={field.required}
                >
                  <Input
                    value={field.value}
                    disabled={disabled}
                    invalid={showError}
                    aria-describedby={
                      showError
                        ? `${fieldId}-error`
                        : field.hint
                          ? `${fieldId}-hint`
                          : undefined
                    }
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      onFieldChange(field.name, event.target.value)
                    }
                    onBlur={() => handleFieldBlur(field.name)}
                  />
                </FormField>
              );
            })}
          </div>
        )}

        {currentStep === 'document-upload' && (
          <div className={styles.uploadSection}>
            <p id={dropzoneDescriptionId} className={styles.dropzoneDescription}>
              Accepted file types: PDF, JPG, PNG. Maximum size: 10MB.
            </p>

            {documentState.status !== 'selected' && documentState.status !== 'success' && (
              <div
                ref={dropzoneRef}
                role="button"
                tabIndex={isDropzoneDisabled ? -1 : 0}
                aria-disabled={isDropzoneDisabled || undefined}
                aria-label="Drag and drop or browse. PDF, JPG, PNG. Max 10MB."
                aria-describedby={
                  documentState.status === 'error'
                    ? `${dropzoneDescriptionId} ${dropzoneErrorId}`
                    : dropzoneDescriptionId
                }
                className={[
                  styles.dropzone,
                  documentState.status === 'drag-active' ? styles.dropzoneActive : '',
                  documentState.status === 'error' ? styles.dropzoneError : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => !isDropzoneDisabled && fileInputRef.current?.click()}
                onKeyDown={handleDropzoneKeyDown}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDropzoneDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className={styles.visuallyHiddenInput}
                  disabled={isDropzoneDisabled}
                  onChange={handleFileInputChange}
                  aria-hidden="true"
                  tabIndex={-1}
                />
                {documentState.status === 'loading' ? (
                  <div role="status" aria-live="polite" className={styles.loadingRow}>
                    <Spinner size="md" aria-label="Uploading document…" />
                    <span>Uploading document…</span>
                  </div>
                ) : (
                  <span className={styles.dropzoneText}>Drag and drop your document here, or browse</span>
                )}
              </div>
            )}

            {documentState.status === 'drag-active' && (
              <span role="status" className={styles.visuallyHidden}>
                Drop to upload
              </span>
            )}

            {documentState.status === 'error' && documentState.error && (
              <Alert tone="error" role="alert" title="Upload failed">
                <span id={dropzoneErrorId}>{documentState.error}</span>
              </Alert>
            )}

            {(documentState.status === 'selected' || documentState.status === 'success') && documentState.file && (
              <div className={styles.fileRow}>
                <div className={styles.fileInfo}>
                  {documentState.status === 'success' && (
                    <Icon name="check-circle" size={18} aria-hidden />
                  )}
                  <span className={styles.fileName}>{documentState.file.name}</span>
                  <span className={styles.fileSize}>{formatBytes(documentState.file.size)}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  disabled={disabled}
                  onClick={handleRemoveFile}
                  aria-label={`Remove ${documentState.file.name}`}
                >
                  <Icon name="trash" size={16} aria-hidden />
                </Button>
                {documentState.status === 'success' && (
                  <span role="status" className={styles.visuallyHidden}>
                    Document uploaded successfully
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {currentStep === 'selfie' && (
          <div className={styles.selfieSection}>
            {selfie.status === 'empty' && (
              <Button
                variant="secondary"
                size="md"
                type="button"
                disabled={disabled}
                onClick={() => selfieInputRef.current?.click()}
              >
                Capture or upload selfie
              </Button>
            )}

            {selfie.status === 'loading' && (
              <div role="status" aria-live="polite" className={styles.loadingRow}>
                <Spinner size="md" aria-label="Verifying identity…" />
                <span>Verifying identity…</span>
              </div>
            )}

            {selfie.status === 'captured' && selfie.imageUrl && (
              <img src={selfie.imageUrl} alt="Captured selfie preview" className={styles.selfiePreview} />
            )}

            {selfie.status === 'error' && selfie.error && (
              <Alert tone="error" role="alert" title="Selfie capture failed">
                {selfie.error}
              </Alert>
            )}

            <input
              ref={selfieInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className={styles.visuallyHiddenInput}
              disabled={disabled}
              onChange={handleSelfieInputChange}
              aria-hidden="true"
              tabIndex={-1}
            />

            {verification && (
              <div className={styles.verificationPanel}>
                {verification.status === 'pending-review' && (
                  <Alert tone="warning" role="status" title="Verification pending review">
                    {verification.message ?? 'Your submission is being reviewed.'}
                  </Alert>
                )}
                {verification.status === 'approved' && (
                  <Alert tone="success" role="status" title="Verification approved">
                    {verification.message ?? 'Your identity has been verified.'}
                  </Alert>
                )}
                {verification.status === 'rejected' && (
                  <Alert tone="error" role="alert" title="Verification rejected">
                    {verification.message ?? 'Your verification could not be completed.'}
                  </Alert>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      <div className={styles.navigation}>
        <Button
          variant="secondary"
          size="md"
          type="button"
          disabled={isBackDisabled || disabled}
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          variant="primary"
          size="md"
          type="button"
          disabled={isNextDisabled || disabled}
          loading={isNextLoading}
          onClick={onNext}
        >
          {isNextLoading && (
            <span role="status" aria-live="polite" className={styles.visuallyHidden}>
              <Spinner size="sm" aria-label="Validating…" />
              Validating…
            </span>
          )}
          Next
        </Button>
      </div>
    </div>
  );
}
