import React from 'react';
import { Modal } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import './static-modal.scss';

export const LicenseUpgradeErrorModal = ({ errorMsg, onHide, ...props }) => {
  const { t } = useTranslation();

  const getIcon = (iconType) => {
    switch (iconType) {
      case 'user':
        return (
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
        );
      case 'apps':
        return (
          <svg width="64" height="65" viewBox="0 0 64 65" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect y="0.601562" width="64" height="64" rx="12" fill="#FFF0EE" />
            <path
              d="M45.3333 40.9348C45.3333 43.6962 43.0948 45.9348 40.3333 45.9348C37.5719 45.9348 35.3333 43.6962 35.3333 40.9348C35.3333 38.1734 37.5719 35.9348 40.3333 35.9348C43.0948 35.9348 45.3333 38.1734 45.3333 40.9348Z"
              fill="#D72D39"
            />
            <g opacity="0.4">
              <path
                d="M35.3333 22.6015C35.3333 20.7606 36.8257 19.2682 38.6667 19.2682H42C43.841 19.2682 45.3333 20.7606 45.3333 22.6015V25.9349C45.3333 27.7758 43.841 29.2682 42 29.2682H38.6667C36.8257 29.2682 35.3333 27.7758 35.3333 25.9349V22.6015Z"
                fill="#D72D39"
              />
              <path
                d="M18.6667 22.6015C18.6667 20.7606 20.1591 19.2682 22 19.2682H25.3333C27.1743 19.2682 28.6667 20.7606 28.6667 22.6015V25.9349C28.6667 27.7758 27.1743 29.2682 25.3333 29.2682H22C20.1591 29.2682 18.6667 27.7758 18.6667 25.9349V22.6015Z"
                fill="#D72D39"
              />
              <path
                d="M18.6667 39.2682C18.6667 37.4272 20.1591 35.9349 22 35.9349H25.3333C27.1743 35.9349 28.6667 37.4272 28.6667 39.2682V42.6015C28.6667 44.4425 27.1743 45.9349 25.3333 45.9349H22C20.1591 45.9349 18.6667 44.4425 18.6667 42.6015V39.2682Z"
                fill="#D72D39"
              />
            </g>
          </svg>
        );
      default:
        return (
          <svg width="64" height="65" viewBox="0 0 64 65" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect y="0.601562" width="64" height="64" rx="12" fill="#FFF0EE" />
            <path
              opacity="0.4"
              d="M28.6134 19.5448C30.0895 16.9538 33.9106 16.9538 35.3867 19.5448L48.1736 41.9889C49.6082 44.507 47.7409 47.6016 44.7869 47.6016H19.2132C16.2591 47.6016 14.3919 44.507 15.8265 41.9889L28.6134 19.5448Z"
              fill="#D72D39"
            />
            <path
              d="M33.6667 40.9349C33.6667 41.8553 32.9205 42.6015 32 42.6015C31.0796 42.6015 30.3334 41.8553 30.3334 40.9349C30.3334 40.0144 31.0796 39.2682 32 39.2682C32.9205 39.2682 33.6667 40.0144 33.6667 40.9349Z"
              fill="#D72D39"
            />
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M32 26.3516C32.6904 26.3516 33.25 26.9112 33.25 27.6016V35.9349C33.25 36.6253 32.6904 37.1849 32 37.1849C31.3096 37.1849 30.75 36.6253 30.75 35.9349V27.6016C30.75 26.9112 31.3096 26.3516 32 26.3516Z"
              fill="#D72D39"
            />
          </svg>
        );
    }
  };

  return (
    <div className="custom-backdrop">
      <Modal
        {...props}
        className={`organization-switch-modal static-error-modal ${props.darkMode.darkMode ? 'dark-mode' : ''}`}
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton onHide={onHide} style={{ padding: '15px' }}>
          {getIcon(errorMsg?.icon)}
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
