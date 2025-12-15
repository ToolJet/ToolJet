import React, { useEffect, useState } from 'react';
import { appVersionService, authenticationService, gitSyncService } from '@/_services';
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

const CreateVersionModal = ({
  showCreateAppVersion,
  setShowCreateAppVersion,
  handleCommitEnableChange,
  canCommit,
  orgGit,
  fetchingOrgGit,
  handleCommitOnVersionCreation = () => { },
  versionId,
  onVersionCreated,
}) => {
  const { moduleId } = useModuleContext();
  const setResolvedGlobals = useStore((state) => state.setResolvedGlobals, shallow);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [versionDescription, setVersionDescription] = useState('');
  const isGitSyncEnabled = orgGit?.git_ssh?.is_enabled || orgGit?.git_https?.is_enabled || orgGit?.git_lab?.is_enabled;
  const {
    changeEditorVersionAction,
    environmentChangedAction,
    fetchDevelopmentVersions,
    developmentVersions,
    appId,
    selectedVersion,
    currentMode,
    currentEnvironment,
    environments,
    setIsEditorFreezed,
  } = useStore(
    (state) => ({
      changeEditorVersionAction: state.changeEditorVersionAction,
      environmentChangedAction: state.environmentChangedAction,
      selectedEnvironment: state.selectedEnvironment,
      fetchDevelopmentVersions: state.fetchDevelopmentVersions,
      developmentVersions: state.developmentVersions,
      featureAccess: state.license.featureAccess,
      editingVersion: state.currentVersionId,
      appId: state.appStore.modules[moduleId].app.appId,
      currentVersionId: state.currentVersionId,
      selectedVersion: state.selectedVersion,
      currentMode: state.currentMode,
      currentEnvironment: state.selectedEnvironment,
      environments: state.environments,
      setIsEditorFreezed: state.setIsEditorFreezed,
    }),
    shallow
  );

  const [selectedVersionForCreation, setSelectedVersionForCreation] = useState(null);
  const textareaRef = React.useRef(null);

  const handleDescriptionInput = (e) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const lineHeight = 24;
    const maxLines = 4;
    const maxHeight = lineHeight * maxLines;
    textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  useEffect(() => {
    if (appId) {
      fetchDevelopmentVersions(appId);
    }
  }, [appId, fetchDevelopmentVersions]);

  // Set the version to promote when modal opens or when developmentVersions/versionId changes
  useEffect(() => {
    // Only run when modal is open
    if (!showCreateAppVersion) {
      return;
    }

    // Wait for developmentVersions to be loaded
    if (!developmentVersions?.length) {
      return;
    }

    // If versionId prop is provided, ONLY use that specific version
    if (versionId) {
      const versionToPromote = developmentVersions.find((version) => version?.id === versionId);
      if (versionToPromote) {
        setSelectedVersionForCreation(versionToPromote);
        setVersionName(versionToPromote.name);
        setVersionDescription(versionToPromote.description || '');
      }
      return;
    }

    // If no versionId prop, use selectedVersion from store
    if (selectedVersion?.id) {
      const selected = developmentVersions.find((version) => version?.id === selectedVersion?.id);
      if (selected) {
        setSelectedVersionForCreation(selected);
        setVersionName(selected.name);
        setVersionDescription(selected.description || '');
        return;
      }
    }

    // Fallback: if no version is selected or found, use the first development version
    if (developmentVersions.length > 0) {
      setSelectedVersionForCreation(developmentVersions[0]);
      setVersionName(developmentVersions[0].name);
      setVersionDescription(developmentVersions[0].description || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [developmentVersions, versionId, showCreateAppVersion]);

  const { t } = useTranslation();

  const createVersion = async () => {
    if (versionName.trim().length > 25) {
      toast.error('Version name should not be longer than 25 characters');
      return;
    }
    if (versionDescription.trim().length > 500) {
      toast.error('Version description should not be longer than 500 characters');
      return;
    }
    if (versionName.trim() == '') {
      toast.error('Version name should not be empty');
      return;
    }

    if (!selectedVersionForCreation) {
      toast.error('Please wait while versions are loading...');
      return;
    }

    setIsCreatingVersion(true);

    try {
      await appVersionService.save(appId, selectedVersionForCreation.id, {
        name: versionName,
        description: versionDescription,
        // need to add commit changes logic here
        status: 'PUBLISHED',
      });
      toast.success('Version Created successfully');
      setVersionName('');
      setVersionDescription('');
      setSelectedVersionForCreation(null);
      setIsCreatingVersion(false);
      setShowCreateAppVersion(false);

      // Fetch versions after creation
      if (onVersionCreated) {
        onVersionCreated();
      }
      // Refresh development versions to update the lock status
      fetchDevelopmentVersions(appId);
      // Switch to the newly created published version properly
      // The newly created version will be in the draft's environment (development)
      // but with PUBLISHED status. We may need to switch environment first.
      try {
        const newVersionData = await appVersionService.getAppVersionData(
          appId,
          selectedVersionForCreation.id,
          currentMode
        );

        // Set editor freeze state based on should_freeze_editor
        if (newVersionData.should_freeze_editor !== undefined) {
          setIsEditorFreezed(newVersionData.should_freeze_editor);
        }

        if (newVersionData.editing_version?.id) {
          const newVersionEnvironmentId = newVersionData.editing_version.currentEnvironmentId;
          const isDifferentEnvironment = newVersionEnvironmentId !== currentEnvironment?.id;

          if (isDifferentEnvironment) {
            // Need to switch environment first, then switch to the version
            const targetEnvironment = environments.find((env) => env.id === newVersionEnvironmentId);
            if (targetEnvironment) {
              // First switch environment
              await environmentChangedAction(targetEnvironment, () => {
                // Then switch to the new version
                changeEditorVersionAction(
                  appId,
                  newVersionData.editing_version.id,
                  () => {
                    console.log('Successfully switched environment and version');
                    handleCommitOnVersionCreation(newVersionData, selectedVersion);
                  },
                  (error) => {
                    console.error('Error switching to newly created version:', error);
                    toast.error('Version created but failed to switch to it');
                  }
                );
              });
            }
          } else {
            // Same environment, just switch version
            await changeEditorVersionAction(
              appId,
              newVersionData.editing_version.id,
              () => {
                handleCommitOnVersionCreation(newVersionData, selectedVersion);
              },
              (error) => {
                console.error('Error switching to newly created version:', error);
                toast.error('Version created but failed to switch to it');
              }
            );
          }
        }
      } catch (error) {
        console.error('Error getting new version data:', error);
        toast.error('Version created but failed to switch to it');
      }
    } catch (error) {
      if (error?.data?.code === '23505') {
        toast.error('Version name already exists.');
      } else if (error?.error) {
        toast.error(error?.error);
      }
      else {
        toast.error('Error while creating version. Please try again.');
      }
    } finally {
      setIsCreatingVersion(false);
    }
  };

  return (
    <AlertDialog
      show={showCreateAppVersion}
      closeModal={() => {
        setVersionName('');
        setVersionDescription('');
        setSelectedVersionForCreation(null);
        setShowCreateAppVersion(false);
      }}
      title={'Save version'}
      customClassName="create-version-modal"
    >
      {fetchingOrgGit ? (
        <div className="loader-container">
          <div className="primary-spin-loader"></div>
        </div>
      ) : (
        <form
          className="create-version-form"
          onSubmit={(e) => {
            e.preventDefault();
            createVersion();
          }}
        >
          <div className="create-version-body mb-3">
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
              />
              <small className="version-name-helper-text" data-cy="version-name-helper-text">
                {t('editor.appVersionManager.versionNameHelper', 'Version name must be unique and max 25 characters')}
              </small>
            </div>
            <div className="col mt-2">
              <label className="form-label mb-1 ms-1" data-cy="version-description-label">
                {t('editor.appVersionManager.versionDescription', 'Version description')}
              </label>
              <textarea
                type="text"
                ref={textareaRef}
                onInput={handleDescriptionInput}
                onChange={(e) => setVersionDescription(e.target.value)}
                className="form-control app-version-description"
                data-cy="version-description-input-field"
                placeholder={t('editor.appVersionManager.enterVersionDescription', 'Enter version description')}
                disabled={isCreatingVersion}
                value={versionDescription}
                autoFocus={true}
                minLength="0"
                maxLength="500"
                rows={1}
              />
              <small className="version-description-helper-text" data-cy="version-description-helper-text">
                {t('editor.appVersionManager.versionDescriptionHelper', 'Description must be max 500 characters')}
              </small>
            </div>

            {/* <div className="mb-4 pb-2 version-select">
            <label className="form-label" data-cy="create-version-from-label">
              {t('editor.appVersionManager.createVersionFrom', 'Create version from')}
            </label>
            <div className="ts-control" data-cy="create-version-from-input-field">
              <Select
                options={options}
                value={selectedVersionForCreation}
                onChange={(version) => {
                  setSelectedVersionForCreation(version);
                }}
                useMenuPortal={false}
                width="100%"
                maxMenuHeight={100}
              />
            </div>
          </div> */}

            {isGitSyncEnabled && (
              <div className="commit-changes mt-3">
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
            <div className="mt-3">
              <Alert placeSvgTop={true} svg="warning-icon" className="create-version-alert">
                <div
                  className="d-flex align-items-center"
                  style={{
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    width: '100%',
                  }}
                >
                  <div className="create-version-helper-text" data-cy="create-version-helper-text">
                    Saving the version will lock it. To make any edits afterwards, you&apos;ll need to create a draft
                    version.
                  </div>
                </div>
              </Alert>
            </div>
          </div>

          <div className="create-version-footer">
            <hr className="section-divider" style={{ marginLeft: '-1.5rem', marginRight: '-1.5rem' }} />
            <div className="col d-flex justify-content-end">
              <ButtonSolid
                size="lg"
                onClick={() => {
                  setVersionName('');
                  setVersionDescription('');
                  setShowCreateAppVersion(false);
                }}
                variant="tertiary"
                className="mx-2"
                data-cy="create-version-cancel-button"
              >
                {t('globals.cancel', 'Cancel')}
              </ButtonSolid>
              <ButtonSolid
                size="lg"
                variant="primary"
                className=""
                type="submit"
                disabled={!selectedVersionForCreation || isCreatingVersion}
                data-cy="create-version-save-button"
              >
                {t('editor.appVersionManager.saveVersion', 'Save version')}
              </ButtonSolid>
            </div>
          </div>
        </form>
      )}
    </AlertDialog>
  );
};

export default CreateVersionModal;
