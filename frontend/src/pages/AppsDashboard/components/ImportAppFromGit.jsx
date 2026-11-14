import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { cn } from '@/lib/utils';
import { getWorkspaceId } from '@/_helpers/utils';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { useFetchGitAppUpdatesByName, useFetchRepoApps, useImportGitApp } from '@/_services/hooks/gitSyncServiceHooks';

import Select from '@/_ui/Select';
import ModalBase from '@/_ui/Modal';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { PullConflictModal } from '@/_ui/WorkspaceBranchDropdown/WorkspacePullConflictModal';

const renderVersionOption = (option) => (
  <div className="version-option-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <span className="version-option-name">{option.label}</span>
  </div>
);

export default function ImportAppFromGit({ open, handleClose }) {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const navigate = useNavigate();

  const currentBranch = useWorkspaceBranchesStore((state) => state.currentBranch);
  const orgGit = useWorkspaceBranchesStore((state) => state.orgGitConfig);

  const currentBranchName = currentBranch?.name || 'main';
  const isDefaultBranch = currentBranch?.is_default || currentBranch?.isDefault;

  const [selectedAppRepo, setSelectedAppRepo] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [importError, setImportError] = useState(null);
  // Conflicts returned by a 409 hand the user over to the conflict modal instead of the inline error.
  const [conflicts, setConflicts] = useState(null);

  const { mutate: importGitApp, isLoading: isImportingApp } = useImportGitApp();

  const {
    data: appsFromRepos,
    isFetching: isFetchingAppsFromRepos,
    error: fetchAppsError,
  } = useFetchRepoApps({ branch: currentBranch?.name, branchId: currentBranch?.id });

  const appToImport = selectedAppRepo ? appsFromRepos?.reposObj?.[selectedAppRepo] : null;

  const { data: gitAppUpdates, isFetching: isFetchingGitAppUpdates } = useFetchGitAppUpdatesByName({
    appName: appToImport?.git_app_name,
    branchName: currentBranch?.name,
  });

  useEffect(() => {
    if (fetchAppsError) toast.error(fetchAppsError?.error);
  }, [fetchAppsError]);

  const handleSelectApp = (gitAppId) => {
    setSelectedAppRepo(gitAppId);
    setSelectedVersion('latest');
    setImportError(null);
  };

  const handleImportGitApp = () => {
    const {
      git_app_name,
      git_version_id,
      git_version_name,
      last_commit_message,
      last_commit_user,
      lastpush_date,
      app_co_relation_id,
    } = appToImport;

    let commitHash = null;
    let commitMessage = last_commit_message;
    let commitUser = last_commit_user;
    let commitDate = lastpush_date;
    let gitVersionNameToUse = git_version_name;

    // A tag (anything but "latest") overrides the commit info with the tag's own.
    if (selectedVersion && selectedVersion !== 'latest') {
      const selectedTag = gitAppUpdates?.tags?.find((tag) => tag.name === selectedVersion);

      if (selectedTag) {
        commitHash = selectedTag.commit?.sha;
        commitMessage = selectedTag.message;
        commitUser = selectedTag.tagger?.name;
        commitDate = selectedTag.tagger?.date;
        gitVersionNameToUse = selectedTag.name.split('/').pop();
      }
    }

    const workspaceBranchId = useWorkspaceBranchesStore.getState().activeBranchId;

    const body = {
      gitAppId: selectedAppRepo,
      gitAppName: git_app_name,
      gitVersionName: gitVersionNameToUse,
      gitVersionId: git_version_id,
      organizationGitId: orgGit?.id,
      appName: git_app_name?.trim().replace(/\s+/g, ' '),
      // Imported apps are non-editable by default; editability is driven by git branch/sync state.
      allowEditing: false,
      ...(currentBranch?.name && { gitBranchName: currentBranch.name }),
      ...(workspaceBranchId && { workspaceBranchId }),
      ...(commitHash && { commitHash, appCoRelationId: app_co_relation_id }),
      ...(commitMessage && { lastCommitMessage: commitMessage }),
      ...(commitUser && { lastCommitUser: commitUser }),
      ...(commitDate && { lastPushDate: new Date(commitDate) }),
    };

    importGitApp(body, {
      onSuccess: (response) => {
        toast.success(`${git_app_name} and its dependent resources have been imported successfully!`);
        navigate(`/${getWorkspaceId()}/apps/${response.app.id}`);
      },
      onError: (error) => {
        if (error?.statusCode === 409) {
          try {
            const parsed = JSON.parse(error?.data?.message || error?.error || '{}');

            if (parsed?.conflictGroups?.length || parsed?.multiDraftResources?.length) {
              setConflicts({
                conflictGroups: parsed.conflictGroups || [],
                multiDraftResources: parsed.multiDraftResources || [],
              });
              return;
            }
          } catch {
            /* fall through to inline error */
          }
        }

        setImportError(error?.error);
      },
    });
  };

  const handleResolveImportConflicts = async (resolutions) => {
    try {
      const { actions } = useWorkspaceBranchesStore.getState();

      await actions.resolveConflicts(resolutions);
      setConflicts(null);
      // resolveConflicts hydrates the affected apps server-side, but the in-memory app list doesn't know that,
      // so reload. A toast fired now would be destroyed by the reload; App.jsx shows it once the fresh page mounts.
      sessionStorage.setItem('sync_success_toast', 'Resource(s) synced successfully!');
      window.location.reload();
    } catch (error) {
      toast.error(error?.error || error?.message || 'Failed to resolve conflicts');
    }
  };

  const handleCloseConflictModal = () => {
    setConflicts(null);
    handleClose();
  };

  return (
    <>
      <ModalBase
        title="Import app from git repository"
        show={open && !conflicts}
        handleClose={handleClose}
        handleConfirm={handleImportGitApp}
        confirmBtnProps={{
          title: 'Import app',
          tooltipMessage: '',
          isLoading: isImportingApp,
          disabled: isImportingApp || !selectedAppRepo || !!importError,
        }}
        darkMode={darkMode}
      >
        <>
          {/* IMPORT IN */}
          <div className="import-in-row">
            <span className="tj-text-xsm font-weight-500 tj-text">Import in </span>
            <span className="branch-name-badge">
              <SolidIcon name="gitbranch" width="14" fill="var(--indigo9)" />
              {currentBranchName}
            </span>
          </div>

          {/* IMPORT FROM — locked to current branch */}
          <div className="form-group">
            <label
              className="mb-1 tj-text-xsm font-weight-500"
              style={{ color: 'var(--slate8)' }}
              data-cy="import-from-label"
            >
              Import from
            </label>
            <div className="tj-app-input import-from-disabled-select" data-cy="import-from-select">
              <Select
                options={[{ name: currentBranchName, value: currentBranchName }]}
                isDisabled={true}
                value={currentBranchName}
                width={'100%'}
                closeMenuOnSelect={true}
                customWrap={true}
              />
            </div>
            <div className="tj-text-xxsm import-from-helper-text" data-cy="import-from-helper">
              Apps can only be imported from the same branch
            </div>
          </div>

          {/* APP SELECT */}
          <div className="form-group">
            <label className="mb-1 tj-text-sm tj-text font-weight-500" data-cy="create-app-from-label">
              App
            </label>
            <div className="tj-app-input" data-cy="app-select">
              <Select
                options={appsFromRepos?.reposOptionList ?? []}
                disabled={isImportingApp || isFetchingAppsFromRepos}
                onChange={handleSelectApp}
                width={'100%'}
                value={selectedAppRepo}
                placeholder={isFetchingAppsFromRepos ? 'Loading apps...' : 'Select app...'}
                closeMenuOnSelect={true}
                customWrap={true}
              />
            </div>
            {importError && (
              <div className={cn('tj-input-error', 'tj-text-xxsm info-text')} data-cy="app-name-helper-text">
                {importError}
              </div>
            )}
          </div>

          {selectedAppRepo && (
            <>
              {isFetchingGitAppUpdates ? (
                <div className="d-flex flex-column" style={{ gap: '8px', padding: '4px 0' }}>
                  <div style={{ height: '12px', borderRadius: '4px', background: 'var(--slate4)', width: '40%' }} />
                  <div style={{ height: '12px', borderRadius: '4px', background: 'var(--slate4)', width: '65%' }} />
                  <div style={{ height: '12px', borderRadius: '4px', background: 'var(--slate4)', width: '55%' }} />
                </div>
              ) : (
                <>
                  {/* VERSION SELECT — default/main branch only */}
                  {isDefaultBranch && (
                    <div className="form-group">
                      <label className="mb-1 info-label tj-text-xsm font-weight-500" data-cy="version-select-label">
                        Version
                      </label>
                      <div className="tj-app-input" data-cy="version-select">
                        <Select
                          options={gitAppUpdates?.versionOptions ?? []}
                          disabled={isImportingApp}
                          onChange={setSelectedVersion}
                          width={'100%'}
                          value={selectedVersion}
                          placeholder="Select version or tag..."
                          closeMenuOnSelect={true}
                          customWrap={true}
                          customOption={renderVersionOption}
                        />
                      </div>
                    </div>
                  )}

                  {/* INFO ALERT */}
                  <div className="import-dependent-info-alert" data-cy="import-info-alert">
                    <SolidIcon name="warning" width="16" fill="var(--indigo9)" />
                    <span>
                      This app with its <strong>dependent modules &amp; data sources</strong> will be pulled
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </>
      </ModalBase>

      <PullConflictModal
        show={!!conflicts}
        conflictGroups={conflicts?.conflictGroups ?? []}
        multiDraftResources={conflicts?.multiDraftResources ?? []}
        onClose={handleCloseConflictModal}
        onResolve={handleResolveImportConflicts}
        context="import"
      />
    </>
  );
}
