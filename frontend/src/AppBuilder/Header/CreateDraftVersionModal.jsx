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

const CreateDraftVersionModal = ({
  showCreateAppVersion,
  setShowCreateAppVersion,
  handleCommitEnableChange,
  canCommit,
  orgGit,
  fetchingOrgGit,
  handleCommitOnVersionCreation = () => {},
}) => {
  const { moduleId } = useModuleContext();
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [versionName, setVersionName] = useState('');
  const isGitSyncEnabled =
    orgGit?.org_git?.git_ssh?.is_enabled ||
    orgGit?.org_git?.git_https?.is_enabled ||
    orgGit?.org_git?.git_lab?.is_enabled;
  const {
    createNewVersionAction,
    fetchDevelopmentVersions,
    developmentVersions,
    publishedVersions,
    appId,
    setCurrentVersionId,
    selectedVersion,
    currentMode,
  } = useStore(
    (state) => ({
      createNewVersionAction: state.createNewVersionAction,
      selectedEnvironment: state.selectedEnvironment,
      fetchDevelopmentVersions: state.fetchDevelopmentVersions,
      developmentVersions: state.developmentVersions,
      publishedVersions: state.publishedVersions,
      featureAccess: state.license.featureAccess,
      editingVersion: state.currentVersionId,
      appId: state.appStore.modules[moduleId].app.appId,
      currentVersionId: state.currentVersionId,
      setCurrentVersionId: state.setCurrentVersionId,
      selectedVersion: state.selectedVersion,
      currentMode: state.currentMode,
    }),
    shallow
  );

  const [selectedVersionForCreation, setSelectedVersionForCreation] = useState(null);
  useEffect(() => {
    fetchDevelopmentVersions(appId);
  }, []);

  useEffect(() => {
    if (developmentVersions?.length && selectedVersion?.id) {
      const selected = developmentVersions.find((version) => version?.id === selectedVersion?.id) || null;
      setSelectedVersionForCreation(selected);
    }
  }, [developmentVersions, selectedVersion]);

  const { t } = useTranslation();
  const options = publishedVersions.map((version) => {
    return { label: version.name, value: version };
  });

  const createVersion = () => {
    if (versionName.trim().length > 25) {
      toast.error('Version name should not be longer than 25 characters');
      return;
    }
    if (versionName.trim() == '') {
      toast.error('Version name should not be empty');
      return;
    }

    if (selectedVersionForCreation === undefined) {
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
        appVersionService
          .getAppVersionData(appId, newVersion.id, currentMode)
          .then((data) => {
            setCurrentVersionId(newVersion.id);
            handleCommitOnVersionCreation(data);
          })
          .catch((error) => {
            toast.error(error);
          });
      },
      (error) => {
        console.log('testing error', error);
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
          <div className="mb-3">
            <div className="col">
              <label className="form-label mb-1 ml-1" style={{ marginBottom: '6px' }} data-cy="version-name-label">
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
          </div>

          <div className="mb-3 pb-2 version-select">
            <div className="col">
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
            </div>
          </div>

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
                Draft version can only be created from saved versions.{' '}
              </div>
            </div>
          </Alert>

          {isGitSyncEnabled && (
            <div className="commit-changes" style={{ marginBottom: '1rem' }}>
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

          <div className="create-version-footer">
            <hr className="section-divider" style={{ marginLeft: '-1.5rem', marginRight: '-1.5rem' }} />
            <div className="mb-3">
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
          </div>
        </form>
      )}
    </AlertDialog>
  );
};

export default CreateDraftVersionModal;
