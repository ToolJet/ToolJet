import React, { useEffect, useState, useRef } from 'react';
import Modal from '../HomePage/Modal';
import { toast } from 'react-hot-toast';
import { appVersionService } from '@/_services';
import { Confirm } from './Viewer/Confirm';
import Select from '../_ui/Select';
import defaultStyle from '../_ui/Select/styles';
export const AppVersionsManager = function AppVersionsManager({
  appId,
  editingVersion,
  releasedVersionId,
  setAppDefinitionFromVersion,
  showCreateVersionModalPrompt,
  closeCreateVersionModalPrompt,
}) {
  const [showDropDown, setShowDropDown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [isEditingVersion, setIsEditingVersion] = useState(false);
  const [deletingVersionId, setDeletingVersionId] = useState(null);
  const [updatingVersionId, setUpdatingVersionId] = useState(null);
  const [isDeletingVersion, setIsDeletingVersion] = useState(false);
  const [editingAppVersion, setEditingAppVersion] = useState(editingVersion);
  const [versionName, setVersionName] = useState('');
  const [appVersions, setAppVersions] = useState([]);
  const [showVersionDeletionConfirmation, setShowVersionDeletionConfirmation] = useState(false);
  const [showVersionUpdateModal, setShowVersionUpdateModal] = useState(false);
  const [mouseHoveredOnVersion, setMouseHoveredOnVersion] = useState(null);
  const [createAppVersionFrom, setCreateAppVersionFrom] = useState(editingAppVersion);

  useEffect(() => {
    setCreateAppVersionFrom(editingAppVersion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appVersions]);

  useEffect(() => {
    setVersionName('');
    setShowModal(showCreateVersionModalPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCreateVersionModalPrompt]);

  useEffect(() => {
    appVersionService.getAll(appId).then((data) => {
      setAppVersions(data.versions);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setEditingAppVersion(editingVersion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingVersion]);

  useEffect(() => {
    appVersions[appVersions.findIndex((appVersion) => appVersion.id === editingVersion.id)] = editingAppVersion;
    setCreateAppVersionFrom(editingAppVersion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingAppVersion]);

  const wrapperRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!showVersionDeletionConfirmation && wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropDown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef, showVersionDeletionConfirmation]);

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
          toast.error(_error?.error);
        });
    } else {
      toast.error('The name of version should not be empty');
      setIsCreatingVersion(false);
    }
  };

  const deleteAppVersion = (versionId) => {
    setIsDeletingVersion(true);
    appVersionService
      .del(appId, versionId)
      .then(() => {
        toast.success('Version Deleted');

        appVersionService.getAll(appId).then((data) => {
          setAppVersions(data.versions);

          if (editingAppVersion.id === versionId) {
            const latestVersion = data.versions.at(0);
            setAppDefinitionFromVersion(latestVersion);
            setEditingAppVersion(latestVersion);
          }
        });

        setIsDeletingVersion(false);
        setShowVersionDeletionConfirmation(false);
      })
      .catch((_error) => {
        setIsDeletingVersion(false);
        setShowVersionDeletionConfirmation(false);
        toast.error('Oops, something went wrong');
      });
  };

  const selectVersion = (version) => {
    appVersionService.getOne(appId, version.id).then((data) => {
      setAppDefinitionFromVersion(data);
    });
  };

  const editVersionName = () => {
    if (versionName.trim() !== '') {
      setIsEditingVersion(true);
      appVersionService
        .save(appId, updatingVersionId, { name: versionName })
        .then(() => {
          toast.success('Version name updated');
          appVersionService.getAll(appId).then((data) => {
            const versions = data.versions;
            setAppVersions(versions);
            updatingVersionId === editingAppVersion.id &&
              versions.map((appVersion) => {
                if (appVersion.id === updatingVersionId) {
                  setEditingAppVersion(appVersion);
                  setUpdatingVersionId(null);
                }
              });
          });
          setIsEditingVersion(false);
          setShowVersionUpdateModal(false);
        })
        .catch((_error) => {
          setIsEditingVersion(false);
          setShowVersionDeletionConfirmation(false);
          toast.error(_error?.error);
        });
    } else {
      toast.error('The name of version should not be empty');
      setIsEditingVersion(false);
    }
  };

  return (
    <div ref={wrapperRef} className="input-group app-version-menu">
      <span className="input-group-text app-version-menu-sm">Version</span>
      <span
        className={`app-version-name form-select app-version-menu-sm ${appVersions ? '' : 'disabled'}`}
        onClick={() => {
          setShowDropDown(!showDropDown);
        }}
      >
        <span className={`${releasedVersionId === editingAppVersion.id ? 'released' : ''}`}>
          {releasedVersionId === editingAppVersion.id && <img src={'assets/images/icons/editor/deploy-rocket.svg'} />}
          <span className="px-1">{editingAppVersion.name}</span>
        </span>
        {showDropDown && (
          <>
            <div className="dropdown-menu app-version-container show">
              <div className="app-version-content">
                {appVersions.map((version) =>
                  releasedVersionId == version.id ? (
                    <>
                      <div
                        className="row dropdown-item released"
                        key={version.id}
                        onClick={() => selectVersion(version)}
                      >
                        <div className="col-md-4">{version.name}</div>
                        <div className="released-subtext">
                          <img src={'assets/images/icons/editor/deploy-rocket.svg'} />
                          <span className="px-1">Currently Released</span>
                        </div>
                      </div>
                      <div className="dropdown-divider m-0"></div>
                    </>
                  ) : (
                    <>
                      <div
                        className="dropdown-item row"
                        key={version.id}
                        onClick={() => selectVersion(version)}
                        onMouseEnter={() => setMouseHoveredOnVersion(version.id)}
                        onMouseLeave={() => setMouseHoveredOnVersion(null)}
                      >
                        <div className="col-md-4">{version.name}</div>

                        <div className="col-md-2 offset-md-5 d-flex" style={{ gap: 5, paddingLeft: 10 }}>
                          <button
                            className="btn badge bg-azure-lt"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUpdatingVersionId(version.id);
                              setVersionName(version.name);
                              setShowVersionUpdateModal(true);
                            }}
                            style={{
                              display: mouseHoveredOnVersion === version.id ? 'flex' : 'none',
                            }}
                          >
                            <img
                              src="assets/images/icons/edit.svg"
                              width="12"
                              height="12"
                              className="mx-1"
                              style={{ paddingLeft: '0.6px' }}
                            />
                          </button>

                          <button
                            className="btn badge bg-azure-lt"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingVersionId(version.id);
                              setShowVersionDeletionConfirmation(true);
                            }}
                            disabled={isDeletingVersion}
                            style={{
                              display: mouseHoveredOnVersion === version.id ? 'flex' : 'none',
                            }}
                          >
                            <img
                              src="assets/images/icons/query-trash-icon.svg"
                              width="12"
                              height="12"
                              className="mx-1"
                              style={{ paddingLeft: '0.6px' }}
                            />
                          </button>
                        </div>
                      </div>
                      <div className="dropdown-divider m-0"></div>
                    </>
                  )
                )}
              </div>
              <div
                className="dropdown-item"
                onClick={() => {
                  setVersionName('');
                  setShowModal(true);
                }}
              >
                <span className="color-primary create-link">Create Version</span>
              </div>
              <Confirm
                show={showVersionDeletionConfirmation}
                message={'Do you really want to delete this version?'}
                confirmButtonLoading={isDeletingVersion}
                onConfirm={(versionId) => deleteAppVersion(versionId)}
                queryConfirmationData={deletingVersionId}
                onCancel={() => setShowVersionDeletionConfirmation(false)}
              />
            </div>
          </>
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
      <Modal show={showVersionUpdateModal} closeModal={() => setShowVersionUpdateModal(false)} title="Edit version">
        <div className="row">
          <div className="col modal-main">
            <input
              type="text"
              onChange={(e) => setVersionName(e.target.value)}
              className="form-control"
              placeholder="version name"
              disabled={isEditingVersion}
              value={versionName}
              maxLength={25}
            />
          </div>
        </div>
        <div className="row">
          <div className="col d-flex modal-footer-btn">
            <button className="btn btn-light" onClick={() => setShowVersionUpdateModal(false)}>
              Cancel
            </button>
            <button className={`btn btn-primary ${isEditingVersion ? 'btn-loading' : ''}`} onClick={editVersionName}>
              Save
            </button>
          </div>
        </div>
      </Modal>
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
  const options = appVersions.map((version) => {
    return { ...version, label: version.name, value: version };
  });
  const width = '100%';
  const height = 32;
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const customStyles = {
    ...defaultStyle(darkMode, width, height),
    option: (provided, state) => {
      return {
        ...provided,
        backgroundColor: darkMode
          ? state.isSelected
            ? '#3650AF'
            : 'rgb(31,40,55)'
          : state.isSelected
          ? '#7A95FB'
          : 'white',
        color: darkMode ? '#fff' : '#232e3c',
        '&:hover': {
          backgroundColor: darkMode
            ? state.isSelected
              ? '#1F2E64'
              : '#323C4B'
            : state.isSelected
            ? '#3650AF'
            : '#d8dce9',
        },
      };
    },
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

      <div className="mb-3" style={{ padding: '2rem 0' }}>
        <label className="form-label">Create version from</label>
        <div className="ts-control">
          <Select
            options={options}
            defaultValue={options[options.length - 1]}
            onChange={(version) => {
              setCreateAppVersionFrom(version);
            }}
            useMenuPortal={false}
            width="100%"
            maxMenuHeight={100}
            styles={customStyles}
          />
        </div>
      </div>

      {showCreateVersionModalPrompt && (
        <div className="mb-3">
          <div className="light border rounded">
            <div className="container">
              <div className="row py-3">
                <div className="col-1 py-2">
                  <span className="pe-1">
                    <img src={'assets/images/icons/editor/bulb-sharp.svg'} />
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
