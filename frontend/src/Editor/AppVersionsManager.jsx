import React, { useEffect, useState, useRef } from 'react';
import Modal from '../HomePage/Modal';
import { toast } from 'react-hot-toast';
import { appVersionService } from '@/_services';

export const AppVersionsManager = function AppVersionsManager({
  appId,
  editingVersion,
  releasedVersionId,
  setAppDefinitionFromVersion,
  showCreateVersionModalPrompt,
  closeCreateVersionModalPrompt,
}) {
  const [showDropDown, setShowDropDown] = useState(false);
  const [showModal, setShowModal] = useState(showCreateVersionModalPrompt);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [editingAppVersion, setEditingAppVersion] = useState(editingVersion);
  const [versionName, setVersionName] = useState('');
  const [appVersions, setAppVersions] = useState([]);
  const [createAppVersionFrom, setCreateAppVersionFrom] = useState(editingAppVersion);

  useEffect(() => {
    setCreateAppVersionFrom(editingAppVersion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appVersions]);

  useEffect(() => {
    appVersionService.getAll(appId).then((data) => {
      setAppVersions(data.versions);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wrapperRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropDown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  const closeModal = () => {
    setShowModal(false);
    closeCreateVersionModalPrompt();
  };

  const createVersion = (versionName, createAppVersionFrom) => {
    if (versionName.trim() !== '') {
      setIsCreatingVersion(true);
      appVersionService
        .create(appId, versionName, createAppVersionFrom.id)
        .then(() => {
          closeModal();
          toast.success('Version Created');

          appVersionService.getAll(appId).then((data) => {
            setAppVersions(data.versions);

            const latestVersion = data.versions.at(0);
            setAppDefinitionFromVersion(latestVersion);
            setEditingAppVersion(latestVersion);
            setVersionName('');
          });

          setIsCreatingVersion(false);
        })
        .catch((_error) => {
          setIsCreatingVersion(false);
          toast.error('Oops, something went wrong');
        });
    } else {
      toast.error('The name of version should not be empty');
      setIsCreatingVersion(false);
    }
  };

  const selectVersion = (version) => {
    setEditingAppVersion(version);
    setAppDefinitionFromVersion(version);
  };

  return (
    <div ref={wrapperRef} className="input-group app-version-menu">
      <span className="input-group-text app-version-menu-sm">App Version</span>
      <span
        className={`app-version-name form-select app-version-menu-sm ${appVersions ? '' : 'disabled'}`}
        onClick={() => {
          setShowDropDown(!showDropDown);
        }}
      >
        <span className={`${releasedVersionId === editingAppVersion.id ? 'released' : ''}`}>
          {releasedVersionId === editingAppVersion.id && <img src={'/assets/images/icons/editor/deploy-rocket.svg'} />}
          <span className="px-1">{editingAppVersion.name}</span>
        </span>
        {showDropDown && (
          <div className="dropdown-menu show">
            {appVersions.map((version) =>
              releasedVersionId == version.id ? (
                <div className="row dropdown-item released" key={version.id} onClick={() => selectVersion(version)}>
                  {version.name}
                  <div className="released-subtext">
                    <img src={'/assets/images/icons/editor/deploy-rocket.svg'} />
                    <span className="px-1">Currently Released</span>
                  </div>
                </div>
              ) : (
                <div className="dropdown-item" key={version.id} onClick={() => selectVersion(version)}>
                  {version.name}
                </div>
              )
            )}
            <div className="dropdown-divider"></div>
            <div className="dropdown-item" onClick={() => setShowModal(true)}>
              <span className="color-primary create-link">Create Version</span>
            </div>
          </div>
        )}
        <CreateVersionModal
          showModal={showModal}
          setShowModal={closeModal}
          versionName={versionName}
          setVersionName={setVersionName}
          createAppVersionFrom={createAppVersionFrom}
          setCreateAppVersionFrom={setCreateAppVersionFrom}
          createVersion={createVersion}
          isCreatingVersion={isCreatingVersion}
          appVersions={appVersions}
          showCreateVersionModalPrompt={showCreateVersionModalPrompt}
        />
      </span>
    </div>
  );
};

const CreateVersionModal = function CreateVersionModal({
  showModal,
  setShowModal,
  versionName,
  setVersionName,
  createAppVersionFrom,
  setCreateAppVersionFrom,
  createVersion,
  isCreatingVersion,
  appVersions,
  showCreateVersionModalPrompt,
}) {
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      // eslint-disable-next-line no-undef
      createVersion(versionName, createAppVersionFrom);
    }
  };
  return (
    <Modal
      show={showModal || showCreateVersionModalPrompt}
      setShow={setShowModal}
      title="Create Version"
      autoFocus={false}
      closeModal={() => setShowModal(false)}
    >
      <div className="mb-3">
        <div className="col">
          <label className="form-label">Version Name</label>
          <input
            type="text"
            onChange={(e) => setVersionName(e.target.value)}
            className="form-control"
            placeholder="Enter version name"
            disabled={isCreatingVersion}
            value={versionName}
            autoFocus={true}
            onKeyPress={(e) => handleKeyPress(e)}
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">Create version from</label>
        <div className="ts-control">
          <select className="form-select">
            {appVersions.map((version) => (
              <option className="dropdown-item" key={version.id} onClick={() => setCreateAppVersionFrom(version)}>
                {version.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showCreateVersionModalPrompt && (
        <div className="mb-3">
          <div className="light border rounded">
            <div className="container">
              <div className="row py-3">
                <div className="col-1 py-2">
                  <span className="pe-1">
                    <img src={'/assets/images/icons/editor/bulb-sharp.svg'} />
                  </span>
                </div>
                <div className="col">
                  <span>
                    Version already released. Kindly create a new version or switch to a different version to continue
                    making changes.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-3">
        <div className="col d-flex modal-footer-btn">
          <button className="btn btn-light" onClick={() => setShowModal(false)}>
            Cancel
          </button>
          <button
            className={`btn btn-primary ${isCreatingVersion ? 'btn-loading' : ''}`}
            onClick={() => createVersion(versionName, createAppVersionFrom)}
          >
            Create Version
          </button>
        </div>
      </div>
    </Modal>
  );
};
