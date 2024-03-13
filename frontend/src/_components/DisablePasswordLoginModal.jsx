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
