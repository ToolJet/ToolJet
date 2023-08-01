import React from 'react';
import Modal from 'react-bootstrap/Modal';
import { useTranslation } from 'react-i18next';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import '@/_styles/versions.scss';

export default function ReleaseConfirmation(props) {
  const { onClose, onConfirm, show } = props;
  const { t } = useTranslation();
  const darkMode = props.darkMode ?? (localStorage.getItem('darkMode') === 'true' || false);

  return (
    <Modal
      show={show}
      onHide={onClose}
      size="sm"
      animation={false}
      centered={true}
      contentClassName={`release-confirm-dialogue-modal ${darkMode ? 'dark-theme' : ''}`}
    >
      <Modal.Header>
        <Modal.Title>Release Version</Modal.Title>
        <svg
          onClick={onClose}
          className="cursor-pointer"
          width="33"
          height="33"
          viewBox="0 0 33 33"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M11.5996 11.6201C11.8599 11.3597 12.282 11.3597 12.5424 11.6201L16.071 15.1487L19.5996 11.6201C19.8599 11.3597 20.282 11.3597 20.5424 11.6201C20.8027 11.8804 20.8027 12.3025 20.5424 12.5629L17.0138 16.0915L20.5424 19.6201C20.8027 19.8804 20.8027 20.3025 20.5424 20.5629C20.282 20.8232 19.8599 20.8232 19.5996 20.5629L16.071 17.0343L12.5424 20.5629C12.282 20.8232 11.8599 20.8232 11.5996 20.5629C11.3392 20.3025 11.3392 19.8804 11.5996 19.6201L15.1282 16.0915L11.5996 12.5629C11.3392 12.3025 11.3392 11.8804 11.5996 11.6201Z"
            fill="#11181C"
          />
        </svg>
      </Modal.Header>

      <Modal.Body className="env-confirm-dialogue-body">
        <div className="env-change-info">Are you sure you want to release this version?</div>
      </Modal.Body>
      <Modal.Footer className="env-modal-footer">
        <ButtonSolid variant="tertiary" onClick={onClose}>
          {t('globals.cancel', 'Cancel')}
        </ButtonSolid>
        <ButtonSolid variant="primary" onClick={onConfirm}>
          Yes
        </ButtonSolid>
      </Modal.Footer>
    </Modal>
  );
}
