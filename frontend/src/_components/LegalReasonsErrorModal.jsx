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
          <div onClick={toggleModal ?? handleClose} className="cursor-pointer">
            <SolidIcon name="remove" width="20" />
          </div>
        </Modal.Header>
        <Modal.Body data-cy="modal-message">
          {message}
          {body}
        </Modal.Body>
        {showFooter && (
          <Modal.Footer>
            <Button className="cancel-btn" onClick={handleClose}>
              Cancel
            </Button>
            {currentUser?.admin && (
              <Button className="upgrade-btn" autoFocus onClick={() => {}}>
                <a
                  style={{ color: 'white', textDecoration: 'none' }}
                  href={`https://www.tooljet.com/pricing?utm_source=banner&utm_medium=plg&utm_campaign=none&payment=tooljet-cloud&workspace_id=${currentUser.current_organization_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
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
