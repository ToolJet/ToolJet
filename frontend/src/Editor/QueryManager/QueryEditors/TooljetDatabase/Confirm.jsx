import React, { useCallback, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

function useConfirm() {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');
  const [heading, setHeading] = useState('Confirm action?');
  const [handleConirm, setHandleConfirm] = useState(null);

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

  const ConfirmDialog = useCallback(() => {
    return (
      <Modal show={show} onHide={() => handleConirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{heading || 'Confirm action?'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{message}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => handleConirm(false)}>
            Close
          </Button>
          <Button variant="danger" onClick={() => handleConirm(true)}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }, [show, message, heading, handleConirm]);

  return { confirm, ConfirmDialog };
}

export default useConfirm;
