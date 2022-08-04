import React from 'react';
import { default as BootstrapModal } from 'react-bootstrap/Modal';

export default function Modal({ title, show, closeModal, customClassName, children }) {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return (
    <BootstrapModal
      onHide={() => closeModal(false)}
      contentClassName={`home-modal-component${customClassName ? ` ${customClassName}` : ''} ${darkMode && 'dark'}`}
      show={show}
      size="md"
      backdrop={true}
      keyboard={true}
      enforceFocus={false}
      animation={false}
      onEscapeKeyDown={() => closeModal()}
      centered
      data-cy={'modal-component'}
    >
      <BootstrapModal.Header>
        <BootstrapModal.Title data-cy={`${title.toLowerCase().replace(/\s+/g, '-')}-title`}>
          {title}
        </BootstrapModal.Title>
        <button
          className="btn-close"
          aria-label="Close"
          onClick={() => closeModal()}
          data-cy="modal-close-button"
        ></button>
      </BootstrapModal.Header>
      <BootstrapModal.Body>{children}</BootstrapModal.Body>
    </BootstrapModal>
  );
}
