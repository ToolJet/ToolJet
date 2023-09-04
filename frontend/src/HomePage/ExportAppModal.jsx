import React, { useState, useEffect } from 'react';
import { default as BootstrapModal } from 'react-bootstrap/Modal';
import moment from 'moment';
import { appService } from '@/_services/app.service';
import { toast } from 'react-hot-toast';
import { ButtonSolid } from '@/_components/AppButton';

export default function ExportAppModal({ title, show, closeModal, customClassName, app, darkMode }) {
  const currentVersion = app?.editing_version;
  const [versions, setVersions] = useState(undefined);
  const [tables, setTables] = useState(undefined);
  const [versionId, setVersionId] = useState(currentVersion?.id);
  const [exportTjDb, setExportTjDb] = useState(true);

  useEffect(() => {
    async function fetchAppVersions() {
      try {
        const fetchVersions = await appService.getVersions(app.id);
        const { versions } = fetchVersions;
        setVersions(versions);
      } catch (error) {
        toast.error('Could not fetch the versions.', {
          position: 'top-center',
        });
        closeModal();
      }
    }
    async function fetchAppTables() {
      try {
        const fetchTables = await appService.getTables(app.id);
        const { tables } = fetchTables;
        setTables(tables);
      } catch (error) {
        toast.error('Could not fetch the tables.', {
          position: 'top-center',
        });
        closeModal();
      }
    }
    fetchAppVersions();
    fetchAppTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportApp = (app, versionId, exportTjDb, tables) => {
    const appOpts = {
      app: [
        {
          id: app.id,
          ...(versionId && { search_params: { version_id: versionId } }),
        },
      ],
    };
    const requestBody = {
      ...appOpts,
      ...(exportTjDb && { tooljet_database: tables }),
      organization_id: app.organization_id,
    };

    appService
      .exportResource(requestBody)
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
        toast.error(`Could not export app: ${error.data.message}`, {
          position: 'top-center',
        });
        closeModal();
      });
  };

  return (
    <BootstrapModal
      onHide={() => closeModal(false)}
      contentClassName={`home-modal-component home-version-modal-component ${
        customClassName ? ` ${customClassName}` : ''
      } ${darkMode && 'dark-theme'}`}
      show={show}
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
      {Array.isArray(versions) ? (
        <>
          <BootstrapModal.Body>
            <div>
              <div className="current-version " data-cy="current-version-section">
                <span data-cy="current-version-label" className="current-version-label">
                  Current Version
                </span>
                <InputRadioField
                  versionId={currentVersion?.id}
                  data-cy={`${currentVersion?.id.toLowerCase().replace(/\s+/g, '-')}-value`}
                  versionName={currentVersion?.name}
                  versionCreatedAt={currentVersion?.createdAt}
                  checked={versionId === currentVersion?.id}
                  setVersionId={setVersionId}
                  className="current-version-wrap"
                />
              </div>
              {versions.length >= 2 ? (
                <div className="other-versions" data-cy="other-version-section">
                  <span data-cy="other-version-label" className="other-version-label">
                    Other Versions
                  </span>
                  {versions.map((version) => {
                    if (version.id !== currentVersion?.id) {
                      return (
                        <InputRadioField
                          versionId={version.id}
                          data-cy={`${version.id.toLowerCase().replace(/\s+/g, '-')}-value`}
                          versionName={version.name}
                          versionCreatedAt={version.createdAt}
                          key={version.name}
                          checked={versionId === version.id}
                          setVersionId={setVersionId}
                          className="other-version-wrap"
                        />
                      );
                    }
                  })}
                </div>
              ) : (
                <div className="other-versions" data-cy="other-version-section">
                  <span data-cy="no-other-versions-found-text">No other versions found</span>
                </div>
              )}
            </div>
          </BootstrapModal.Body>
          <div className="tj-version-wrap-sub-footer">
            <input type="checkbox" checked={exportTjDb} onChange={() => setExportTjDb(!exportTjDb)} />
            <p>Export ToolJet table schema</p>
          </div>
          <BootstrapModal.Footer className="export-app-modal-footer d-flex justify-content-end align-items-center ">
            <ButtonSolid
              className="import-export-footer-btns"
              variant="tertiary"
              data-cy="export-all-button"
              onClick={() => exportApp(app, null, exportTjDb, tables)}
            >
              Export All
            </ButtonSolid>
            <ButtonSolid
              className="import-export-footer-btns"
              data-cy="export-selected-version-button"
              onClick={() => exportApp(app, versionId, exportTjDb, tables)}
            >
              Export selected version
            </ButtonSolid>
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
  className,
}) {
  return (
    <span
      key={key}
      className={`version-wrapper cursor-pointer ${className}`}
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
        <span className="export-creation-date tj-text-sm" data-cy="created-date-label">{`Created on ${moment(
          versionCreatedAt
        ).format('Do MMM YYYY')}`}</span>
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
