import React, { useState, useEffect } from 'react';
import { default as BootstrapModal } from 'react-bootstrap/Modal';
import moment from 'moment';
import { appService } from '../_services/app.service';

export default function ExportAppModal({
  title,
  show,
  closeModal,
  customClassName,
  exportVersionOfApp,
  versions,
  appId,
}) {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const [versionId, setVersionId] = useState(Array.isArray(versions) ? versions[0].id : undefined);

  useEffect(() => {
    setVersionId(Array.isArray(versions) ? versions[0].id : undefined);
  }, [versions]);
  return (
    <BootstrapModal
      onHide={() => closeModal(false)}
      contentClassName={`home-modal-component ${customClassName ? ` ${customClassName}` : ''} ${darkMode && 'dark'}`}
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
      <BootstrapModal.Header className="border-bottom">
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
          <div className="py-2">
            <div className="current-version py-2">
              <span className="text-muted">Current Version</span>
              <span className="version-wrapper mt-2" role="button" onClick={({ target }) => setVersionId(target.value)}>
                <input
                  type="radio"
                  value={versions[0].id}
                  id={`${versions[0].name}`}
                  name="version"
                  checked={versionId === versions[0].id}
                />
                <label htmlFor={`${versions[0].name}`} className="d-flex flex-column px-4 w-100">
                  <span>{Array.isArray(versions) && versions[0].name}</span>
                  <span className="text-secondary">
                    {Array.isArray(versions) && `Created at ${moment(versions[0].createdAt).format('Do MMM YYYY')}`}
                  </span>
                </label>
              </span>
            </div>
            {versions.length >= 2 && (
              <div className="other-versions py-2">
                <span className=" text-muted">Other Versions</span>
                {versions.map((version, index) => {
                  if (index !== 0) {
                    return (
                      <span
                        key={version.name}
                        className="version-wrapper my-2"
                        onClick={({ target }) => setVersionId(target.value)}
                      >
                        <input
                          type="radio"
                          value={version.id}
                          id={`${version.name}`}
                          name="version"
                          checked={versionId === version.id}
                        />
                        <label htmlFor={`${version.name}`} className="d-flex flex-column px-4 w-100">
                          <span>{version.name}</span>
                          <span className="text-secondary">{`Created at ${moment(version.createdAt).format(
                            'Do MMM YYYY'
                          )}`}</span>
                        </label>
                      </span>
                    );
                  }
                })}
              </div>
            )}
          </div>
        )}
      </BootstrapModal.Body>
      <BootstrapModal.Footer className="export-app-modal-footer d-flex justify-content-end border-top align-items-center py-2">
        <span role="button" className="btn btn-light" onClick={() => exportVersionOfApp(appId)}>
          Export All
        </span>
        <span role="button" className="btn btn-primary" onClick={() => exportVersionOfApp(appId, versionId)}>
          Export selected version
        </span>
      </BootstrapModal.Footer>
    </BootstrapModal>
  );
}
