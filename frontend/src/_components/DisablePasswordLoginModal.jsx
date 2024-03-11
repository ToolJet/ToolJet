import React from 'react';
import Modal from '@/HomePage/Modal';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { Alert } from '@/_ui/Alert';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { copyToClipboard } from '@/_helpers/appUtils';

function DisablePasswordLoginModal({ show, disablePasswordLogin, setShowModal, reset }) {
  const handleDisable = () => {
    disablePasswordLogin();
    setShowModal(false);
  };

  const handleClose = () => {
    reset();
    setShowModal(false);
  };

  const copyFunction = (input) => {
    let text = document.getElementById(input).innerHTML;
    copyToClipboard(text);
  };

  const modalContent = (
    <div>
      <p>
        Please ensure SSO is configured successfully before disabling password login or else you will get locked out.
        Are you sure you want to continue?
      </p>
      <Alert
        svg="tj-info"
        cls="super-admin-login-info-banner justify-content-center"
        useDarkMode={false}
        imgHeight={'35px'}
        imgWidth={'35px'}
      >
        <div
          className="d-flex align-items-center justify-content-between"
          style={{
            fontSize: '12px',
            fontWeight: '400',
          }}
        >
          <div>
            {'Super admin can still access their account via '}
            <span
              style={{
                color: '#3E63DD',
              }}
            >
              {`${window.public_config?.TOOLJET_HOST}${
                window.public_config?.SUB_PATH ? window.public_config?.SUB_PATH : '/'
              }login/super-admin`}
            </span>
          </div>
          <SolidIcon name="copy" width="35" onClick={() => copyFunction('login-url')} />
        </div>
      </Alert>
    </div>
  );

  const modalFooter = (
    <>
      <ButtonSolid variant="tertiary" onClick={handleClose} data-cy="cancel-button">
        Cancel
      </ButtonSolid>
      <ButtonSolid variant={'dangerPrimary'} onClick={handleDisable}>
        Disable
      </ButtonSolid>
    </>
  );

  return (
    <Modal title="Disable password login" show={show} closeModal={handleClose} footerContent={modalFooter}>
      {modalContent}
    </Modal>
  );
}

export default DisablePasswordLoginModal;
