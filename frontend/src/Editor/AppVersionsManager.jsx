import React, { useEffect, useState, useRef } from 'react';
import Modal from '../HomePage/Modal';
import { toast } from 'react-hot-toast';
import { appVersionService } from '@/_services';

export const AppVersionsManager = function AppVersionsManager({
  editingVersion,
  deployedVersionId,
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
  }, [appVersions]);

  useEffect(() => {
    appVersionService.getAll(editingAppVersion.app_id).then((data) => {
      setAppVersions(data.versions);
    });
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
        .create(createAppVersionFrom.appId, versionName, createAppVersionFrom.id)
        .then(() => {
          setShowModal(false);
          toast.success('Version Created');

          appVersionService.getAll(createAppVersionFrom.appId).then((data) => {
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
        <span className={`mb-1 ${deployedVersionId === editingAppVersion.id ? 'deployed' : ''}`}>
          {deployedVersionId === editingAppVersion.id && <img src={'/assets/images/icons/editor/deploy-rocket.svg'} />}
          <span>{editingAppVersion.name}</span>
        </span>
        {showDropDown && (
          <div className="dropdown-menu show">
            {appVersions.map((version) =>
              deployedVersionId == version.id ? (
                <div className="row dropdown-item deployed" key={version.id} onClick={() => selectVersion(version)}>
                  {version.name}
                  <div className="deployed-subtext">
                    <img src={'/assets/images/icons/editor/deploy-rocket.svg'} />
                    Currently Deployed
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
  return (
    <Modal show={showModal || showCreateVersionModalPrompt} setShow={setShowModal} title="Create Version">
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

      <div className="mb-3">
        <pre className="highlight">
          This version is already released. Kindly create a new version or switch to a different version to continue
          making changes.
        </pre>
      </div>

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
