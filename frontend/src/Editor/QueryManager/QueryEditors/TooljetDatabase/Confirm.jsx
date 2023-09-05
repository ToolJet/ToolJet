import React, { useCallback, useState } from 'react';
import Modal from 'react-bootstrap/Modal';

function useConfirm() {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');
  const [heading, setHeading] = useState('Confirm action?');
  const [handleConfirm, setHandleConfirm] = useState(null);

  const confirm = (message, heading) => {
    return new Promise((resolve) => {
      setMessage(message);
      setHeading(heading);
      setShow(true);

      const confirmCallback = (result) => {
        setShow(false);
        resolve(result);
      };

      setHandleConfirm(() => confirmCallback);
    });
  };

  const ConfirmDialog = useCallback(
    ({ confirmButtonText = '', cancelButtonText = '', darkMode }) => {
      return (
        <Modal
          show={show}
          animation={false}
          onHide={() => handleConfirm(false)}
          centered
          size="sm"
          contentClassName={darkMode ? 'theme-dark' : ''}
        >
          <Modal.Header>
            <Modal.Title>{heading || 'Confirm action ?'}</Modal.Title>
            <svg
              onClick={() => handleConfirm(false)}
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
          <Modal.Body data-cy={'tjdb-delete-confirmation-modal-message'}>{message}</Modal.Body>
          <Modal.Footer className="mt-3">
            <button
              className="btn"
              onClick={() => handleConfirm(false)}
              data-cy={'tjdb-delete-confirmation-modal-cancel-btn'}
            >
              {cancelButtonText === '' ? 'Cancel' : cancelButtonText}
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleConfirm(true)}
              data-cy={'tjdb-delete-confirmation-modal-confirm-btn'}
            >
              {confirmButtonText === '' ? 'Yes' : confirmButtonText}
            </button>
          </Modal.Footer>
        </Modal>
      );
    },
    [show, message, heading, handleConfirm]
  );

  return { confirm, ConfirmDialog };
}

export default useConfirm;
