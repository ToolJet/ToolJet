import React, { useState, useEffect } from 'react';
import { default as BootstrapModal } from 'react-bootstrap/Modal';
import moment from 'moment';
import { appService } from '../_services/app.service';
import { toast } from 'react-hot-toast';

export default function ExportAppModal({ title, show, closeModal, customClassName, app, darkMode }) {
  const currentVersion = app.editing_version;
  const [versions, getVersions] = useState(undefined);
  const [versionId, setVersionId] = useState(currentVersion.id);

  useEffect(() => {
    async function fetchAppVersions() {
      try {
        const fetchVersions = await appService.getVersions(app.id);
        const { versions } = await fetchVersions;
        getVersions(versions);
      } catch (error) {
        toast.error('Could not fetch the versions.', {
          position: 'top-center',
        });
        closeModal();
      }
    }
    fetchAppVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportApp = (appId, versionId = undefined) => {
    appService
      .exportApp(appId, versionId)
      .then((data) => {
        const appName = app.name.replace(/\s+/g, '-').toLowerCase();
        const fileName = `${appName}-export-${new Date().getTime()}`;
        // simulate link click download
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = fileName + '.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        closeModal();
      })
      .catch(() => {
        toast.error('Could not export the app.', {
          position: 'top-center',
        });
        closeModal();
      });
  };

  return (
    <BootstrapModal
      onHide={() => closeModal(false)}
      contentClassName={`home-modal-component ${customClassName ? ` ${customClassName}` : ''} ${
        darkMode && 'dark-theme'
      }`}
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
      {Array.isArray(versions) ? (
        <>
          <BootstrapModal.Body>
            <div className="py-2">
              <div className="current-version py-2" data-cy="current-version-section">
                <span className="text-muted" data-cy="current-version-label">
                  Current Version
                </span>
                <InputRadioField
                  versionId={currentVersion.id}
                  data-cy={`${currentVersion.id.toLowerCase().replace(/\s+/g, '-')}-value`}
                  versionName={currentVersion.name}
                  versionCreatedAt={currentVersion.createdAt}
                  checked={versionId === currentVersion.id}
                  setVersionId={setVersionId}
                />
              </div>
              {versions.length >= 2 ? (
                <div className="other-versions py-2" data-cy="other-version-section">
                  <span className="text-muted" data-cy="other-version-label">
                    Other Versions
                  </span>
                  {versions.map((version) => {
                    if (version.id !== currentVersion.id) {
                      return (
                        <InputRadioField
                          versionId={version.id}
                          data-cy={`${version.id.toLowerCase().replace(/\s+/g, '-')}-value`}
                          versionName={version.name}
                          versionCreatedAt={version.createdAt}
                          key={version.name}
                          checked={versionId === version.id}
                          setVersionId={setVersionId}
                        />
                      );
                    }
                  })}
                </div>
              ) : (
                <div className="other-versions py-2" data-cy="other-version-section">
                  <span className="text-muted" data-cy="no-other-versions-found-text">
                    No other versions found
                  </span>
                </div>
              )}
            </div>
          </BootstrapModal.Body>
          <BootstrapModal.Footer className="export-app-modal-footer d-flex justify-content-end border-top align-items-center py-2">
            <span role="button" className="btn btn-light" data-cy="export-all-button" onClick={() => exportApp(app.id)}>
              Export All
            </span>
            <span
              role="button"
              className="btn btn-primary"
              data-cy="export-selected-version-button"
              onClick={() => exportApp(app.id, versionId)}
            >
              Export selected version
            </span>
          </BootstrapModal.Footer>
        </>
      ) : (
        <Loader />
      )}
    </BootstrapModal>
  );
}

function InputRadioField({
  versionId,
  versionName,
  versionCreatedAt,
  checked = undefined,
  key = undefined,
  setVersionId,
}) {
  return (
    <span
      key={key}
      className="version-wrapper my-2 py-2 cursor-pointer"
      data-cy={`${String(versionName).toLowerCase().replace(/\s+/g, '-')}-version-wrapper`}
    >
      <input
        type="radio"
        value={versionId}
        id={`${versionName}`}
        data-cy={`${String(versionName).toLowerCase().replace(/\s+/g, '-')}-radio-button`}
        name="version"
        checked={checked}
        onClick={({ target }) => setVersionId(target.value)}
        style={{ marginLeft: '1rem' }}
        className="cursor-pointer"
      />
      <label
        htmlFor={`${versionName}`}
        className="d-flex flex-column cursor-pointer w-100"
        style={{ paddingLeft: '0.75rem' }}
      >
        <span data-cy={`${String(versionName).toLowerCase().replace(/\s+/g, '-')}-text`}>{versionName}</span>
        <span className="text-secondary" data-cy="created-date-label">{`Created on ${moment(versionCreatedAt).format(
          'Do MMM YYYY'
        )}`}</span>
      </label>
    </span>
  );
}

function Loader() {
  return (
    <BootstrapModal.Body>
      <div className="d-flex justify-content-center align-items-center flex-column" style={{ minHeight: '30vh' }}>
        <div className="pb-2">Loading versions ...</div>
        <div className="spinner-border" role="status"></div>
      </div>
    </BootstrapModal.Body>
  );
}
