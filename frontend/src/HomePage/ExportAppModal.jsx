import React from 'react';
import { default as BootstrapModal } from 'react-bootstrap/Modal';
import moment from 'moment';

export default function ExportAppModal({
  title,
  show,
  closeModal,
  customClassName,
  versions,
  exportVersionOfApp,
  appId,
}) {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  let versionId = undefined;
  return (
    <BootstrapModal
      onHide={() => closeModal(false)}
      contentClassName={`home-modal-component${customClassName ? ` ${customClassName}` : ''} ${darkMode && 'dark'}`}
      show={show}
      size="md"
      backdrop={true}
      keyboard={true}
      enforceFocus={false}
      animation={false}
      onEscapeKeyDown={() => closeModal()}
      centered
      data-cy={'modal-component'}
    >
      <BootstrapModal.Header>
        <BootstrapModal.Title data-cy={`${title.toLowerCase().replace(/\s+/g, '-')}-title`}>
          {title}
        </BootstrapModal.Title>
        <button
          className="btn-close"
          aria-label="Close"
          onClick={() => closeModal()}
          data-cy="modal-close-button"
        ></button>
      </BootstrapModal.Header>
      <BootstrapModal.Body>
        {Array.isArray(versions) && (
          <div>
            <span className="current-version">
              <span>Current Version</span>
              <span className="version-wrapper" onClick={({ target }) => (versionId = target.value)}>
                <input type="radio" value={versions[0].id} id={`${versions[0].name}`} name="version" />
                <label htmlFor={`${versions[0].name}`} className="d-flex flex-column px-4 w-100">
                  <span>{Array.isArray(versions) && versions[0].name}</span>
                  <span>{Array.isArray(versions) && moment(versions[0].createdAt).format('Do MMM YYYY')}</span>
                </label>
              </span>
            </span>
            <span>Other Versions</span>
            {Array.isArray(versions) &&
              versions.map((version, index) => {
                if (index !== 0) {
                  return (
                    <span
                      key={version.name}
                      className="version-wrapper"
                      onClick={({ target }) => (versionId = target.value)}
                    >
                      <input type="radio" value={version.id} id={`${version.name}`} name="version" />
                      <label htmlFor={`${version.name}`} className="d-flex flex-column px-4 w-100">
                        <span>{version.name}</span>
                        <span>{moment(version.createdAt).format('Do MMM YYYY')}</span>
                      </label>
                    </span>
                  );
                }
              })}
          </div>
        )}
      </BootstrapModal.Body>
      <BootstrapModal.Footer className="export-app-modal-footer d-flex justify-content-end border-top">
        <button onClick={() => exportVersionOfApp(appId)}>Export All</button>
        <button onClick={() => exportVersionOfApp(appId, versionId)}>Export Selected</button>
      </BootstrapModal.Footer>
    </BootstrapModal>
  );
}
