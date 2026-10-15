import React, { useEffect, useState } from 'react';
import * as ReactDOM from 'react-dom';
import { Modal } from 'react-bootstrap';
import { TriangleAlert, Headset } from 'lucide-react';
import './ErrorComponents/static-modal.scss';

const WorkspaceLimitModal = ({ showModal: propShowModal, current, limit, toggleModal }) => {
  const [isOpen, setShowModal] = useState(propShowModal);
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const handleClose = () => {
    setShowModal(false);
    toggleModal && toggleModal();
  };

  useEffect(() => {
    setShowModal(propShowModal);
  }, [propShowModal]);

  const modalContent = (
    <div className="custom-backdrop">
      <Modal
        show={isOpen}
        onHide={handleClose}
        className={`restricted-access-modal workspace-limit-modal static-error-modal ${darkMode ? 'dark-mode' : ''}`}
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header>
          <TriangleAlert className="restricted-access-icon" size={40} />
          <div className="restricted-access-message">
            <span className="header-text" data-cy="modal-header">
              Workspace limit reached
            </span>
            <p className="description" data-cy="modal-description">
              You have reached the number of workspaces ({current}/{limit}) which can be created in ToolJet Cloud.
              Contact us at <a href="mailto:support@tooljet.com">support@tooljet.com</a> to increase this limit.
            </p>
          </div>
        </Modal.Header>
        <Modal.Footer>
          <button className="btn restricted-back-btn" onClick={handleClose} data-cy="cancel-button">
            Cancel
          </button>
          <a
            className="btn contact-support-btn"
            href="mailto:support@tooljet.com?subject=Increase%20workspace%20limit"
            data-cy="contact-support-button"
          >
            <Headset size={16} />
            <span>Contact support</span>
          </a>
        </Modal.Footer>
      </Modal>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default WorkspaceLimitModal;
