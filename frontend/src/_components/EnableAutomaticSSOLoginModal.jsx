import React from 'react';
import Modal from '@/HomePage/Modal';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { Alert } from '@/_ui/Alert';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { copyToClipboard } from '@/_helpers/appUtils';

function EnableAutomaticSSOLoginModal({ show, enableAutomaticSSOLogin, setShowModal, reset }) {
  const handleEnable = () => {
    enableAutomaticSSOLogin();
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
      <p data-cy="modal-message">
        Enabling automatic login will trigger the configured SSO login automatically, avoiding the ToolJet login screen
        altogether. Are you sure you want to continue?
        <br />
        <br />
        <a
          href="https://docs.tooljet.com/docs/user-authentication/sso/auto-sso-login/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#3E63DD',
            textDecoration: 'underline',
          }}
          data-cy="superadmin-login-link"
        >
          {` Read documentation `}
        </a>
        to know more.
      </p>
    </div>
  );

  const modalFooter = (
    <>
      <ButtonSolid variant="tertiary" onClick={handleClose} data-cy="cancel-button">
        Cancel
      </ButtonSolid>
      <ButtonSolid variant={'primary'} onClick={handleEnable} data-cy="confirmation-button">
        Enable
      </ButtonSolid>
    </>
  );

  return (
    <Modal title="Automatic SSO login" show={show} closeModal={handleClose} footerContent={modalFooter}>
      {modalContent}
    </Modal>
  );
}

export default EnableAutomaticSSOLoginModal;
