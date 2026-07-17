import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import QRCode from 'qrcode';
import { authenticationService, userService } from '@/_services';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import ModalBase from '@/_ui/Modal';
import { OtpInput } from '@/modules/common/components';
import './resources/styles/two-factor-auth-card.styles.scss';

function TwoFactorAuthCard({ darkMode }) {
  const { t } = useTranslation();
  const [available, setAvailable] = useState(false);
  const [checking, setChecking] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [confirmInProgress, setConfirmInProgress] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  const [disableOtp, setDisableOtp] = useState('');
  const [disableOtpError, setDisableOtpError] = useState('');
  const [disableInProgress, setDisableInProgress] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);

  const fetchStatus = () => {
    Promise.all([authenticationService.getUserDetails(), userService.getMfaSetup()])
      .then(([userDetails, mfaSetup]) => {
        setAvailable(true);
        setMfaEnabled(!!userDetails?.mfaEnabled);
        setSetupData(mfaSetup);
      })
      .catch(() => setAvailable(false))
      .finally(() => setChecking(false));
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (setupData?.otpauthUrl) {
      QRCode.toDataURL(setupData.otpauthUrl)
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(null));
    }
  }, [setupData]);

  const openSetupModal = () => {
    setOtp('');
    setOtpError('');
    setShowSetupModal(true);
    // Refresh the QR/secret each time the modal opens (cheap, stateless, no side effects server-side)
    userService.getMfaSetup().then(setSetupData);
  };

  const confirmSetup = () => {
    if (!/^\d{6}$/.test(otp)) {
      setOtpError('Enter the 6-digit code from your authenticator app');
      return;
    }
    setConfirmInProgress(true);
    userService
      .confirmMfaSetup(otp)
      .then(() => {
        toast.success('Two-factor authentication is now activated', { position: 'top-center' });
        setMfaEnabled(true);
        setShowSetupModal(false);
        setConfirmInProgress(false);
      })
      .catch((error) => {
        setOtpError(error?.data?.message || 'Invalid code. Please try again');
        setConfirmInProgress(false);
      });
  };

  const openDisableModal = () => {
    setDisableOtp('');
    setDisableOtpError('');
    setShowDisableModal(true);
  };

  const confirmDisable = () => {
    if (!/^\d{6}$/.test(disableOtp)) {
      setDisableOtpError('Enter the 6-digit code from your authenticator app');
      return;
    }
    setDisableInProgress(true);
    userService
      .disableMfa(disableOtp)
      .then(() => {
        toast.success('Two-factor authentication disabled successfully!', { position: 'top-center' });
        setMfaEnabled(false);
        setShowDisableModal(false);
        setDisableInProgress(false);
        fetchStatus();
      })
      .catch((error) => {
        setDisableOtpError(error?.data?.message || 'Invalid code. Please try again');
        setDisableInProgress(false);
      });
  };

  if (checking || !available) {
    return null;
  }

  return (
    <div className="card profile-page-card tw-mt-16 two-factor-auth-card">
      <div className="card-header">
        <div className="two-factor-auth-card-title">
          <SolidIcon name="lock" width="16" />
          <h3 className="card-title" data-cy="card-title-two-factor-auth">
            {t('header.profileSettingPage.twoFactorAuth', 'Two factor authentication')}
          </h3>
        </div>
        <span className={cx('two-factor-auth-status-pill', { active: mfaEnabled })} data-cy="mfa-status-pill">
          {mfaEnabled ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div className="card-body">
        <p className="two-factor-auth-label" data-cy="mfa-method-label">
          Authenticator app (TOTP)
        </p>
        <p className="two-factor-auth-description" data-cy="mfa-method-description">
          Use an app like 1Password, Google Authenticator, or Microsoft Authenticator.
        </p>
        {mfaEnabled ? (
          <div className="two-factor-auth-actions">
            <ButtonSolid variant="secondary" onClick={openSetupModal} data-cy="mfa-reset-button">
              Reset
            </ButtonSolid>
            <ButtonSolid variant="secondary" onClick={openDisableModal} data-cy="mfa-disable-button">
              Disable
            </ButtonSolid>
          </div>
        ) : (
          <ButtonSolid onClick={openSetupModal} data-cy="mfa-add-app-button">
            Add app
          </ButtonSolid>
        )}
      </div>

      {showSetupModal && (
        <ModalBase
          show={showSetupModal}
          handleClose={() => setShowSetupModal(false)}
          darkMode={darkMode}
          title="Set up authenticator app"
          handleConfirm={confirmSetup}
          confirmBtnProps={{ title: 'Submit', isLoading: confirmInProgress, disabled: otp.length !== 6 }}
        >
          <p data-cy="mfa-setup-instructions">
            Scan the QR code with your authenticator app. Enter the 6-digit code to finish setup, or copy the secret if
            you can&rsquo;t scan it.
          </p>
          {qrDataUrl && (
            <div className="two-factor-auth-qr-wrapper">
              <img src={qrDataUrl} alt="Two-factor authentication QR code" data-cy="mfa-qr-code" />
            </div>
          )}
          {setupData?.secret && (
            <p className="two-factor-auth-secret" data-cy="mfa-manual-secret">
              <code>{setupData.secret}</code>
            </p>
          )}
          <OtpInput
            value={otp}
            onChange={(value) => {
              setOtp(value);
              setOtpError('');
            }}
            error={!!otpError}
            errorText={otpError}
            centered
          />
        </ModalBase>
      )}

      {showDisableModal && (
        <ModalBase
          show={showDisableModal}
          handleClose={() => setShowDisableModal(false)}
          darkMode={darkMode}
          title="Disable two-factor authentication"
          handleConfirm={confirmDisable}
          confirmBtnProps={{
            title: 'Submit',
            isLoading: disableInProgress,
            disabled: disableOtp.length !== 6,
            variant: 'dangerPrimary',
          }}
        >
          <p data-cy="mfa-disable-instructions">Enter your current authentication code to disable 2FA.</p>
          <OtpInput
            value={disableOtp}
            onChange={(value) => {
              setDisableOtp(value);
              setDisableOtpError('');
            }}
            error={!!disableOtpError}
            errorText={disableOtpError}
          />
        </ModalBase>
      )}
    </div>
  );
}

export { TwoFactorAuthCard };
