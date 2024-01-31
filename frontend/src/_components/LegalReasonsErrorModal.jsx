import React, { useEffect, useState } from 'react';
import * as ReactDOM from 'react-dom';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import SolidIcon from '../_ui/Icon/SolidIcons';
import { authenticationService } from '@/_services';

const LegalReasonsErrorModal = ({
  showModal: propShowModal,
  message,
  feature,
  darkMode,
  type = 'Upgrade',
  body,
  showFooter = true,
  toggleModal,
}) => {
  const [isOpen, setShowModal] = useState(propShowModal);
  const currentUser = authenticationService.currentSessionValue;
  const handleClose = () => {
    setShowModal(false);
    toggleModal && toggleModal();
    document.querySelector('.legal-reason-backdrop').remove();
  };

  useEffect(() => {
    setShowModal(propShowModal);
  }, [propShowModal]);

  const modalContent = (
    <>
      <Modal
        id="legal-reason-modal"
        show={isOpen}
        onHide={toggleModal ?? handleClose}
        backdropClassName="legal-reason-backdrop"
        size="sm"
        centered={true}
        contentClassName={`${darkMode ? 'theme-dark dark-theme license-error-modal' : 'license-error-modal'}`}
      >
        <Modal.Header data-cy="modal-header">
          <Modal.Title>{type} Your Plan</Modal.Title>
          <div onClick={toggleModal ?? handleClose} className="cursor-pointer" data-cy="modal-close">
            <SolidIcon name="remove" width="20" />
          </div>
        </Modal.Header>
        <Modal.Body data-cy="modal-message">
          {message}
          {(message?.includes('builders') || message?.includes('workspaces')) && (
            <div className="info">
              <div>
                <SolidIcon name="idea" />
              </div>
              <span data-cy="info-text">
                To add more users, please disable the personal workspace in instance settings and retry.
              </span>
            </div>
          )}
          {body}
        </Modal.Body>
        {showFooter && (
          <Modal.Footer>
            <Button className="cancel-btn" onClick={handleClose} data-cy="cancel-button">
              Cancel
            </Button>
            {currentUser?.super_admin && (
              <Button className="upgrade-btn" autoFocus onClick={() => {}}>
                <a
                  style={{ color: 'white', textDecoration: 'none' }}
                  href={`https://www.tooljet.com/pricing?utm_source=banner&utm_medium=plg&utm_campaign=none&payment=onpremise&instance_id=${currentUser?.instance_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cy="upgrade-button"
                >
                  Upgrade
                </a>
              </Button>
            )}
          </Modal.Footer>
        )}
      </Modal>
    </>
  );
  return ReactDOM.createPortal(modalContent, document.body);
};

export default LegalReasonsErrorModal;
