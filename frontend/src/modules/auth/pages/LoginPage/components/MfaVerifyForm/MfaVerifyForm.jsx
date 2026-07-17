import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import { authenticationService } from '@/_services';
import { OnboardingUIWrapper, OnboardingFormInsideWrapper } from '@/modules/onboarding/components';
import { FormHeader, SubmitButton, OtpInput, TroubleSigningInModal } from '@/modules/common/components';
import './resources/styles/mfa-verify-form.styles.scss';

const SELF_HOSTED_RECOVERY_DOC_URL =
  'https://docs.tooljet.com/docs/user-management/authentication/self-hosted/super-admin-login';

const MfaVerifyForm = ({ mfaChallenge, onVerified, onError }) => {
  const { t } = useTranslation();
  const [otp, setOtp] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTroubleModal, setShowTroubleModal] = useState(false);

  useEffect(() => {
    if (mfaChallenge?.setupRequired && mfaChallenge?.otpauthUrl) {
      QRCode.toDataURL(mfaChallenge.otpauthUrl)
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(null));
    }
  }, [mfaChallenge]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit code from your authenticator app');
      return;
    }
    setIsLoading(true);
    authenticationService.verifyMfa(mfaChallenge.mfaToken, otp).then(
      (session) => {
        setIsLoading(false);
        onVerified(session);
      },
      (err) => {
        setIsLoading(false);
        setError(err?.error || 'Invalid code. Please try again');
        onError && onError();
      }
    );
  };

  return (
    <div className="mfa-verify-form">
      <OnboardingUIWrapper>
        <OnboardingFormInsideWrapper>
          <FormHeader>{t('loginSignupPage.twoFactorAuth', 'Two factor authentication')}</FormHeader>
          {mfaChallenge?.setupRequired ? (
            <>
              <p data-cy="mfa-setup-info">
                {t(
                  'loginSignupPage.mfaSetupInfo',
                  'Your admin requires two-factor authentication. Scan this QR code with your authenticator app, then enter the 6-digit code it shows.'
                )}
              </p>
              {qrDataUrl && (
                <div className="mfa-qr-wrapper">
                  <img src={qrDataUrl} alt="Two-factor authentication QR code" data-cy="mfa-qr-code" />
                </div>
              )}
              {mfaChallenge?.secret && (
                <p className="mfa-secret" data-cy="mfa-manual-secret">
                  {t('loginSignupPage.mfaManualEntry', 'Or enter this key manually:')}{' '}
                  <code>{mfaChallenge.secret}</code>
                </p>
              )}
            </>
          ) : (
            <p data-cy="mfa-verify-info">
              {t(
                'loginSignupPage.mfaVerifyInfo',
                'Enter the authentication code from your two-factor authentication app.'
              )}
            </p>
          )}
          <form onSubmit={handleSubmit} className="form-input-area">
            <div className="mb-3 mt-4">
              <OtpInput
                value={otp}
                onChange={(value) => {
                  setOtp(value);
                  setError('');
                }}
                error={!!error}
                errorText={error}
              />
            </div>
            <SubmitButton
              buttonText={t('loginSignupPage.submit', 'Submit')}
              disabled={otp.length !== 6 || isLoading}
              isLoading={isLoading}
            />
            <span
              className="mfa-trouble-link"
              data-cy="mfa-trouble-signing-in"
              onClick={() => setShowTroubleModal(true)}
            >
              {t('loginSignupPage.troubleSigningIn', 'Trouble signing in?')}
            </span>
          </form>
        </OnboardingFormInsideWrapper>
      </OnboardingUIWrapper>
      <TroubleSigningInModal
        show={showTroubleModal}
        onClose={() => setShowTroubleModal(false)}
        title={t('loginSignupPage.lostAccess', 'Lost access to your authenticator?')}
      >
        <p>
          {t(
            'loginSignupPage.lostAccessInfo',
            "Ask your workspace admin to reset your 2FA. If you're the only admin, follow our"
          )}{' '}
          <a href={SELF_HOSTED_RECOVERY_DOC_URL} target="_blank" rel="noreferrer">
            {t('loginSignupPage.selfHostedRecoveryGuide', 'self-hosted recovery guide')}
          </a>{' '}
          {t('loginSignupPage.lostAccessInfoEnd', 'to reset your 2FA from the server.')}
        </p>
      </TroubleSigningInModal>
    </div>
  );
};

export default MfaVerifyForm;
