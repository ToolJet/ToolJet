import React from 'react';
import { Modal } from 'react-bootstrap';

export function NoActiveWorkspaceModal({ darkMode, handleClose, show }) {
  return (
    <Modal
      className={`no-active-organization-modal ${darkMode ? 'dark-mode' : ''}`}
      aria-labelledby="contained-modal-title-vcenter"
      show={show}
      centered
    >
      <Modal.Header>
        <svg
          onClick={() => {
            handleClose();
          }}
          className="cursor-pointer"
          width="33"
          height="33"
          viewBox="0 0 33 33"
          fill={darkMode ? '#3a3f42' : 'none'}
          xmlns="http://www.w3.org/2000/svg"
          data-cy="modal-close-button"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M11.5996 11.6201C11.8599 11.3597 12.282 11.3597 12.5424 11.6201L16.071 15.1487L19.5996 11.6201C19.8599 11.3597 20.282 11.3597 20.5424 11.6201C20.8027 11.8804 20.8027 12.3025 20.5424 12.5629L17.0138 16.0915L20.5424 19.6201C20.8027 19.8804 20.8027 20.3025 20.5424 20.5629C20.282 20.8232 19.8599 20.8232 19.5996 20.5629L16.071 17.0343L12.5424 20.5629C12.282 20.8232 11.8599 20.8232 11.5996 20.5629C11.3392 20.3025 11.3392 19.8804 11.5996 19.6201L15.1282 16.0915L11.5996 12.5629C11.3392 12.3025 11.3392 11.8804 11.5996 11.6201Z"
            fill={darkMode ? 'white' : '#11181C'}
          />
        </svg>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="64" height="64" rx="12" fill="#FFF0EE" />
          <g opacity="0.4">
            <path
              d="M32.8331 15.3333H31.1664C30.2459 15.3333 29.4998 16.0795 29.4998 17V47C29.4998 47.9205 30.2459 48.6666 31.1664 48.6666H32.8331C33.7536 48.6666 34.4998 47.9205 34.4998 47V17C34.4998 16.0795 33.7536 15.3333 32.8331 15.3333Z"
              fill="#E54D2E"
            />
          </g>
          <path
            d="M18.4432 31.1669L29.4998 24.7834L34.4998 21.8966L38.0526 19.8454C38.4354 19.6244 38.8904 19.5645 39.3173 19.6789L43.8707 20.8989C44.7599 21.1372 45.2875 22.0511 45.0493 22.9402L43.8292 27.4936C43.7148 27.9206 43.4354 28.2846 43.0526 28.5056L34.4998 33.4436L29.4998 36.3304L23.4432 39.8271C22.6461 40.2873 21.6268 40.0142 21.1665 39.2171L17.8332 33.4436C17.373 32.6464 17.6461 31.6271 18.4432 31.1669Z"
            fill="#E54D2E"
          />
        </svg>
        <span className="header-text" data-cy="modal-title">
          No active workspace
        </span>
        <p data-cy="modal-message">
          User is not part of any active workspaces. Invite them to a workspace so they can begin exploring!
        </p>
      </Modal.Header>
    </Modal>
  );
}
