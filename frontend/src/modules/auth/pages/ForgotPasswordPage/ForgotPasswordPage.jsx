import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { authenticationService } from '@/_services';
import OnboardingBackgroundWrapper from '@/modules/onboarding/components/OnboardingBackgroundWrapper';
import { GeneralFeatureImage } from '@/modules/common/components';
import { ForgotPasswordForm, ForgotPasswordInfoScreen } from './components';

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const [showInfoScreen, setShowInfoScreen] = useState(false);
  const [email, setEmail] = useState('');

  const handleForgotPassword = async (email) => {
    try {
      await authenticationService.forgotPassword(email);
      toast.success(
        t('forgotPasswordPage.checkEmailForResetLink', 'Please check your email for the password reset link'),
        {
          id: 'toast-forgot-password-confirmation-code',
        }
      );
      setEmail(email);
      setShowInfoScreen(true);
    } catch (error) {
      toast.error(error.error || t('forgotPasswordPage.somethingWentWrong', 'Something went wrong, please try again'), {
        id: 'toast-forgot-password-email-error',
      });
    }
  };

  if (showInfoScreen) {
    return <OnboardingBackgroundWrapper MiddleComponent={() => <ForgotPasswordInfoScreen email={email} />} />;
  }

  return (
    <OnboardingBackgroundWrapper
      LeftSideComponent={() => <ForgotPasswordForm onSubmit={handleForgotPassword} />}
      RightSideComponent={GeneralFeatureImage}
    />
  );
};

export default ForgotPasswordPage;
