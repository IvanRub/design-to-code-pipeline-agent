import type { Meta, StoryObj } from '@storybook/react';
import { KycVerificationWizard } from './KycVerificationWizard';

const meta: Meta<typeof KycVerificationWizard> = {
  title: 'Components/KycVerificationWizard',
  component: KycVerificationWizard,
  parameters: {
    layout: 'padded',
  },
  args: {
    onNext: () => undefined,
    onBack: () => undefined,
    onSubmit: () => undefined,
    onFileSelect: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof KycVerificationWizard>;

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

/** State: default — step 1, no data, Next disabled */
export const Default: Story = {
  name: 'default',
  args: {
    state: 'default',
    activeStep: 1,
    personalInfo: basePersonalInfo,
    isStepFilled: false,
    verificationStatus: null,
  },
};

/** State: empty — isStepFilled=false, CTA disabled with hint */
export const Empty: Story = {
  name: 'empty',
  args: {
    state: 'default',
    activeStep: 1,
    personalInfo: basePersonalInfo,
    isStepFilled: false,
    verificationStatus: null,
  },
};

/** State: filled — isStepFilled=true, CTA active */
export const Filled: Story = {
  name: 'filled',
  args: {
    state: 'default',
    activeStep: 1,
    personalInfo: filledPersonalInfo,
    isStepFilled: true,
    verificationStatus: null,
  },
};

/** State: focus — all interactive elements show focus ring on :focus-visible */
export const Focus: Story = {
  name: 'focus',
  args: {
    state: 'default',
    activeStep: 1,
    personalInfo: basePersonalInfo,
    isStepFilled: false,
    verificationStatus: null,
  },
  parameters: {
    pseudo: { focusVisible: true },
  },
};

/** State: loading — all controls disabled, Spinner visible, live region announces */
export const Loading: Story = {
  name: 'loading',
  args: {
    state: 'loading',
    activeStep: 3,
    personalInfo: filledPersonalInfo,
    isStepFilled: true,
    verificationStatus: null,
  },
};

/** State: error — Alert summary + field errors shown */
export const Error: Story = {
  name: 'error',
  args: {
    state: 'error',
    activeStep: 1,
    personalInfo: basePersonalInfo,
    isStepFilled: false,
    fieldErrors: {
      firstName: 'First name is required.',
      lastName: 'Last name is required.',
      dateOfBirth: 'Date of birth is required.',
      nationality: 'Nationality is required.',
    },
    verificationStatus: null,
  },
};

/** State: success — step-advance confirmation alert */
export const Success: Story = {
  name: 'success',
  args: {
    state: 'success',
    activeStep: 2,
    personalInfo: filledPersonalInfo,
    isStepFilled: true,
    verificationStatus: null,
  },
};

/** State: disabled — all controls disabled, Back button removed on step 1 */
export const Disabled: Story = {
  name: 'disabled',
  args: {
    state: 'disabled',
    activeStep: 1,
    personalInfo: basePersonalInfo,
    isStepFilled: false,
    verificationStatus: null,
  },
};

/** State: step-personal-info — step 1 active */
export const StepPersonalInfo: Story = {
  name: 'step-personal-info',
  args: {
    state: 'default',
    activeStep: 1,
    personalInfo: basePersonalInfo,
    isStepFilled: false,
    verificationStatus: null,
  },
};

/** State: step-document-upload — step 2, idle upload zone */
export const StepDocumentUpload: Story = {
  name: 'step-document-upload',
  args: {
    state: 'default',
    activeStep: 2,
    personalInfo: filledPersonalInfo,
    documentUploadState: 'idle',
    isStepFilled: false,
    verificationStatus: null,
  },
};

/** State: step-selfie — step 3 */
export const StepSelfie: Story = {
  name: 'step-selfie',
  args: {
    state: 'default',
    activeStep: 3,
    personalInfo: filledPersonalInfo,
    isStepFilled: false,
    verificationStatus: null,
  },
};

/** State: document-upload-idle — drop zone ready */
export const DocumentUploadIdle: Story = {
  name: 'document-upload-idle',
  args: {
    state: 'default',
    activeStep: 2,
    personalInfo: filledPersonalInfo,
    documentUploadState: 'idle',
    isStepFilled: false,
    verificationStatus: null,
  },
};

/** State: document-upload-drag-over — drop zone highlighted */
export const DocumentUploadDragOver: Story = {
  name: 'document-upload-drag-over',
  args: {
    state: 'default',
    activeStep: 2,
    personalInfo: filledPersonalInfo,
    documentUploadState: 'drag-over',
    isStepFilled: false,
    verificationStatus: null,
  },
};

/** State: document-upload-uploading — Spinner + live region active */
export const DocumentUploadUploading: Story = {
  name: 'document-upload-uploading',
  args: {
    state: 'default',
    activeStep: 2,
    personalInfo: filledPersonalInfo,
    documentUploadState: 'uploading',
    isStepFilled: false,
    verificationStatus: null,
  },
};

/** State: document-upload-success — success Alert shown */
export const DocumentUploadSuccess: Story = {
  name: 'document-upload-success',
  args: {
    state: 'default',
    activeStep: 2,
    personalInfo: filledPersonalInfo,
    documentUploadState: 'success',
    isStepFilled: true,
    verificationStatus: null,
  },
};

/** State: document-upload-error — error Alert shown */
export const DocumentUploadError: Story = {
  name: 'document-upload-error',
  args: {
    state: 'default',
    activeStep: 2,
    personalInfo: filledPersonalInfo,
    documentUploadState: 'error',
    isStepFilled: false,
    verificationStatus: null,
  },
};

/** State: verification-pending — warning Alert inline */
export const VerificationPending: Story = {
  name: 'verification-pending',
  args: {
    state: 'success',
    activeStep: 3,
    personalInfo: filledPersonalInfo,
    isStepFilled: true,
    verificationStatus: 'pending',
  },
};

/** State: verification-approved — success Alert inline */
export const VerificationApproved: Story = {
  name: 'verification-approved',
  args: {
    state: 'success',
    activeStep: 3,
    personalInfo: filledPersonalInfo,
    isStepFilled: true,
    verificationStatus: 'approved',
  },
};

/** State: verification-rejected — error Alert with rejection reason */
export const VerificationRejected: Story = {
  name: 'verification-rejected',
  args: {
    state: 'error',
    activeStep: 3,
    personalInfo: filledPersonalInfo,
    isStepFilled: false,
    verificationStatus: 'rejected',
  },
};
