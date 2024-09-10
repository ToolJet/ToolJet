import React, { useState, useEffect } from 'react';
import { OnboardingForm } from '@/modules/onboarding/components';
import { FormTextInput } from '@/modules/common/components';
import useInvitationsStore from '@/modules/onboarding/stores/invitationsStore';
import useOnboardingStore from '@/modules/onboarding/stores/onboardingStore';
import toast from 'react-hot-toast';
import { shallow } from 'zustand/shallow';
import { checkWorkspaceNameUniqueness } from '@/modules/onboarding/services/onboarding.service';
import { useEnterKeyPress } from '@/modules/common/hooks';
import '@/_styles/theme.scss';

const WorkspaceNameFormCE = () => {
  const { onboardUserOrCreateAdmin, initiatedInvitedUserOnboarding } = useInvitationsStore(
    (state) => ({
      onboardUserOrCreateAdmin: state.onboardUserOrCreateAdmin,
      initiatedInvitedUserOnboarding: state.initiatedInvitedUserOnboarding,
    }),
    shallow
  );
  const { setWorkspaceName, workspaceName, accountCreated } = useOnboardingStore(
    (state) => ({
      setWorkspaceName: state.setWorkspaceName,
      workspaceName: state.workspaceName,
      accountCreated: state.accountCreated,
    }),
    shallow
  );
  useEnterKeyPress(() => handleSubmit());

  const [formData, setFormData] = useState({ workspaceName: workspaceName || 'My workspace' });
  const [error, setError] = useState('');
  const [isFormValid, setIsFormValid] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const TITLE = 'Set up your workspace!';
  const description = 'Set up workspaces to manage users, applications & resources across various teams';

  useEffect(() => {
    const initializeWorkspaceName = async () => {
      if (initiatedInvitedUserOnboarding) {
        const isUnique = await isWorkspaceNameUnique(formData.workspaceName);
        if (!isUnique) {
          const timestamp = new Date().getTime();
          const newName = `My workspace ${timestamp}`;
          setFormData({ workspaceName: newName });
          setIsFormValid(true);
        }
      }
    };
    initializeWorkspaceName();
  }, [initiatedInvitedUserOnboarding]);

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
        console.log('inside', error);
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

export default WorkspaceNameFormCE;
