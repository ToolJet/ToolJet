import React from 'react';
import Modal from 'react-bootstrap/Modal';
import cx from 'classnames';

export default function AlertDialog({
  title,
  size = 'sm',
  show,
  closeModal,
  customClassName,
  children,
  checkForBackground = false,
}) {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  //checkForBackground :: remove this once all ui is revamped used only so that editor styles is unaltered
  return (
    <Modal
      onHide={() => closeModal(false)}
      contentClassName={cx(
        `animation-fade ${!checkForBackground ? 'home-modal-component' : 'home-modal-component-editor'} ${
          darkMode && 'dark-theme'
        }`,
        customClassName
      )}
      show={show}
      size={size}
      backdrop={'static'}
      keyboard={true}
      enforceFocus={false}
      animation={false}
      onEscapeKeyDown={() => closeModal()}
      centered
      data-cy={'modal-component'}
      style={{ zIndex: 9992 }}
      backdropClassName={!checkForBackground && 'home-modal-backdrop'}
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
