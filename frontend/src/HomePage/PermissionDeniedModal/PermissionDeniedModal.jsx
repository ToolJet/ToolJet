import React from 'react';
import { Modal } from 'react-bootstrap';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

export const PermissionDeniedModal = ({ onHide, ...props }) => {
  return (
    <div className="custom-backdrop">
      <Modal
        {...props}
        className={`organization-switch-modal static-error-modal ${props.darkMode?.darkMode ? 'dark-mode' : ''}`}
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton onHide={onHide} style={{ padding: '15px' }}>
          <span className="header-text" data-cy="modal-header" style={{ marginTop: '10px', lineHeight: '24px' }}>
            Access restricted
          </span>
          <p
            className="description"
            data-cy="modal-description"
            style={{ marginTop: '0px', marginLeft: '20px', marginRight: '20px' }}
          >
            You don&apos;t have access to create apps in this workspace. Contact admin.
          </p>
        </Modal.Header>
        <Modal.Footer>
          <ButtonSolid onClick={onHide}>OK</ButtonSolid>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
