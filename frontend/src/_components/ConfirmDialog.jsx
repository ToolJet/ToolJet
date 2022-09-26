import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { useTranslation } from 'react-i18next';

export function ConfirmDialog({ show, message, onConfirm, onCancel, confirmButtonLoading, darkMode }) {
  const [showModal, setShow] = useState(show);
  const { t } = useTranslation();

  useEffect(() => {
    setShow(show);
  }, [show]);

  const handleClose = () => {
    onCancel();
    setShow(false);
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <>
      <Modal
        show={showModal}
        onHide={handleClose}
        size="sm"
        centered={true}
        contentClassName={darkMode ? 'theme-dark' : ''}
        data-cy="modal-component"
      >
        <div className="modal-status bg-danger"></div>
        <Modal.Body data-cy="modal-message">{message}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} data-cy="cancel-button">
            {t('globals.cancel', 'Cancel')}
          </Button>
          <Button
            variant="danger"
            autoFocus
            className={`${confirmButtonLoading ? 'btn-loading' : ''}`}
            onClick={handleConfirm}
            data-cy="yes-button"
          >
            {t('globals.yes', 'Yes')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
