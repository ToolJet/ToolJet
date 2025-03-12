import React from 'react';
import Modal from 'react-bootstrap/Modal';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ToolTip } from '@/_components/ToolTip';

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
  cancelDisabled,
  className = '',
  size = 'sm',
}) {
  return (
    <Modal
      show={show}
      onHide={handleClose}
      size={size}
      centered={true}
      contentClassName={`${className} ${darkMode ? 'theme-dark dark-theme modal-base' : 'modal-base'}`}
    >
      <Modal.Header>
        <Modal.Title className="font-weight-500" data-cy="modal-title">
          {title}
        </Modal.Title>
        <div onClick={handleClose} className="cursor-pointer" data-cy="modal-close-button">
          <SolidIcon name="remove" width="20" />
        </div>
      </Modal.Header>
      <Modal.Body data-cy="modal-body">
        {children ? (
          children
        ) : (
          <div>
            <div className="tj-text-xsm">{body}</div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <ButtonSolid disabled={cancelDisabled} variant={'tertiary'} onClick={handleClose} data-cy="cancel-button">
          Cancel
        </ButtonSolid>
        <ToolTip
          show={confirmBtnProps?.tooltipMessage && confirmBtnProps?.disabled}
          message={confirmBtnProps?.tooltipMessage}
        >
          <div>
            <ButtonSolid
              disabled={isLoading || confirmBtnProps?.disabled}
              isLoading={isLoading}
              variant={confirmBtnProps?.variant || 'primary'}
              onClick={handleConfirm}
              {...confirmBtnProps}
              data-cy="confim-button"
            >
              {confirmBtnProps?.title || 'Continue'}
            </ButtonSolid>
          </div>
        </ToolTip>
      </Modal.Footer>
    </Modal>
  );
}
