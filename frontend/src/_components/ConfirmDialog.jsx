import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

export function ConfirmDialog({ show, message, onConfirm, onCancel, confirmButtonLoading }) {
  const [showModal, setShow] = useState(show);

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
      <Modal show={showModal} onHide={handleClose} size="sm" centered={true}>
        <div className="modal-status bg-danger"></div>
        <Modal.Body>{message}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            autoFocus
            className={`${confirmButtonLoading ? 'btn-loading' : ''}`}
            onClick={handleConfirm}
          >
            Yes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
