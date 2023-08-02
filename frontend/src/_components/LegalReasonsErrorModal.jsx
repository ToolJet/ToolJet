import React from 'react';
import * as ReactDOM from 'react-dom';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import SolidIcon from '../_ui/Icon/SolidIcons';
import { authenticationService } from '@/_services';

const LegalReasonsErrorModal = ({
  showModal,
  message,
  feature,
  darkMode,
  type = 'Upgrade',
  body,
  showFooter = true,
  toggleModal,
}) => {
  const [isModalOpen, setShowModal] = React.useState(showModal);
  const currentUser = authenticationService.currentSessionValue;

  React.useEffect(() => {
    if (!isModalOpen) {
      const element = document.getElementById('legal-reason-modal');
      const parentNode = element?.parentNode;
      parentNode && ReactDOM.unmountComponentAtNode(parentNode?.child[0]);
      toggleModal && toggleModal();
    }
  }, [isModalOpen]);

  const handleClose = () => setShowModal(false);

  return (
    <>
      <Modal
        id="legal-reason-modal"
        show={showModal}
        onHide={handleClose}
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
          {(message?.includes('builders') || message?.includes('workspaces')) && (
            <div className="info">
              <div>
                <SolidIcon name="idea" />
              </div>
              <span>To add more users, please disable the personal workspace in instance settings and retry.</span>
            </div>
          )}
          {body}
        </Modal.Body>
        {showFooter && (
          <Modal.Footer>
            <Button className="cancel-btn" onClick={handleClose}>
              Cancel
            </Button>
            {currentUser?.super_admin && (
              <Button className="upgrade-btn" autoFocus onClick={() => {}}>
                <a
                  style={{ color: 'white', textDecoration: 'none' }}
                  href="https://www.tooljet.com/pricing?utm_source=banner&utm_medium=plg&utm_campaign=none"
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
};

export default LegalReasonsErrorModal;
