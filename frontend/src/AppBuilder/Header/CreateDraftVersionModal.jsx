import React, { useEffect, useState } from 'react';
import AlertDialog from '@/_ui/AlertDialog';
import { Alert } from '@/_ui/Alert';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Select from '@/_ui/Select';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import '../../_styles/version-modal.scss';

const CreateDraftVersionModal = ({
  showCreateAppVersion,
  setShowCreateAppVersion,
  handleCommitEnableChange,
  canCommit,
  orgGit,
  fetchingOrgGit,
  handleCommitOnVersionCreation = () => { },
}) => {
  const { moduleId } = useModuleContext();
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [isGitSyncEnabled, setIsGitSyncEnabled] = useState(false);
  const {
    createNewVersionAction,
    changeEditorVersionAction,
    fetchDevelopmentVersions,
    developmentVersions,
    appId,
    selectedVersion,
  } = useStore(
    (state) => ({
      createNewVersionAction: state.createNewVersionAction,
      changeEditorVersionAction: state.changeEditorVersionAction,
      selectedEnvironment: state.selectedEnvironment,
      fetchDevelopmentVersions: state.fetchDevelopmentVersions,
      developmentVersions: state.developmentVersions,
      featureAccess: state.license.featureAccess,
      editingVersion: state.currentVersionId,
      appId: state.appStore.modules[moduleId].app.appId,
      currentVersionId: state.currentVersionId,
      selectedVersion: state.selectedVersion,
    }),
    shallow
  );

  // Filter out draft versions - show all saved versions (PUBLISHED + any released)
  const savedVersions = developmentVersions.filter((version) => version.status !== 'DRAFT');
  useEffect(() => {
    const gitSyncEnabled =
      orgGit?.git_ssh?.is_enabled ||
      orgGit?.git_https?.is_enabled ||
      orgGit?.git_lab?.is_enabled;
    setIsGitSyncEnabled(gitSyncEnabled);
  }, [orgGit]);

  const [selectedVersionForCreation, setSelectedVersionForCreation] = useState(null);

  useEffect(() => {
    if (appId) {
      fetchDevelopmentVersions(appId);
    }
  }, [appId, fetchDevelopmentVersions]);

  useEffect(() => {
    if (selectedVersionForCreation) {
      return;
    }
    // If savedVersions is empty but we have a selectedVersion that is not DRAFT, use it
    if (!savedVersions?.length) {
      if (selectedVersion && selectedVersion.status !== 'DRAFT') {
        setSelectedVersionForCreation(selectedVersion);
      }
      return;
    }

    // If selectedVersion exists in savedVersions, use it
    if (selectedVersion?.id) {
      const selected = savedVersions.find((version) => version?.id === selectedVersion?.id);
      if (selected) {
        setSelectedVersionForCreation(selected);
        return;
      }
    }

    // Otherwise, default to the first saved version
    if (savedVersions.length > 0) {
      setSelectedVersionForCreation(savedVersions[0]);
    }
  }, [savedVersions, selectedVersion, selectedVersionForCreation]);

  // Update version name when selectedVersionForCreation changes or when modal opens
  useEffect(() => {
    if (showCreateAppVersion && selectedVersionForCreation?.name) {
      setVersionName(selectedVersionForCreation.name);
    }
  }, [selectedVersionForCreation, showCreateAppVersion]);

  const { t } = useTranslation();

  // Create options from savedVersions (all non-draft versions)
  const options =
    savedVersions.length > 0
      ? savedVersions.map((version) => ({ label: version.name, value: version.id }))
      : selectedVersion && selectedVersion.status !== 'DRAFT'
        ? [{ label: selectedVersion.name, value: selectedVersion.id }]
        : [];

  const createVersion = () => {
    if (versionName.trim().length > 25) {
      toast.error('Version name should not be longer than 25 characters');
      return;
    }
    if (versionName.trim() == '') {
      toast.error('Version name should not be empty');
      return;
    }

    if (!selectedVersionForCreation || selectedVersionForCreation === undefined) {
      toast.error('Please select a version from.');
      return;
    }

    setIsCreatingVersion(true);

    //TODO: pass environmentId to the func
    createNewVersionAction(
      appId,
      versionName,
      selectedVersionForCreation.id,
      '',
      (newVersion) => {
        toast.success('Version Created');
        setVersionName('');
        setIsCreatingVersion(false);
        setShowCreateAppVersion(false);
        // Refresh development versions to update the list with the new draft
        fetchDevelopmentVersions(appId);
        // Use changeEditorVersionAction to properly switch to the new draft version
        // This will update selectedVersion with all fields including status
        changeEditorVersionAction(
          appId,
          newVersion.id,
          (data) => {
            handleCommitOnVersionCreation(data);
          },
          (error) => {
            console.error('Error switching to new draft version:', error);
            toast.error('Draft created but failed to switch to it');
          }
        );
      },
      (error) => {
        if (error?.data?.code === '23505') {
          toast.error('Version name already exists.');
        } else {
          toast.error(error);
        }
        setIsCreatingVersion(false);
      }
    );
  };

  return (
    <AlertDialog
      show={showCreateAppVersion}
      closeModal={() => {
        setVersionName('');
        setShowCreateAppVersion(false);
      }}
      title={t('editor.appVersionManager.createDraftVersion', 'Create draft version')}
      customClassName="create-draft-version-modal"
    >
      {fetchingOrgGit ? (
        <div className="loader-container">
          <div className="primary-spin-loader"></div>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createVersion();
          }}
        >
          <div className="create-draft-version-body">
            <div className="mb-3">
              <div className="col">
                <label className="form-label mb-1 ms-1" data-cy="version-name-label">
                  {t('editor.appVersionManager.versionName', 'Version Name')}
                </label>
                <input
                  type="text"
                  onChange={(e) => setVersionName(e.target.value)}
                  className="form-control"
                  data-cy="version-name-input-field"
                  placeholder={t('editor.appVersionManager.enterVersionName', 'Enter version name')}
                  disabled={isCreatingVersion}
                  value={versionName}
                  autoFocus={true}
                  minLength="1"
                  maxLength="25"
                  style={{ height: '32px' }}
                />
                <small className="version-name-helper-text" data-cy="version-name-helper-text">
                  {t('editor.appVersionManager.versionNameHelper', 'Version name must be unique and max 25 characters')}
                </small>
              </div>
            </div>

            <div className="mt-3 mb-3 version-select">
              <div className="col">
                <label className="form-label mb-1 ms-1" data-cy="create-draft-version-from-label">
                  {t('editor.appVersionManager.createVersionFrom', 'Create from version')}
                </label>
                <div className="ts-control" data-cy="create-draft-version-from-input-field">
                  <Select
                    options={options}
                    value={selectedVersionForCreation?.id}
                    onChange={(versionId) => {
                      const version = savedVersions.find((v) => v.id === versionId);
                      setSelectedVersionForCreation(version);
                    }}
                    useMenuPortal={false}
                    width="100%"
                    maxMenuHeight={100}
                  />
                </div>
              </div>
            </div>

            <Alert
              placeSvgTop={true}
              svg="warning-icon"
              cls={`create-draft-version-alert ${isGitSyncEnabled ? 'git-sync-enabled' : 'git-sync-disabled'}`}
            >
              <div
                className="d-flex align-items-center"
                style={{
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  width: '100%',
                  marginRight: '6px',
                }}
              >
                <div
                  className="create-draft-version-helper-text"
                  style={{ marginBottom: '12px' }}
                  data-cy="create-draft-version-helper-text"
                >
                  Draft version can only be created from saved versions.{' '}
                </div>
              </div>
            </Alert>

            {isGitSyncEnabled && (
              <div className="commit-changes mb-3">
                <div>
                  <input
                    className="form-check-input"
                    checked={canCommit}
                    type="checkbox"
                    onChange={handleCommitEnableChange}
                    data-cy="git-commit-input"
                  />
                </div>
                <div>
                  <div className="tj-text tj-text-xsm" data-cy="commit-changes-label">
                    Commit changes
                  </div>
                  <div className="tj-text-xxsm" data-cy="commit-helper-text">
                    This will commit the creation of the new version to the git repo
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="create-draft-version-footer">
            <hr className="section-divider" style={{ marginLeft: '-1.5rem', marginRight: '-1.5rem' }} />
            <div className="col d-flex justify-content-end">
              <ButtonSolid
                size="lg"
                onClick={() => {
                  setVersionName('');
                  setShowCreateAppVersion(false);
                }}
                variant="tertiary"
                className="mx-2"
                data-cy="create-draft-version-cancel-button"
              >
                {t('globals.cancel', 'Cancel')}
              </ButtonSolid>
              <ButtonSolid
                size="lg"
                variant="primary"
                className=""
                type="submit"
                disabled={!selectedVersionForCreation}
                data-cy="create-draft-version-create-button"
              >
                {t('editor.appVersionManager.createVersion', 'Create Version')}
              </ButtonSolid>
            </div>
          </div>
        </form>
      )}
    </AlertDialog>
  );
};

export default CreateDraftVersionModal;
