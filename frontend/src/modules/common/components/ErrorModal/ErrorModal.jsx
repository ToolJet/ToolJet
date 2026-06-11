import React from 'react';
import { Modal } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import './resources/error-modal.styles.scss';

function EditRoleErrorModal({
  darkMode,
  errorTitle = '',
  listItems = [],
  errorMessage = '',
  show = false,
  iconName = '',
  onClose,
}) {
  const { t } = useTranslation();

  return (
    <Modal
      className={`edit-role-modal ${darkMode ? 'dark-mode' : ''}`}
      aria-labelledby="contained-modal-title-vcenter"
      centered
      show={show}
    >
      <Modal.Header>
        <div className="remove-icon-container">
          <ButtonSolid
            className="close-btn"
            leftIcon="remove"
            onClick={() => onClose()}
            data-cy="close-button"
            iconWidth="20"
          />
        </div>
        <div className="icon-class" data-cy="modal-icon">
          <SolidIcon name={iconName} width="32" fill="#E54D2E" />
        </div>
        <span className="header-text" data-cy="modal-header">
          {errorTitle || 'Unknown error'}
        </span>
        <p data-cy="modal-message">{errorMessage || 'Please try after some time.'}</p>
      </Modal.Header>
      <Modal.Body>
        <div className="item-list">
          {listItems.map((item, index) => (
            <div key={index}>
              <span className="tj-text-sm">{`${index + 1}. ${item}`}</span>
            </div>
          ))}
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default EditRoleErrorModal;
