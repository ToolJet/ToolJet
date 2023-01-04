import React from 'react';
import Modal from 'react-bootstrap/Modal';
import cx from 'classnames';

export default function AlertDialog({ title, size = 'sm', show, closeModal, customClassName, children }) {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return (
    <Modal
      onHide={() => closeModal(false)}
      contentClassName={cx('animation-fade home-modal-component', customClassName, { dark: darkMode })}
      show={show}
      size={size}
      backdrop={true}
      keyboard={true}
      enforceFocus={false}
      animation={false}
      onEscapeKeyDown={() => closeModal()}
      centered
      data-cy={'modal-component'}
    >
      {title && (
        <Modal.Header>
          <Modal.Title data-cy={`${title.toLowerCase().replace(/\s+/g, '-')}-title`}>{title}</Modal.Title>
          <button
            className="btn-close"
            aria-label="Close"
            onClick={() => closeModal()}
            data-cy="modal-close-button"
          ></button>
        </Modal.Header>
      )}
      <Modal.Body>{children}</Modal.Body>
    </Modal>
  );
}
