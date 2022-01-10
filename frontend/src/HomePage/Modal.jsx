import React from 'react';
import { default as BootstrapModal } from 'react-bootstrap/Modal';

export default function Modal({ title, show, setShow, customClassName, children }) {
  return (
    <BootstrapModal
      contentClassName={`home-modal-component${customClassName ? ` ${customClassName}` : ''}`}
      show={show}
      size="md"
      backdrop={true}
      keyboard={true}
      enforceFocus={false}
      animation={false}
      onEscapeKeyDown={() => setShow(false)}
      centered
    >
      <BootstrapModal.Header>
        <BootstrapModal.Title>{title}</BootstrapModal.Title>
        <button className="btn-close" aria-label="Close" onClick={() => setShow(false)}></button>
      </BootstrapModal.Header>
      <BootstrapModal.Body>{children}</BootstrapModal.Body>
    </BootstrapModal>
  );
}
