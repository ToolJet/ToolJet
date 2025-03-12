import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../HomePage/Modal';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { userService } from '@/_services';
import EyeHide from '@/../assets/images/onboardingassets/Icons/EyeHide';
import EyeShow from '@/../assets/images/onboardingassets/Icons/EyeShow';
import CopyToClipboardComponent from './CopyToClipboard';

export function ResetPasswordModal({ darkMode = false, closeModal, show, user }) {
  const [passwordOption, setPasswordOption] = useState('auto');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [showPasswordSuccessModal, setShowPasswordSuccessModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [helperText, setHelperText] = useState('Password should be at least 5 characters');
  const [validPassword, setValidPassword] = useState(true);

  useEffect(() => {
    if (show) {
      setPasswordOption('auto');
      setPassword('');
    }
  }, [show]);

  const isDisabled = useMemo(() => {
    return isLoading || (passwordOption === 'manual' && password.length < 5);
  }, [isLoading, passwordOption, password]);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const handlePasswordInput = (input) => {
    setPassword(input);
    if (input.length > 100) {
      setHelperText('Password should be Max 100 characters');
      setValidPassword(false);
    } else if (input.length < 5) {
      setHelperText('Password should be at least 5 characters');
      setValidPassword(false);
    } else {
      setHelperText('Password should be at least 5 characters');
      setValidPassword(true);
    }
  };

  const handleResetPassword = async () => {
    setIsLoading(true);
    try {
      if (passwordOption === 'auto') {
        // Generate an automatic password
        const generatedPassword = await userService.generateUserPassword(user.id);
        setGeneratedPassword(generatedPassword?.newPassword);
        setShowPasswordSuccessModal(true);
        toast.success(`Password reset successful`);
      } else {
        // Use the manually entered password
        await userService.changeUserPassword(user.id, password);
        toast.success('Password reset successful');
        closeModal();
      }
    } catch (error) {
      toast.error('Password could not be reset. Please try again!');
      closeModal();
    } finally {
      setIsLoading(false);
    }
  };

  const closeSuccessModal = () => {
    setShowPasswordSuccessModal(false);
    closeModal();
  };

  return (
    <>
      <Modal
        show={show && !showPasswordSuccessModal}
        closeModal={() => {
          if (!showPasswordSuccessModal) {
            closeModal();
          }
        }}
        title="Reset password"
        headerContent={
          <p style={{ marginBottom: '0px', color: '#687076' }} data-cy="user-email">
            {user?.email}
          </p>
        }
        footerContent={
          <>
            <ButtonSolid variant="tertiary" onClick={closeModal} data-cy="cancel-button">
              Cancel
            </ButtonSolid>
            <ButtonSolid onClick={handleResetPassword} disabled={isDisabled || !validPassword} data-cy="reset-button">
              {isLoading ? 'Resetting...' : 'Reset'}
            </ButtonSolid>
          </>
        }
      >
        <div className="row workspace-folder-modal mb-3">
          <div className="col modal-main tj-app-input">
            <div>
              <label className="form-check-label" data-cy="automatically-generate-a-password-label">
                <input
                  type="radio"
                  name="passwordOption"
                  value="auto"
                  checked={passwordOption === 'auto'}
                  onChange={() => setPasswordOption('auto')}
                  style={{ marginRight: '8px', marginBottom: '3px', marginTop: '3px' }}
                  data-cy="automatically-generate-a-password-input"
                />
                Automatically generate a password
              </label>
              <small>
                <div style={{ marginLeft: '20px', color: '#687076' }} data-cy="helper-text">
                  You will be able to view and copy the password in the next step
                </div>
              </small>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label className="form-check-label" data-cy="create-password-label">
                <input
                  type="radio"
                  name="passwordOption"
                  value="manual"
                  checked={passwordOption === 'manual'}
                  onChange={() => setPasswordOption('manual')}
                  style={{ marginRight: '8px', marginBottom: '3px', marginTop: '3px' }}
                  data-cy="create-password-input"
                />
                Create password
              </label>
              <div style={{ marginLeft: '20px', color: '#687076' }}>
                {passwordOption === 'manual' && (
                  <div>
                    <div className="tj-text-input-wrapper">
                      <div className="login-password signup-password-wrapper">
                        <input
                          onChange={(e) => handlePasswordInput(e.target.value)}
                          name="password"
                          type={isPasswordVisible ? 'text' : 'password'}
                          className="tj-text-input"
                          placeholder={'Enter password'}
                          autoComplete="new-password"
                          data-cy="password-input"
                        />
                        <div
                          className="signup-password-hide-img"
                          onClick={togglePasswordVisibility}
                          data-cy="show-password-icon"
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            cursor: 'pointer',
                            marginRight: '10px',
                          }}
                        >
                          {isPasswordVisible ? (
                            <EyeShow
                              fill={
                                darkMode
                                  ? password?.length
                                    ? '#D1D5DB'
                                    : '#656565'
                                  : password?.length
                                  ? '#384151'
                                  : '#D1D5DB'
                              }
                            />
                          ) : (
                            <EyeHide
                              fill={
                                darkMode
                                  ? password?.length
                                    ? '#D1D5DB'
                                    : '#656565'
                                  : password?.length
                                  ? '#384151'
                                  : '#D1D5DB'
                              }
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    <small style={{ color: !validPassword ? 'red' : undefined }} data-cy="password-helper-text">
                      {helperText}
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>
      {showPasswordSuccessModal && (
        <Modal
          show={true}
          closeModal={closeSuccessModal}
          title="Reset password"
          footerContent={
            <ButtonSolid onClick={closeSuccessModal} data-cy="done-button">
              Done
            </ButtonSolid>
          }
        >
          <label className="form-check-label" data-cy="password-label">
            Password
          </label>
          <div className="tj-text-input-icon-wrapper">
            <div className="login-password signup-password-wrapper">
              <input
                type={isPasswordVisible ? 'text' : 'password'}
                className="tj-text-input"
                value={generatedPassword}
                readOnly
                data-cy="password-input"
              />
              <div
                className="icon-wrapper"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: '36px',
                  right: '3px',
                  width: '36px',
                }}
              >
                <div
                  onClick={togglePasswordVisibility}
                  className="signup-password-hide-img"
                  data-cy="show-password-icon"
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    marginRight: '30px',
                  }}
                >
                  {isPasswordVisible ? (
                    <EyeShow
                      fill={
                        darkMode ? (password?.length ? '#D1D5DB' : '#656565') : password?.length ? '#384151' : '#D1D5DB'
                      }
                    />
                  ) : (
                    <EyeHide
                      fill={
                        darkMode ? (password?.length ? '#D1D5DB' : '#656565') : password?.length ? '#384151' : '#D1D5DB'
                      }
                    />
                  )}
                </div>
                <div style={{ height: '38px', margin: '0 0px', width: '1px', backgroundColor: '#D1D5DB' }} />
                <div>
                  <CopyToClipboardComponent
                    data={generatedPassword}
                    callback={() => generatedPassword}
                    useCopyIcon={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
