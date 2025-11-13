import React, { useState, useEffect, useRef } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { useVersionManagerStore } from '@/_stores/versionManagerStore';
import { toast } from 'react-hot-toast';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { DraftVersionWarningModal } from './DraftVersionWarningModal';
import { Alert } from '@/_ui/Alert';
import AlertDialog from '@/_ui/AlertDialog';
import cx from 'classnames';
import '@/_styles/create-branch-modal.scss';

export function CreateBranchModal({ onClose, onSuccess, appId, organizationId }) {
  const [branchName, setBranchName] = useState('');
  const [createFrom, setCreateFrom] = useState('');
  const [autoCommit, setAutoCommit] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [showDraftWarning, setShowDraftWarning] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const {
    allBranches,
    isDraftVersionActive,
    createBranch,
    switchBranch,
    fetchBranches,
    lazyLoadAppVersions,
    fetchDevelopmentVersions,
    editingVersion,
    currentBranch,
  } = useStore((state) => ({
    allBranches: state.allBranches || [],
    isDraftVersionActive: state.isDraftVersionActive,
    createBranch: state.createBranch,
    switchBranch: state.switchBranch,
    fetchBranches: state.fetchBranches,
    lazyLoadAppVersions: state.lazyLoadAppVersions,
    fetchDevelopmentVersions: state.fetchDevelopmentVersions,
    editingVersion: state.editingVersion,
    currentBranch: state.currentBranch,
  }));

  // Get versions from versionManagerStore
  const { versions, fetchVersions } = useVersionManagerStore((state) => ({
    versions: state.versions || [],
    fetchVersions: state.fetchVersions,
  }));

  // Load versions when modal opens
  useEffect(() => {
    if (appId && versions.length === 0) {
      fetchVersions(appId);
    }
  }, [appId, fetchVersions, versions.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get status badge for version
  const getVersionStatusBadge = (version) => {
    const status = version.status || '';
    const isReleased = version.isReleased || version.is_released;

    if (status === 'DRAFT') {
      return { label: 'Draft', className: 'status-badge-draft' };
    } else if (isReleased || status === 'RELEASED') {
      return { label: 'Released', className: 'status-badge-released' };
    } else if (status === 'PUBLISHED') {
      return { label: 'Published', className: 'status-badge-published' };
    }
    return null;
  };

  // Get parent version name for "Created from" text
  const getCreatedFromText = (version) => {
    if (version.parentVersionId) {
      // Look up the parent version to get its name
      const parentVersion = versions.find((v) => v.id === version.parentVersionId);
      const parentName = parentVersion?.name || `v${version.parentVersionId}`;
      return `Created from ${parentName}`;
    }
    return version.description || '';
  };

  const selectedVersion = versions.find((v) => v.id === createFrom);
  const selectedBadge = selectedVersion ? getVersionStatusBadge(selectedVersion) : null;

  const validateBranchName = (name) => {
    if (!name || name.trim().length === 0) {
      return 'Branch name is required';
    }

    // No spaces allowed
    if (/\s/.test(name)) {
      return 'Branch name cannot contain spaces';
    }

    // Only alphanumeric, hyphens, and underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      return 'Branch name can only contain letters, numbers, hyphens, and underscores';
    }

    // Check for uniqueness
    const existingBranch = allBranches.find((b) => b.name?.toLowerCase() === name.toLowerCase());
    if (existingBranch) {
      return 'A branch with this name already exists';
    }

    // Reserved names
    const reservedNames = ['main', 'master', 'head', 'origin'];
    if (reservedNames.includes(name.toLowerCase())) {
      return 'This branch name is reserved';
    }

    return '';
  };

  const handleBranchNameChange = (e) => {
    const newName = e.target.value;
    setBranchName(newName);

    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('');
    }
  };

  const handleCreateBranch = async () => {
    // Validate branch name
    const error = validateBranchName(branchName);
    if (error) {
      setValidationError(error);
      return;
    }

    setIsCreating(true);

    // Determine the base branch - use current branch name or default to 'main'
    const baseBranchName = currentBranch?.name || 'main';

    const branchData = {
      branchName: branchName.trim(),
      versionFromId: createFrom,
      baseBranch: baseBranchName,
      autoCommit: autoCommit,
    };

    try {
      const result = await createBranch(appId, organizationId, branchData);

      if (result.success) {
        toast.success(`Branch "${branchName}" created successfully`);

        // Refresh branches list and versions BEFORE switching
        // This ensures the new branch version is available when we call switchBranch
        await Promise.all([
          fetchBranches(appId, organizationId),
          lazyLoadAppVersions(appId),
          // Also fetch development versions since the new branch is in Development environment
          fetchDevelopmentVersions(appId),
        ]);

        console.log('CreateBranchModal - versions refreshed, now switching to branch:', branchName.trim());

        // Switch to the newly created branch (similar to version creation)
        try {
          const switchResult = await switchBranch(appId, branchName.trim());
          console.log('CreateBranchModal - switchBranch result:', switchResult);
          toast.success(`Switched to branch "${branchName}"`);
        } catch (switchError) {
          console.error('Error switching to new branch:', switchError);
          toast.error('Branch created but failed to switch to it');
        }

        onSuccess?.(result.data);
        onClose();
      } else {
        // Handle specific errors
        if (result.error === 'DRAFT_EXISTS') {
          setShowDraftWarning(true);
        } else {
          setValidationError(result.error || 'Failed to create branch');
          toast.error(result.error || 'Failed to create branch');
        }
      }
    } catch (error) {
      console.error('Error creating branch:', error);
      setValidationError('An unexpected error occurred');
      toast.error('Failed to create branch');
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isCreating && !isDropdownOpen) {
      handleCreateBranch();
    } else if (e.key === 'Escape' && isDropdownOpen) {
      setIsDropdownOpen(false);
    }
  };

  // Set default "Create from" on mount
  useEffect(() => {
    if (versions.length > 0 && !createFrom) {
      if (editingVersion?.id) {
        setCreateFrom(editingVersion.id);
      } else {
        setCreateFrom(versions[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versions]);

  return (
    <>
      <AlertDialog
        show={true}
        closeModal={onClose}
        title="Create branch"
        checkForBackground={true}
        customClassName="create-branch-modal"
      >
        <div className="create-branch-modal-body">
          {/* Draft warning message */}
          {isDraftVersionActive && (
            <div className="draft-warning-message">
              <SolidIcon name="information" width="16" />
              <span>A draft version exists. Commit or discard it before creating a new branch.</span>
            </div>
          )}

          {/* Create from dropdown */}
          <div className="form-group">
            <label htmlFor="create-from-select" className="form-label">
              Create from version
            </label>
            <div className="custom-dropdown" ref={dropdownRef}>
              <button
                type="button"
                className={cx('custom-dropdown-trigger', { 'is-open': isDropdownOpen })}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={isCreating}
              >
                <div className="custom-dropdown-value">
                  {selectedVersion ? (
                    <>
                      <span className="version-name">{selectedVersion.name}</span>
                      {selectedBadge && (
                        <span className={cx('status-badge', selectedBadge.className)}>{selectedBadge.label}</span>
                      )}
                    </>
                  ) : (
                    <span className="version-name">Select version...</span>
                  )}
                </div>
                <SolidIcon name="cheverondown" width="16" />
              </button>
              {isDropdownOpen && (
                <div className="custom-dropdown-menu">
                  {versions.map((version) => {
                    const badge = getVersionStatusBadge(version);
                    const createdFrom = getCreatedFromText(version);
                    const isSelected = version.id === createFrom;

                    return (
                      <div
                        key={version.id}
                        className={cx('dropdown-item', { 'is-selected': isSelected })}
                        onClick={() => {
                          setCreateFrom(version.id);
                          setIsDropdownOpen(false);
                        }}
                      >
                        {isSelected && (
                          <div className="check-icon">
                            <SolidIcon name="tick" width="16" />
                          </div>
                        )}
                        {!isSelected && <div className="check-icon-placeholder" />}
                        <div className="item-content">
                          <div className="item-header">
                            <span className="item-name">{version.name}</span>
                            {badge && <span className={cx('status-badge', badge.className)}>{badge.label}</span>}
                          </div>
                          {createdFrom && <div className="item-description">{createdFrom}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Branch name input */}
          <div className="form-group">
            <label htmlFor="branch-name-input" className="form-label">
              Branch name
            </label>
            <input
              id="branch-name-input"
              type="text"
              className={`branch-modal-form-input ${validationError ? 'form-input-error' : ''}`}
              placeholder="Enter version name"
              value={branchName}
              onChange={handleBranchNameChange}
              onKeyDown={handleKeyDown}
              disabled={isCreating}
              autoFocus
            />
            {validationError && <div className="form-error-message">{validationError}</div>}
            <div className="form-helper-text">Version name must be unique and max 50 characters</div>
          </div>

          {/* Auto-commit checkbox */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={autoCommit}
                onChange={(e) => setAutoCommit(e.target.checked)}
                disabled={isCreating}
              />
              <span className="checkbox-text">
                Commit changes
                <span className="checkbox-helper">
                  Branch will always be created in git to ensure sync with ToolJet
                </span>
              </span>
            </label>
          </div>

          {/* Info message about branch creation */}
          <Alert placeSvgTop={true} svg="info-icon" className="create-branch-info">
            Branch can only be created from master
          </Alert>

          {/* Footer buttons */}
          <div className="col d-flex justify-content-end gap-2 mt-3">
            <ButtonSolid variant="tertiary" onClick={onClose} disabled={isCreating} size="md">
              Cancel
            </ButtonSolid>
            <ButtonSolid
              variant="primary"
              onClick={handleCreateBranch}
              disabled={isCreating || isDraftVersionActive || !branchName.trim()}
              isLoading={isCreating}
              size="md"
            >
              {isCreating ? 'Creating...' : 'Create branch'}
            </ButtonSolid>
          </div>
        </div>
      </AlertDialog>

      {/* Draft Version Warning Modal */}
      {showDraftWarning && <DraftVersionWarningModal onClose={() => setShowDraftWarning(false)} />}
    </>
  );
}
