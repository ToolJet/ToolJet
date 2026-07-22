import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { authenticationService } from '@/_services';
import OnboardingBackgroundWrapper from '@/modules/onboarding/components/OnboardingBackgroundWrapper';
import LoginPageRightPanel from '@/modules/auth/components/LoginPageRightPanel/LoginPageRightPanel';
import { useWhiteLabellingStore } from '@/_stores/whiteLabellingStore';
import { fetchWhiteLabelDetails } from '@white-label/whiteLabelling';
import { validateEmail } from '@/_helpers/utils';
import { OnboardingUIWrapper, OnboardingFormInsideWrapper } from '@/modules/onboarding/components';
import { FormTextInput, SubmitButton, FormHeader } from '@/modules/common/components';
import { ForgotPasswordInfoScreen } from '../ForgotPasswordPage/components';

const PasswordExpiredForm = ({ initialEmail, onSuccess, redirectTo, orgSlug }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState(initialEmail || '');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (isDirty) {
      setEmailError(email.trim() ? (validateEmail(email) ? '' : 'Email is invalid') : 'Email is required');
    }
  }, [email, isDirty]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsDirty(true);
    if (!validateEmail(email)) {
      setEmailError('Email is invalid');
      return;
    }
    setIsLoading(true);
    try {
      await authenticationService.passwordExpiredReset(email, redirectTo, orgSlug);
      onSuccess(email);
    } catch {
      toast.error(t('passwordExpiredPage.somethingWentWrong', 'Something went wrong, please try again'), {
        id: 'toast-password-expired-error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingUIWrapper>
      <OnboardingFormInsideWrapper>
        <div className="forgot-password-form">
          <FormHeader>{t('passwordExpiredPage.title', 'Password expired')}</FormHeader>
          <p className="forgot-password-form-signup-redirect" data-cy="password-expired-description">
            {t(
              'passwordExpiredPage.description',
              'Your password has expired and needs to be reset before you can sign in.'
            )}
          </p>
          <form onSubmit={handleSubmit} className="form-input-area">
            <FormTextInput
              type="email"
              label={t('passwordExpiredPage.emailAddress', 'Email')}
              placeholder={t('passwordExpiredPage.enterEmailAddress', 'Enter email address')}
              onChange={(e) => {
                setEmail(e.target.value);
                setIsDirty(true);
              }}
              value={email}
              name="email"
              error={emailError}
              dataCy="email-input-field"
            />
            <SubmitButton
              buttonText={t('passwordExpiredPage.sendResetLink', 'Send a reset link')}
              disabled={!validateEmail(email) || isLoading}
              isLoading={isLoading}
            />
          </form>
        </div>
      </OnboardingFormInsideWrapper>
    </OnboardingUIWrapper>
  );
};

const PasswordExpiredPage = () => {
  const [searchParams] = useSearchParams();
  const [showInfoScreen, setShowInfoScreen] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const initialEmail = searchParams.get('email') || '';
  const orgSlug = searchParams.get('oid') || null;
  const appSlug = searchParams.get('appSlug') || null;
  const redirectTo = searchParams.get('redirectTo') || null;
  // For app password-expired flow, synthesize redirectTo so the reset email uses AppResetPasswordPage
  const effectiveRedirectTo = redirectTo || (appSlug ? `/applications/${appSlug}` : null);

  useEffect(() => {
    const fetchWhiteLabel = async () => {
      const settings = await fetchWhiteLabelDetails();
      useWhiteLabellingStore.setState({ whiteLabellingSettings: settings });
    };
    fetchWhiteLabel();
  }, []);

  const handleSuccess = (email) => {
    setSubmittedEmail(email);
    setShowInfoScreen(true);
  };

  if (showInfoScreen) {
    return (
      <OnboardingBackgroundWrapper
        MiddleComponent={() => (
          <ForgotPasswordInfoScreen
            email={submittedEmail}
            organizationSlug={orgSlug}
            appSlug={appSlug}
            redirectTo={redirectTo}
          />
        )}
      />
    );
  }

  return (
    <OnboardingBackgroundWrapper
      LeftSideComponent={() => (
        <PasswordExpiredForm
          initialEmail={initialEmail}
          onSuccess={handleSuccess}
          redirectTo={effectiveRedirectTo}
          orgSlug={orgSlug}
        />
      )}
      RightSideComponent={LoginPageRightPanel}
    />
  );
};

export default PasswordExpiredPage;
