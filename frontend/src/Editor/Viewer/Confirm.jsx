import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { useTranslation } from 'react-i18next';

export function Confirm({
  show,
  message,
  onConfirm,
  onCancel,
  queryConfirmationData,
  darkMode,
  confirmButtonText = '',
  cancelButtonText = '',
  callCancelFnOnConfirm = true,
  queryCancelData = null,
}) {
  const [showModal, setShow] = useState(show);
  const { t } = useTranslation();

  useEffect(() => {
    setShow(show);
  }, [show]);

  const handleClose = () => {
    onCancel(queryCancelData);
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
    <>
      <Modal
        show={showModal}
        onHide={handleClose}
        size="sm"
        centered={true}
        contentClassName={darkMode ? 'theme-dark' : ''}
      >
        <div className="modal-status bg-danger"></div>
        <Modal.Body data-cy={'modal-message'}>{message}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} data-cy={'modal-cancel-button'}>
            {cancelButtonText === '' ? t('globals.cancel', 'Cancel') : cancelButtonText}
          </Button>
          <Button variant="primary" onClick={handleConfirm} data-cy={'modal-confirm-button'}>
            {confirmButtonText === '' ? t('globals.yes', 'Yes') : confirmButtonText}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
