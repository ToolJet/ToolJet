import React from 'react';
import Modal from 'react-bootstrap/Modal';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export default function ModalBase({
  show,
  handleClose,
  darkMode,
  title,
  body,
  confirmBtnProps,
  handleConfirm,
  isLoading,
  children,
}) {
  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="sm"
      centered={true}
      contentClassName={`${darkMode ? 'theme-dark dark-theme modal-base' : 'modal-base'}`}
    >
      <Modal.Header>
        <Modal.Title className="font-weight-500">{title}</Modal.Title>
        <div onClick={handleClose} className="cursor-pointer">
          <SolidIcon name="remove" width="20" />
        </div>
      </Modal.Header>
      <Modal.Body>
        {children ? (
          children
        ) : (
          <div>
            <div className="tj-text-xsm">{body}</div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <ButtonSolid variant={'tertiary'} onClick={handleClose}>
          Cancel
        </ButtonSolid>
        <ButtonSolid
          disabled={isLoading}
          isLoading={isLoading}
          variant={confirmBtnProps?.variant || 'primary'}
          onClick={handleConfirm}
          {...confirmBtnProps}
        >
          {confirmBtnProps?.title || 'Continue'}
        </ButtonSolid>
      </Modal.Footer>
    </Modal>
  );
}
