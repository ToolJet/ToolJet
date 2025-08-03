import React, { useState, useEffect } from 'react';
import { OnboardingForm } from '@/modules/onboarding/components';
import { FormTextInput } from '@/modules/common/components';
import useInvitationsStore from '@/modules/onboarding/stores/invitationsStore';
import useOnboardingStore from '@/modules/common/helpers/onboardingStoreHelper';
import toast from 'react-hot-toast';
import { shallow } from 'zustand/shallow';
import { checkWorkspaceNameUniqueness } from '@/modules/onboarding/services/onboarding.service.ce';
import { useEnterKeyPress } from '@/modules/common/hooks';
import '@/_styles/theme.scss';

const generalDomains = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'protonmail.com',
  'pm.me',
  'aol.com',
  'zoho.com',
  'gmx.com',
  'gmx.de',
  'yandex.com',
  'yandex.ru',
  'mail.com',
];
const WorkspaceNameForm = () => {
  const { inviteeEmail, onboardUserOrCreateAdmin, initiatedInvitedUserOnboarding } = useInvitationsStore(
    (state) => ({
      onboardUserOrCreateAdmin: state.onboardUserOrCreateAdmin,
      initiatedInvitedUserOnboarding: state.initiatedInvitedUserOnboarding,
      inviteeEmail: state.inviteeEmail,
    }),
    shallow
  );
  const { adminDetails, setWorkspaceName, workspaceName, accountCreated } = useOnboardingStore(
    (state) => ({
      adminDetails: state.adminDetails,
      setWorkspaceName: state.setWorkspaceName,
      workspaceName: state.workspaceName,
      accountCreated: state.accountCreated,
    }),
    shallow
  );
  useEnterKeyPress(() => handleSubmit());

  const [formData, setFormData] = useState({ workspaceName: workspaceName });
  const [error, setError] = useState('');
  const [isFormValid, setIsFormValid] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const TITLE = 'Set up your workspace!';
  const description = 'Set up workspaces to manage users, applications & resources across various teams';
  useEffect(() => {
    const generateDefaultWorkspaceName = async (email) => {
      const timestamp = new Date().getTime();
      const isDefaultWorkspaceNameUnique = await isWorkspaceNameUnique('My workspace');
      const [localPart, domain] = email.split('@');

      if (!email || generalDomains.includes(domain)) {
        if (isDefaultWorkspaceNameUnique) {
          return 'My workspace';
        }
        return `My workspace ${timestamp}`;
      }
      const companyName = domain.split('.')[0];
      const trimmedCompanyName = companyName.substring(0, Math.min(companyName.length, 38));
      const isUnique = await isWorkspaceNameUnique(
        `${trimmedCompanyName.charAt(0).toUpperCase() + trimmedCompanyName.slice(1)}'s workspace`
      );
      if (isUnique) {
        return `${trimmedCompanyName.charAt(0).toUpperCase() + trimmedCompanyName.slice(1)}'s workspace`;
      }
      const trimmedCompanyNamee = companyName.substring(0, 22);
      return `${trimmedCompanyNamee.charAt(0).toUpperCase() + trimmedCompanyNamee.slice(1) + timestamp}'s workspace`;
    };
    const handleDefaultWorkspaceName = async () => {
      const defaultWorkspaceName = await generateDefaultWorkspaceName(adminDetails.email || inviteeEmail);
      setFormData({ workspaceName: defaultWorkspaceName });
      setIsFormValid(true);
    };
    if (!formData.workspaceName || formData.workspaceName === '') {
      handleDefaultWorkspaceName();
    }
  }, [adminDetails.email, inviteeEmail]);

  const isWorkspaceNameUnique = async (value) => {
    try {
      await checkWorkspaceNameUniqueness(value);
      setError('');
      return true;
    } catch (errResponse) {
      const error = {
        status: false,
        errorMsg: errResponse?.error || 'An unknown error occurred',
      };
      setError(error.errorMsg);
      return false;
    }
  };

  const handleInputChange = async (name, value) => {
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    setIsTouched(true);

    if (value.trim() === '') {
      setError('Workspace name is required');
      setIsFormValid(false);
    } else {
      const isUnique = await isWorkspaceNameUnique(value);
      setIsFormValid(isUnique);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (isFormValid) {
      setIsSubmitting(true);
      try {
        await setWorkspaceName(formData.workspaceName);
        await onboardUserOrCreateAdmin();
      } catch (error) {
        const errorMessage = error?.error || 'Something went wrong. Please try again.';
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <OnboardingForm
      title={TITLE}
      description={description}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      isFormValid={isFormValid}
    >
      <FormTextInput
        label="Workspace name"
        placeholder="Enter workspace name"
        value={formData.workspaceName}
        onChange={(e) => handleInputChange('workspaceName', e.target.value)}
        name="workspaceName"
        error={isTouched ? error : ''}
        dataCy="onboarding-workspace-name"
        required
        disabled={accountCreated}
        maxLength={50}
      />
    </OnboardingForm>
  );
};

export default WorkspaceNameForm;
