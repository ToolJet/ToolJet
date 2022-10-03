import React, { useState, useEffect, useRef } from 'react';
import { default as BootstrapModal } from 'react-bootstrap/Modal';
import moment from 'moment';
import { appService } from '../_services/app.service';
import { toast } from 'react-hot-toast';

export default function ExportAppModal({ title, show, closeModal, customClassName, app }) {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const [versions, getVersions] = useState(undefined);
  const [versionId, setVersionId] = useState(undefined);
  const isMounted = useRef(false);

  useEffect(() => {
    async function fetchAppVersions() {
      try {
        const fetchVersions = await appService.getVersions(app.id);
        const { versions } = await fetchVersions;
        getVersions(versions);
        isMounted.current = true;
      } catch (error) {
        toast.error('Could not fetch the versions.', {
          position: 'top-center',
        });
        closeModal();
      }
    }
    fetchAppVersions();
  }, []);

  useEffect(() => {
    if (isMounted.current && versions.length >= 1) {
      setVersionId(versions[0].id);
    }
  }, [versions]);

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
      .catch((error) => {
        toast.error('Could not export the app.', {
          position: 'top-center',
        });
        closeModal();
      });
  };

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
      {Array.isArray(versions) ? (
        <>
          <BootstrapModal.Body>
            <div className="py-2">
              <div className="current-version py-2">
                <span className="text-muted">Current Version</span>
                <span
                  className="version-wrapper mt-2"
                  role="button"
                  onClick={({ target }) => setVersionId(target.value)}
                >
                  <input
                    type="radio"
                    value={versions[0].id}
                    id={`${versions[0].name}`}
                    name="version"
                    checked={versionId === versions[0].id}
                  />
                  <label htmlFor={`${versions[0].name}`} className="d-flex flex-column px-4 w-100">
                    <span>{versions[0].name}</span>
                    <span className="text-secondary">
                      {`Created at ${moment(versions[0].createdAt).format('Do MMM YYYY')}`}
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
                          <input type="radio" value={version.id} id={`${version.name}`} name="version" />
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
          </BootstrapModal.Body>
          <BootstrapModal.Footer className="export-app-modal-footer d-flex justify-content-end border-top align-items-center py-2">
            <span role="button" className="btn btn-light" onClick={() => exportApp(app.id)}>
              Export All
            </span>
            <span role="button" className="btn btn-primary" onClick={() => exportApp(app.id, versionId)}>
              Export selected version
            </span>
          </BootstrapModal.Footer>
        </>
      ) : (
        <BootstrapModal.Body>
          <div className="d-flex justify-content-center align-items-center flex-column" style={{ minHeight: '30vh' }}>
            <div>Loading versions ...</div>
            <div className="spinner-border" role="status"></div>
          </div>
        </BootstrapModal.Body>
      )}
    </BootstrapModal>
  );
}
