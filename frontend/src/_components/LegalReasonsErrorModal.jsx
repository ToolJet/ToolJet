import React from 'react';
import * as ReactDOM from 'react-dom';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const LegalReasonsErrorModal = ({ showModal, message, feature, darkMode }) => {
  const [isModalOpen, setShowModal] = React.useState(showModal);

  React.useEffect(() => {
    if (!isModalOpen) {
      const element = document.getElementById('legal-reason-modal');
      ReactDOM.unmountComponentAtNode(element.parentNode.child[0]);
    }
  }, [isModalOpen]);

  const handleClose = () => setShowModal(false);

  return (
    <>
      <Modal
        show={showModal}
        onHide={handleClose}
        size="sm"
        centered={true}
        contentClassName={darkMode ? 'theme-dark' : ''}
      >
        <div className="modal-status bg-warning"></div>
        <Modal.Header data-cy="modal-header">
          <Modal.Title>Upgrade Your Plan</Modal.Title>
        </Modal.Header>
        <Modal.Body data-cy="modal-message">{message}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" autoFocus onClick={() => {}}>
            <a
              style={{ color: 'white', textDecoration: 'none' }}
              href="http://tooljet.com/upgrade-account"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact support
            </a>
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default LegalReasonsErrorModal;
