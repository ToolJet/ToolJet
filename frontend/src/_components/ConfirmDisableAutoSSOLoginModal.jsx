import React from 'react';
import Modal from '@/HomePage/Modal';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

function ConfirmDisableAutoSSOLoginModal({ show, onConfirm, onCancel }) {
  const modalFooter = (
    <>
      <ButtonSolid variant="tertiary" onClick={onCancel} data-cy="cancel-button">
        Cancel
      </ButtonSolid>
      <ButtonSolid variant={'primary'} onClick={onConfirm} data-cy="confirmation-button">
        Continue
      </ButtonSolid>
    </>
  );
  return (
    <Modal title="Enable password login" show={show} closeModal={onCancel} footerContent={modalFooter}>
      <div>
        <p data-cy="modal-message">
          {/* Automatic login permits only one SSO to be enabled. Hence, enabling this SSO will disable automatic login.
          Are you sure you want to continue? */}
          Automatic login requires password login to be disabled. Enabling it will disable automatic login. Are you sure
          you want to continue?
        </p>
      </div>
    </Modal>
  );
}

export default ConfirmDisableAutoSSOLoginModal;
