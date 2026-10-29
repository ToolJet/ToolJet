import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { authenticationService } from '@/_services';
import OnboardingBackgroundWrapper from '@/modules/onboarding/components/OnboardingBackgroundWrapper';
import LoginPageRightPanel from '@/modules/auth/components/LoginPageRightPanel/LoginPageRightPanel';
import { ForgotPasswordForm, ForgotPasswordInfoScreen } from '../ForgotPasswordPage/components';

const AppForgotPasswordPage = () => {
  const { t } = useTranslation();
  const { slug } = useParams();
  const [showInfoScreen, setShowInfoScreen] = useState(false);
  const [email, setEmail] = useState('');

  // Preserve app redirect context through the password reset flow
  const searchParams = new URLSearchParams(window.location.search);
  const redirectToParam = searchParams.get('redirectTo');
  const redirectTo = redirectToParam?.startsWith('/applications/') ? redirectToParam : `/applications/${slug}`;

  const handleForgotPassword = async (email) => {
    try {
      await authenticationService.forgotPassword(email, redirectTo);
      toast.success(
        t('forgotPasswordPage.checkEmailForResetLink', 'Please check your email for the password reset link'),
        { id: 'toast-forgot-password-confirmation-code' }
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
    return (
      <OnboardingBackgroundWrapper
        MiddleComponent={() => <ForgotPasswordInfoScreen email={email} appSlug={slug} redirectTo={redirectTo} />}
      />
    );
  }

  return (
    <OnboardingBackgroundWrapper
      LeftSideComponent={() => <ForgotPasswordForm onSubmit={handleForgotPassword} appSlug={slug} />}
      RightSideComponent={LoginPageRightPanel}
    />
  );
};

export default AppForgotPasswordPage;
