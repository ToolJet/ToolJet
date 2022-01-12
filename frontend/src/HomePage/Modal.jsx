import React from 'react';
import { default as BootstrapModal } from 'react-bootstrap/Modal';

export default function Modal({ title, show, closeModal, customClassName, children }) {
  return (
    <BootstrapModal
      onHide={() => closeModal(false)}
      contentClassName={`home-modal-component${customClassName ? ` ${customClassName}` : ''}`}
      show={show}
      size="md"
      backdrop={true}
      keyboard={true}
      enforceFocus={false}
      animation={false}
      onEscapeKeyDown={() => closeModal()}
      centered
    >
      <BootstrapModal.Header>
        <BootstrapModal.Title>{title}</BootstrapModal.Title>
        <button className="btn-close" aria-label="Close" onClick={() => closeModal()}></button>
      </BootstrapModal.Header>
      <BootstrapModal.Body>{children}</BootstrapModal.Body>
    </BootstrapModal>
  );
}
