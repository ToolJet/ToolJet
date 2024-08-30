import React, { useState, useEffect } from 'react';
import { OnboardingForm } from '@/modules/onboarding/components';
import { FormTextInput } from '@/modules/common/components';
import useInvitationsStore from '@/modules/onboarding/stores/invitations.store';
import useOnboardingStore from '@/modules/onboarding/stores/onboarding.store';
import toast from 'react-hot-toast';
import { shallow } from 'zustand/shallow';
import { checkWorkspaceNameUniqueness } from '@/modules/onboarding/services/onboarding.service';
import { useEnterKeyPress } from '@/modules/common/hooks';
import '@/_styles/theme.scss';
import _ from 'lodash';

const WorkspaceNameForm = () => {
  const { onboardUserOrCreateAdmin } = useInvitationsStore(
    (state) => ({
      onboardUserOrCreateAdmin: state.onboardUserOrCreateAdmin,
    }),
    shallow
  );
  const { setWorkspaceName, workspaceName, accountCreated, companyName } = useOnboardingStore(
    (state) => ({
      setWorkspaceName: state.setWorkspaceName,
      workspaceName: state.workspaceName,
      accountCreated: state.accountCreated,
      companyName: state.companyInfo.companyName,
    }),
    shallow
  );
  useEnterKeyPress(() => handleSubmit());

  const [formData, setFormData] = useState({ workspaceName: workspaceName });
  const [error, setError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const TITLE = 'Set up your workspace!';
  const description = 'Set up workspaces to manage users, applications & resources across various teams';

  useEffect(() => {
    const fetchDefaultWorkspaceName = async () => {
      if (!formData.workspaceName) {
        // if the length of the company name > 38 characters --> trim it to 38 characters -- check if the name is unique after this - if unique then done
        // else -> if after this also the company name is not unique --> add iso to the company name and then append it
        const generateDefaultWorkspaceName = async () => {
          if (!companyName) {
            return 'My workspace';
          }
          const trimmedCompanyName = companyName.substring(0, Math.min(companyName.length, 38));
          const isUnique = await isWorkspaceNameUnique(
            `${trimmedCompanyName.charAt(0).toUpperCase() + trimmedCompanyName.slice(1)}'s workspace`
          );
          if (isUnique) {
            return `${trimmedCompanyName.charAt(0).toUpperCase() + trimmedCompanyName.slice(1)}'s workspace`;
          }
          const trimmedCompanyNamee = companyName.substring(0, 22);
          const timestamp = new Date().getTime();
          return `${
            trimmedCompanyNamee.charAt(0).toUpperCase() + trimmedCompanyNamee.slice(1) + timestamp
          }'s workspace`;
        };
        const defaultWorkspaceName = await generateDefaultWorkspaceName();
        setFormData({ workspaceName: defaultWorkspaceName });
      }
      setIsFormValid(true); // Set form as valid for the default name
    };
    fetchDefaultWorkspaceName();
  }, [companyName]);
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
