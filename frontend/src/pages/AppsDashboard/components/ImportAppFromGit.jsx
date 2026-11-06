import React, { useState } from 'react';

import { cn } from '@/lib/utils';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';

import Select from '@/_ui/Select';
import ModalBase from '@/_ui/Modal';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export default function ImportAppFromGit({ open, handleClose }) {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const [selectedAppRepo, setSelectedAppRepo] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);

  const handleImportGitApp = () => null;
  const handleSelectApp = (app) => setSelectedAppRepo(app);
  const handleSelectVersion = (version) => setSelectedVersion(version);

  const renderVersionOption = (option) => {
    return (
      <div className="version-option-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="version-option-name">{option.label}</span>
      </div>
    );
  };

  const appOptions = [];
  const versionOptions = [];
  const isImportingApp = false;
  const isFetchingAppsFromRepos = false;
  const isFetchingLatestCommitData = false;
  const importingGitAppOperations = false;

  return (
    <ModalBase
      title="Import app from git repository"
      show={open}
      handleClose={handleClose}
      handleConfirm={handleImportGitApp}
      confirmBtnProps={{
        title: 'Import app',
        tooltipMessage: '',
        isLoading: isImportingApp,
        disabled: isImportingApp || !selectedAppRepo || importingGitAppOperations?.message,
      }}
      darkMode={darkMode}
    >
      {/* NEW MODAL CONTENT */}
      <>
        {/* IMPORT IN */}
        <div className="import-in-row">
          <span className="tj-text-xsm font-weight-500 tj-text">Import in </span>
          <span className="branch-name-badge">
            <SolidIcon name="gitbranch" width="14" fill="var(--indigo9)" />
            {useWorkspaceBranchesStore.getState().currentBranch?.name || 'main'}
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
              options={[
                {
                  name: useWorkspaceBranchesStore.getState().currentBranch?.name || 'main',
                  value: useWorkspaceBranchesStore.getState().currentBranch?.name || 'main',
                },
              ]}
              isDisabled={true}
              value={useWorkspaceBranchesStore.getState().currentBranch?.name || 'main'}
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
              options={appOptions}
              disabled={isImportingApp || isFetchingAppsFromRepos}
              onChange={handleSelectApp}
              width={'100%'}
              value={selectedAppRepo}
              placeholder={isFetchingAppsFromRepos ? 'Loading apps...' : 'Select app...'}
              closeMenuOnSelect={true}
              customWrap={true}
            />
          </div>
          {importingGitAppOperations?.message && (
            <div className={cn('tj-input-error', 'tj-text-xxsm info-text')} data-cy="app-name-helper-text">
              {importingGitAppOperations.message}
            </div>
          )}
        </div>

        {selectedAppRepo && (
          <>
            {isFetchingLatestCommitData ? (
              <div className="d-flex flex-column" style={{ gap: '8px', padding: '4px 0' }}>
                <div style={{ height: '12px', borderRadius: '4px', background: 'var(--slate4)', width: '40%' }} />
                <div style={{ height: '12px', borderRadius: '4px', background: 'var(--slate4)', width: '65%' }} />
                <div style={{ height: '12px', borderRadius: '4px', background: 'var(--slate4)', width: '55%' }} />
              </div>
            ) : (
              <>
                {/* VERSION SELECT — default/main branch only */}
                {(useWorkspaceBranchesStore.getState().currentBranch?.is_default ||
                  useWorkspaceBranchesStore.getState().currentBranch?.isDefault) && (
                  <div className="form-group">
                    <label className="mb-1 info-label tj-text-xsm font-weight-500" data-cy="version-select-label">
                      Version
                    </label>
                    <div className="tj-app-input" data-cy="version-select">
                      <Select
                        options={versionOptions}
                        disabled={isImportingApp}
                        onChange={handleSelectVersion}
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
  );
}
