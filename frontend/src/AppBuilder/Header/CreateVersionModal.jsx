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
  handleCommitOnVersionCreation = () => {},
  versionId,
  onVersionCreated,
}) => {
  const { moduleId } = useModuleContext();
  const setResolvedGlobals = useStore((state) => state.setResolvedGlobals, shallow);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [versionDescription, setVersionDescription] = useState('');
  const isGitSyncEnabled =
    orgGit?.org_git?.git_ssh?.is_enabled ||
    orgGit?.org_git?.git_https?.is_enabled ||
    orgGit?.org_git?.git_lab?.is_enabled;

  const {
    createNewVersionAction,
    fetchDevelopmentVersions,
    developmentVersions,
    appId,
    setCurrentVersionId,
    selectedVersion,
    currentMode,
    isEditorFreezed,
  } = useStore(
    (state) => ({
      createNewVersionAction: state.createNewVersionAction,
      selectedEnvironment: state.selectedEnvironment,
      fetchDevelopmentVersions: state.fetchDevelopmentVersions,
      developmentVersions: state.developmentVersions,
      featureAccess: state.license.featureAccess,
      editingVersion: state.currentVersionId,
      appId: state.appStore.modules[moduleId].app.appId,
      currentVersionId: state.currentVersionId,
      setCurrentVersionId: state.setCurrentVersionId,
      selectedVersion: state.selectedVersion,
      currentMode: state.currentMode,
      isEditorFreezed: state.isEditorFreezed,
    }),
    shallow
  );

  const [selectedVersionForCreation, setSelectedVersionForCreation] = useState(null);
  useEffect(() => {
    fetchDevelopmentVersions(appId);
  }, [appId, fetchDevelopmentVersions]);

  useEffect(() => {
    // If versionId prop is provided, use that version
    if (versionId && developmentVersions?.length) {
      const versionToPromote = developmentVersions.find((version) => version?.id === versionId);
      if (versionToPromote) {
        setSelectedVersionForCreation(versionToPromote);
        return;
      }
    }

    // Otherwise, use selectedVersion from store
    if (developmentVersions?.length && selectedVersion?.id) {
      const selected = developmentVersions.find((version) => version?.id === selectedVersion?.id) || null;
      setSelectedVersionForCreation(selected);
    }
  }, [developmentVersions, selectedVersion, versionId]);

  const { t } = useTranslation();
  const options = developmentVersions.map((version) => {
    return { label: version.name, value: version };
  });

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
    if (versionDescription.trim() == '') {
      toast.error('Version description should not be empty');
      return;
    }

    if (selectedVersionForCreation === undefined) {
      toast.error('Please select a version from.');
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
      setIsCreatingVersion(false);
      setShowCreateAppVersion(false);

      // Fetch versions after creation
      if (onVersionCreated) {
        onVersionCreated();
      }

      // Get version data without reloading the page
      await appVersionService
        .getAppVersionData(appId, selectedVersionForCreation.id, currentMode)
        .then((data) => {
          console.log({ data });
          // handleCommitOnVersionCreation(data);
          // Switch to the newly created version
          if (setCurrentVersionId && data.editing_version?.id) {
            setCurrentVersionId(data.editing_version?.id);
          }
        })
        .catch((error) => {
          toast.error(error);
        });
    } catch (error) {
      if (error?.data?.code === '23505') {
        toast.error('Version name already exists.');
      } else {
        //       toast.error('Error while creating version. Please try again.');
        toast.error(error?.error);
      }
      toast.error('Error while creating version. Please try again.');
    } finally {
      setIsCreatingVersion(false);
    }
  };

  return (
    <AlertDialog
      show={showCreateAppVersion}
      closeModal={() => {
        setVersionName('');
        setShowCreateAppVersion(false);
      }}
      title={'Create new version'}
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
          <div className="create-version-body mb-3 pb-2">
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
              <small className="version-name-helper-text">
                {t('editor.appVersionManager.versionNameHelper', 'Version name must be unique and max 25 characters')}
              </small>
            </div>
            <div className="col mt-2">
              <label className="form-label mb-1 ms-1" data-cy="version-description-label">
                {t('editor.appVersionManager.versionDescription', 'Version Description')}
              </label>
              <textarea
                type="text"
                onChange={(e) => setVersionDescription(e.target.value)}
                className="form-control app-version-description"
                data-cy="version-description-input-field"
                placeholder={t('editor.appVersionManager.enterVersionDescription', 'Enter version description')}
                disabled={isCreatingVersion}
                value={versionDescription}
                autoFocus={true}
                minLength="0"
                maxLength="500"
              />
              <small className="version-description-helper-text">
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
                  <div
                    className="create-version-helper-text"
                    style={{ marginBottom: '12px' }}
                    data-cy="create-version-helper-text"
                  >
                    Creating this version will lock it. Any edits afterwards will automatically start a new draft.
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
                  setShowCreateAppVersion(false);
                }}
                variant="tertiary"
                className="mx-2"
              >
                {t('globals.cancel', 'Cancel')}
              </ButtonSolid>
              <ButtonSolid size="lg" variant="primary" className="" type="submit">
                {t('editor.appVersionManager.createVersion', 'Create Version')}
              </ButtonSolid>
            </div>
          </div>
        </form>
      )}
    </AlertDialog>
  );
};

export default CreateVersionModal;
