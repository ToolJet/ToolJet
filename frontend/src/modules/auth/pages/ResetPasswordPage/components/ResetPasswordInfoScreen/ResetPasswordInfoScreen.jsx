import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { OnboardingUIWrapper } from '@/modules/onboarding/components';
import { FormHeader } from '@/modules/common/components';
import { retrieveWhiteLabelText } from '@white-label/whiteLabelling';

const ResetPasswordInfoScreen = ({ organizationSlug, redirectTo }) => {
  const whiteLabelText = retrieveWhiteLabelText();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const message = `Your password has been reset successfully, log into ${whiteLabelText} to continue your session`;

  const loginPath = organizationSlug
    ? `/login/${organizationSlug}${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`
    : redirectTo
    ? `/login?redirectTo=${encodeURIComponent(redirectTo)}`
    : '/login';

  return (
    <div className="forgot-password-info-wrapper info-screen">
      <OnboardingUIWrapper>
        <FormHeader>Password has been reset</FormHeader>
        <p className="message" data-cy="reset-password-page-description">
          {message}
        </p>
        <div className="action-buttons pt-3">
          <button
            onClick={() =>
              navigate(loginPath, {
                state: { from: '/reset-password' },
              })
            }
            className="back-to-login-button"
            data-cy="back-to-login"
          >
            <span className="button-text">{t('forgotPasswordInfo.backToLogin', 'Back to login')}</span>
          </button>
        </div>
      </OnboardingUIWrapper>
    </div>
  );
};

export default ResetPasswordInfoScreen;
