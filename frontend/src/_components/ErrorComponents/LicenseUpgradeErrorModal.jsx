import React from 'react';
import { Modal } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import './static-modal.scss';

export const LicenseUpgradeErrorModal = ({ errorMsg, onHide, ...props }) => {
  const { t } = useTranslation();

  return (
    <div className="custom-backdrop">
      <Modal
        {...props}
        className={`organization-switch-modal static-error-modal ${props.darkMode.darkMode ? 'dark-mode' : ''}`}
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton onHide={onHide} style={{ padding: '15px' }}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ marginTop: '25px' }}
          >
            <rect width="64" height="64" rx="12" fill="#FFF0EE" />
            <ellipse opacity="0.4" cx="28.6667" cy="40.3333" rx="11.6667" ry="6.66667" fill="#E54D2E" />
            <circle cx="28.6667" cy="23.6667" r="6.66667" fill="#E54D2E" />
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M39.0833 30.3333C39.0833 29.643 39.643 29.0833 40.3333 29.0833H47C47.6904 29.0833 48.25 29.643 48.25 30.3333C48.25 31.0237 47.6904 31.5833 47 31.5833H40.3333C39.643 31.5833 39.0833 31.0237 39.0833 30.3333Z"
              fill="#E54D2E"
            />
          </svg>

          <span className="header-text" data-cy="modal-header" style={{ marginTop: '0px' }}>
            {t('globals.static-error-modal.title', errorMsg?.title)}
          </span>
          <p
            className="description"
            data-cy="modal-description"
            style={{ marginTop: '0px', marginLeft: '20px', marginRight: '20px' }}
          >
            {t('globals.static-error-modal.description', errorMsg?.message)}
          </p>
        </Modal.Header>
        <Modal.Footer></Modal.Footer>
      </Modal>
    </div>
  );
};
