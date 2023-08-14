import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import { useTranslation } from 'react-i18next';

export function Confirm({
  show,
  title,
  message,
  onConfirm,
  onCancel,
  queryConfirmationData,
  darkMode,
  confirmButtonText = '',
  cancelButtonText = '',
  callCancelFnOnConfirm = true,
}) {
  const [showModal, setShow] = useState(show);
  const { t } = useTranslation();

  useEffect(() => {
    setShow(show);
  }, [show]);

  const handleClose = () => {
    onCancel && onCancel();
    setShow(false);
  };

  const handleConfirm = () => {
    if (callCancelFnOnConfirm) {
      onConfirm(queryConfirmationData);
      handleClose();
    } else {
      onConfirm(queryConfirmationData);
      setShow(false);
    }
  };

  return (
    <Modal
      show={showModal}
      animation={false}
      onHide={handleClose}
      size="sm"
      centered={true}
      contentClassName={darkMode ? 'dark-theme' : ''}
    >
      {title && (
        <Modal.Header>
          <Modal.Title>{title}</Modal.Title>
          <svg
            onClick={handleClose}
            className="cursor-pointer"
            width="33"
            height="33"
            viewBox="0 0 33 33"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M11.5996 11.6201C11.8599 11.3597 12.282 11.3597 12.5424 11.6201L16.071 15.1487L19.5996 11.6201C19.8599 11.3597 20.282 11.3597 20.5424 11.6201C20.8027 11.8804 20.8027 12.3025 20.5424 12.5629L17.0138 16.0915L20.5424 19.6201C20.8027 19.8804 20.8027 20.3025 20.5424 20.5629C20.282 20.8232 19.8599 20.8232 19.5996 20.5629L16.071 17.0343L12.5424 20.5629C12.282 20.8232 11.8599 20.8232 11.5996 20.5629C11.3392 20.3025 11.3392 19.8804 11.5996 19.6201L15.1282 16.0915L11.5996 12.5629C11.3392 12.3025 11.3392 11.8804 11.5996 11.6201Z"
              fill="#11181C"
            />
          </svg>
        </Modal.Header>
      )}
      <Modal.Body data-cy={'modal-message'}>{message}</Modal.Body>
      <Modal.Footer className="mt-3">
        <button className="btn" onClick={handleClose} data-cy={'modal-cancel-button'}>
          {cancelButtonText === '' ? t('globals.cancel', 'Cancel') : cancelButtonText}
        </button>
        <button className="btn btn-danger" onClick={handleConfirm} data-cy={'modal-confirm-button'}>
          {confirmButtonText === '' ? t('globals.yes', 'Yes') : confirmButtonText}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
