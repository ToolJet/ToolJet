import React from 'react';
import Modal from '@/HomePage/Modal';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

function DisablePasswordLoginModal({ show, disablePasswordLogin, setShowModal, reset }) {
  const handleDisable = () => {
    disablePasswordLogin();
    setShowModal(false);
  };

  const handleClose = () => {
    reset();
    setShowModal(false);
  };

  const modalContent = (
    <div>
      <p>Disable password login only if you have configured SSO or else you will get locked out.</p>
      <p>Are you sure you want to continue?</p>
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
