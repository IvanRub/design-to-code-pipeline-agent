import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { KycVerificationWizard, type KycVerificationWizardProps, type KycPersonalInfoField } from './KycVerificationWizard';

const meta: Meta<typeof KycVerificationWizard> = {
  title: 'Components/KycVerificationWizard',
  component: KycVerificationWizard,
};

export default meta;
type Story = StoryObj<typeof KycVerificationWizard>;

const baseFields: KycPersonalInfoField[] = [
  { name: 'fullName', label: 'Full name', value: '', required: true, hint: 'As it appears on your ID' },
  { name: 'dob', label: 'Date of birth', value: '', required: true },
];

const baseProps: KycVerificationWizardProps = {
  currentStep: 'personal-info',
  personalInfo: { fields: baseFields },
  document: { status: 'empty' },
  selfie: { status: 'empty' },
  verification: undefined,
  isBackDisabled: true,
  isNextDisabled: false,
  isNextLoading: false,
  onBack: () => {},
  onNext: () => {},
  onFieldChange: () => {},
  onDocumentDrop: () => {},
  onDocumentSelect: () => {},
  onDocumentRemove: () => {},
  onSelfieCapture: () => {},
};

function Wrapper(props: Partial<KycVerificationWizardProps>) {
  const [state] = useState<KycVerificationWizardProps>({ ...baseProps, ...props });
  return <KycVerificationWizard {...state} />;
}

export const StepPersonalInfo: Story = {
  render: () => <Wrapper currentStep="personal-info" />,
};

export const StepDocumentUpload: Story = {
  render: () => <Wrapper currentStep="document-upload" isBackDisabled={false} />,
};

export const StepSelfie: Story = {
  render: () => <Wrapper currentStep="selfie" isBackDisabled={false} />,
};

export const StepIndicatorCurrent: Story = {
  render: () => <Wrapper currentStep="personal-info" />,
};

export const StepIndicatorCompleted: Story = {
  render: () => <Wrapper currentStep="document-upload" isBackDisabled={false} />,
};

export const StepIndicatorUpcoming: Story = {
  render: () => <Wrapper currentStep="personal-info" />,
};

export const BackNavigation: Story = {
  render: () => <Wrapper currentStep="document-upload" isBackDisabled={false} />,
};

export const NextNavigation: Story = {
  render: () => <Wrapper currentStep="personal-info" isNextLoading />,
};

export const UploadEmpty: Story = {
  render: () => <Wrapper currentStep="document-upload" isBackDisabled={false} document={{ status: 'empty' }} />,
};

export const UploadDragActive: Story = {
  render: () => <Wrapper currentStep="document-upload" isBackDisabled={false} document={{ status: 'drag-active' }} />,
};

export const UploadFileSelected: Story = {
  render: () => (
    <Wrapper
      currentStep="document-upload"
      isBackDisabled={false}
      document={{ status: 'selected', file: { name: 'passport.pdf', size: 245678, type: 'application/pdf' } }}
    />
  ),
};

export const VerificationPendingReview: Story = {
  render: () => (
    <Wrapper
      currentStep="selfie"
      isBackDisabled={false}
      selfie={{ status: 'captured', imageUrl: 'https://placehold.co/240x240' }}
      verification={{ status: 'pending-review', message: 'Your submission is being reviewed.' }}
    />
  ),
};

export const VerificationApproved: Story = {
  render: () => (
    <Wrapper
      currentStep="selfie"
      isBackDisabled={false}
      selfie={{ status: 'captured', imageUrl: 'https://placehold.co/240x240' }}
      verification={{ status: 'approved', message: 'Your identity has been verified.' }}
    />
  ),
};

export const VerificationRejected: Story = {
  render: () => (
    <Wrapper
      currentStep="selfie"
      isBackDisabled={false}
      selfie={{ status: 'captured', imageUrl: 'https://placehold.co/240x240' }}
      verification={{ status: 'rejected', message: 'Your verification could not be completed.' }}
    />
  ),
};

export const Loading: Story = {
  render: () => (
    <Wrapper currentStep="document-upload" isBackDisabled={false} document={{ status: 'loading' }} />
  ),
};

export const ErrorState: Story = {
  render: () => (
    <Wrapper
      currentStep="document-upload"
      isBackDisabled={false}
      document={{ status: 'error', error: 'File exceeds 10MB limit.' }}
    />
  ),
};

export const Disabled: Story = {
  render: () => <Wrapper currentStep="personal-info" disabled isBackDisabled isNextDisabled />,
};

export const Focus: Story = {
  render: () => <Wrapper currentStep="personal-info" />,
};

export const Empty: Story = {
  render: () => <Wrapper currentStep="personal-info" />,
};

export const Success: Story = {
  render: () => (
    <Wrapper
      currentStep="document-upload"
      isBackDisabled={false}
      document={{ status: 'success', file: { name: 'passport.pdf', size: 245678, type: 'application/pdf' } }}
    />
  ),
};
