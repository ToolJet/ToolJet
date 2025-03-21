import React from 'react';
import Modal from '@/HomePage/Modal';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

function ConfirmDisableLastSSOModal({ show, onConfirm, onCancel, lastSSOKey }) {
  const handleConfirm = () => {
    onConfirm(lastSSOKey, false);
  };

  const handleClose = () => {
    onCancel();
  };

  const modalContent = (
    <div>
      <p data-cy="modal-message">
        Automatic login requires one SSO to be enabled. Disabling this SSO will also disable automatic login. Are you
        sure you want to continue?
        <br />
      </p>
    </div>
  );

  const modalFooter = (
    <>
      <ButtonSolid variant="tertiary" onClick={handleClose} data-cy="cancel-button">
        Cancel
      </ButtonSolid>
      <ButtonSolid variant={'primary'} onClick={handleConfirm} data-cy="confirmation-button">
        Continue
      </ButtonSolid>
    </>
  );

  return (
    <Modal title="Disable SSO" show={show} closeModal={handleClose} footerContent={modalFooter}>
      {modalContent}
    </Modal>
  );
}

export default ConfirmDisableLastSSOModal;
