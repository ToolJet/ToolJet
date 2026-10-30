import { useVersionLifecycle } from './VersionManager/VersionLifecycleContext';
import { withAppVersionLifecycle } from './VersionManager/AppVersionLifecycleProvider';
import {
  validateVersionName,
  validateVersionDescription,
  VERSION_NAME_FORBIDDEN,
} from './VersionManager/versionValidation';
import React, { useEffect, useState } from 'react';
import AlertDialog from '@/_ui/AlertDialog';
import { Alert } from '@/_ui/Alert';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Warning from '@/_ui/Icon/solidIcons/Warning';
import '../../_styles/version-modal.scss';

const CreateVersionModal = ({
  showCreateAppVersion,
  setShowCreateAppVersion,
  fetchingOrgGit,
  versionId,
  onVersionCreated,
  getSuccessMessage,
}) => {
  const { resourceType, versions, selectedVersionId, capabilities = {}, actions } = useVersionLifecycle();
  const developmentVersions = React.useMemo(
    () =>
      capabilities.developmentVersionIds
        ? versions.filter((v) => capabilities.developmentVersionIds.includes(v.id))
        : versions,
    [versions, capabilities.developmentVersionIds]
  );
  const selectedVersion = developmentVersions.find((v) => v.id === selectedVersionId);
  const isEditorReadOnly = capabilities.readOnly;
  const isGitSyncEnabled = capabilities.git?.enabled;
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [versionDescription, setVersionDescription] = useState('');
  fetchingOrgGit = fetchingOrgGit ?? capabilities.git?.fetchingOrgGit;

  const [selectedVersionForCreation, setSelectedVersionForCreation] = useState(null);
  const textareaRef = React.useRef(null);

  const handleDescriptionInput = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const lineHeight = 24;
    const maxLines = 4;
    const maxHeight = lineHeight * maxLines;
    textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  const initializedVersionId = React.useRef(null);
  // A background refresh may replace every row object while the user types. Initialize
  // once per opening/target, so refreshed metadata cannot overwrite the form.
  useEffect(() => {
    if (!showCreateAppVersion) {
      initializedVersionId.current = null;
      return;
    }
    const targetId = versionId || selectedVersion?.id || developmentVersions[0]?.id;
    const target = developmentVersions.find((version) => version.id === targetId);
    if (!target || initializedVersionId.current === target.id) return;
    initializedVersionId.current = target.id;
    selectVersionForCreation(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [developmentVersions, versionId, selectedVersion?.id, showCreateAppVersion]);

  const selectVersionForCreation = (version) => {
    setSelectedVersionForCreation(version);
    // New git-sync drafts get a throwaway uuid() name (see createVersion in
    // versions/util.service.ts) — the user names it here, so that placeholder shouldn't be
    // pre-filled. A draft that predates git sync, or otherwise already carries a real name,
    // should still be auto-filled instead of blanked just because git sync happens to be on.
    const isUuidPlaceholderName = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      version.name || ''
    );
    setVersionName(isUuidPlaceholderName ? '' : version.name);
    setVersionDescription(isUuidPlaceholderName ? '' : version.description || '');
  };

  const { t } = useTranslation();

  const createVersion = async () => {
    if (isEditorReadOnly) {
      toast.error('You do not have permission to save this version');
      return;
    }
    const nameError = validateVersionName(versionName.trim());
    const descriptionError = validateVersionDescription(versionDescription.trim());
    if (nameError || descriptionError) {
      const message =
        nameError === VERSION_NAME_FORBIDDEN
          ? 'Version name cannot contain spaces or special characters (`~ ^ : ? * [ \\ @ {`). Please remove them and try again.'
          : nameError === 'Version name cannot exceed 25 characters'
            ? 'Version name should not be longer than 25 characters'
            : descriptionError
              ? 'Version description should not be longer than 500 characters'
              : nameError;
      toast.error(message);
      return;
    }
    if (!selectedVersionForCreation) {
      toast.error('Please wait while versions are loading...');
      return;
    }

    setIsCreatingVersion(true);

    try {
      await actions.saveDraft(selectedVersionForCreation.id, { name: versionName, description: versionDescription });

      toast.success(getSuccessMessage ? getSuccessMessage(versionName.trim()) : 'Version Created successfully');
      setVersionName('');
      setVersionDescription('');
      setSelectedVersionForCreation(null);
      setIsCreatingVersion(false);
      setShowCreateAppVersion(false);

      // Fetch versions after creation
      if (onVersionCreated) {
        onVersionCreated();
      }
    } catch (error) {
      if (error?.data?.code === '23505') {
        toast.error('Version name already exists.');
      } else {
        const rawError = error?.error || error?.message;
        const errorMessage =
          typeof rawError === 'object' ? rawError.error : rawError || 'Error while creating version. Please try again.';
        const errorDetails = typeof rawError === 'object' ? rawError.details : errorMessage;
        toast.error(errorMessage);
        actions.reportError?.('Save Failed', errorMessage, errorDetails);
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
            {(isGitSyncEnabled || ['module', 'query-library'].includes(resourceType)) && (
              <div
                className="mb-3 d-flex align-items-start"
                style={{
                  backgroundColor: 'var(--background-warning-weak)',
                  borderRadius: '6px',
                  padding: '12px',
                  gap: '6px',
                }}
                data-cy="version-immutability-info"
              >
                <span style={{ flexShrink: 0, display: 'inline-flex', marginTop: '1px' }}>
                  <Warning fill="var(--text-warning)" width="18" />
                </span>
                <span
                  className="tj-text-xsm"
                  style={{ color: 'var(--text-medium)', lineHeight: '18px', fontSize: '12px' }}
                >
                  Name and description cannot be edited after saving
                </span>
              </div>
            )}
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
                {t(
                  'editor.appVersionManager.versionNameHelper',
                  'Version name cannot contain spaces, special characters or exceed 25 characters'
                )}
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
                autoFocus={!isGitSyncEnabled}
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

            {/* Disabling autoCommit */}
            {/* {(isGitSyncEnabled || ['module', 'query-library'].includes(resourceType)) && (
              <div className="commit-changes mt-3">
                <div>
                  <input
                    className="form-check-input"
                    checked={canCommit}
                    type="checkbox"
                    onChange={handleCommitEnableChange}
                    disabled={isBranchingEnabled}
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
            )} */}

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
                disabled={!selectedVersionForCreation || isCreatingVersion || isEditorReadOnly}
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

export default withAppVersionLifecycle(CreateVersionModal, { loadDevelopment: true });
