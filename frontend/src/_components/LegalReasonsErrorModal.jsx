import React, { useEffect, useState } from 'react';
import * as ReactDOM from 'react-dom';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import SolidIcon from '../_ui/Icon/SolidIcons';
import { authenticationService } from '@/_services';
import { getWorkspaceId } from '../_helpers/utils';
import posthog from 'posthog-js';

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
  const workspaceId = getWorkspaceId();

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
              <Button
                onClick={() => {
                  posthog.capture('click_upgrade_plan', {
                    workspace_id:
                      authenticationService?.currentUserValue?.organization_id ||
                      authenticationService?.currentSessionValue?.current_organization_id,
                  });
                  window.location.href = `/${workspaceId}/settings/subscription?currentTab=upgradePlan`;
                }}
                className="upgrade-btn"
                autoFocus
              >
                <a style={{ color: 'white', textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">
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
