import React, { useEffect, useState } from 'react';
import AlertDialog from '@/_ui/AlertDialog';
import { Alert } from '@/_ui/Alert';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Select from '@/_ui/Select';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { useGitSyncConfig } from '@/AppBuilder/_hooks/useGitSyncConfig';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import '../../_styles/version-modal.scss';
import { useVersionManagerStore } from '@/_stores/versionManagerStore';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';

const CreateDraftVersionModal = ({ showCreateAppVersion, setShowCreateAppVersion, fetchingOrgGit }) => {
  const { moduleId } = useModuleContext();
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const { isGitSyncEnabled, defaultBranch } = useGitSyncConfig();
  const refreshVersions = useVersionManagerStore((state) => state.refreshVersions);
  const {
    createNewVersionAction,
    changeEditorVersionAction,
    fetchDevelopmentVersions,
    developmentVersions,
    appId,
    selectedVersion,
    selectedEnvironment,
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

  const isMultiBranchingEnabled = useWorkspaceBranchesStore((state) => state.isMultiBranchingEnabled);

  // Filter out draft versions - show all saved versions (PUBLISHED + any released)
  const savedVersions = developmentVersions.filter((version) => version.status !== 'DRAFT');
  const [selectedVersionForCreation, setSelectedVersionForCreation] = useState(null);

  // Unsynced apps (never pushed to git) behave like a non-git workspace for this modal —
  // no branch-name auto-fill, user picks their own draft name. isSynced propagates from
  // the source version being created from (see `createVersion` in versions/util.service.ts).
  const isAppGitTracked = isGitSyncEnabled && selectedVersionForCreation?.isSynced !== false;

  // Git single-branch replace flow: git enabled + branching disabled (by license or manually) +
  // the app is SYNCED (a synced draft already exists). Git keeps exactly one draft tied to the
  // default branch, so creating a new draft from a saved version REPLACES it (backend swaps it
  // atomically via `replace: true`). Unsynced apps (is_synced=false) are exempt from the single-draft
  // rule — they behave like git-off (unlimited drafts) and use the normal create flow below.
  const hasSyncedDraft = developmentVersions.some(
    (v) => v.versionType === 'version' && v.status === 'DRAFT' && v.isSynced !== false
  );
  const isReplaceFlow = isGitSyncEnabled && !isMultiBranchingEnabled && hasSyncedDraft;

  // Use git draft naming (auto name = default branch, no name input/validation) whenever the
  // resulting draft is git-tracked: either the source version is synced, or this is the single-branch
  // replace flow (the draft is the default-branch working draft regardless of the source's own flag).
  const useGitDraftName = isAppGitTracked || isReplaceFlow;

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

  const { t } = useTranslation();

  // Create options from savedVersions (all non-draft versions)
  const options =
    savedVersions.length > 0
      ? savedVersions.map((version) => ({ label: version.name, value: version.id }))
      : selectedVersion && selectedVersion.status !== 'DRAFT'
      ? [{ label: selectedVersion.name, value: selectedVersion.id }]
      : [];

  const [versionName, setVersionName] = useState('');

  const createVersion = () => {
    if (!selectedVersionForCreation || selectedVersionForCreation === undefined) {
      toast.error('Please select a version from.');
      return;
    }

    if (!useGitDraftName) {
      if (!versionName || versionName.trim() === '') {
        toast.error('Version name should not be empty');
        return;
      }
      if (versionName.trim().length > 25) {
        toast.error('Version name should not be longer than 25 characters');
        return;
      }
      if (/[\s~^:?*[\]\\@{]/.test(versionName.trim())) {
        toast.error('Version name cannot contain spaces or special characters (~ ^ : ? * [ \\ @ {).');
        return;
      }
    }

    setIsCreatingVersion(true);

    const draftName = useGitDraftName ? defaultBranch : versionName.trim();
    const draftDescription = useGitDraftName ? 'Latest commit to main will appear here' : '';

    //TODO: pass environmentId to the func
    createNewVersionAction(
      appId,
      draftName,
      selectedVersionForCreation.id,
      draftDescription,
      (newVersion) => {
        toast.success(isReplaceFlow ? 'Draft replaced' : 'Version Created');
        setIsCreatingVersion(false);
        setShowCreateAppVersion(false);
        // Refresh development versions to update the list with the new draft
        fetchDevelopmentVersions(appId);
        refreshVersions(appId, selectedEnvironment?.id);
        // Use changeEditorVersionAction to properly switch to the new draft version
        // This will update selectedVersion with all fields including status
        changeEditorVersionAction(
          appId,
          newVersion.id,
          () => {},
          (error) => {
            console.error('Error switching to new draft version:', error);
            toast.error('Draft created but failed to switch to it');
          },
          null // Don't pass env - use the draft's own currentEnvironmentId (development)
        );
      },
      (error) => {
        if (error?.data?.code === '23505') {
          toast.error('Version name already exists.');
        } else {
          toast.error(error?.message || error?.error || 'Error while creating version. Please try again.');
        }
        setIsCreatingVersion(false);
      },
      'version',
      isReplaceFlow
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
      dialogClassName="create-draft-version-dialog"
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
            {!useGitDraftName && (
              <div className="col mt-3 mb-3">
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
            )}
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
              cls={`create-draft-version-alert ${useGitDraftName ? 'git-sync-enabled' : 'git-sync-disabled'}`}
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
                  {isReplaceFlow
                    ? `This app uses git, which keeps a single draft tied to the ${defaultBranch} branch at all times. Creating a new draft will replace your current one.`
                    : 'Draft version can only be created from saved versions.'}{' '}
                </div>
              </div>
            </Alert>
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
                {isReplaceFlow ? 'Keep current draft' : t('globals.cancel', 'Cancel')}
              </ButtonSolid>
              <ButtonSolid
                size="lg"
                variant="primary"
                className=""
                type="submit"
                disabled={!selectedVersionForCreation || isCreatingVersion}
                data-cy="create-draft-version-create-button"
              >
                {isReplaceFlow
                  ? 'Replace with new draft'
                  : t('editor.appVersionManager.createVersion', 'Create Version')}
              </ButtonSolid>
            </div>
          </div>
        </form>
      )}
    </AlertDialog>
  );
};

export default CreateDraftVersionModal;
