import React, { useState, useEffect, useRef } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { workspaceBranchesService } from '@/_services/workspace_branches.service';
import { gitSyncService } from '@/_services';
import { toast } from 'react-hot-toast';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { Alert } from '@/_ui/Alert';
import AlertDialog from '@/_ui/AlertDialog';
import cx from 'classnames';
import '@/_styles/create-branch-modal.scss';

export function CreateBranchModal({ onClose, onSuccess, appId, organizationId }) {
  const [branchName, setBranchName] = useState('');
  const orgGitConfig = useWorkspaceBranchesStore((state) => state.orgGitConfig);
  const defaultGitBranch = orgGitConfig?.default_git_branch || orgGitConfig?.defaultGitBranch || 'main';
  const LATEST_MAIN_OPTION = { label: `Latest (${defaultGitBranch})`, commitSha: null };
  const [selectedOption, setSelectedOption] = useState(LATEST_MAIN_OPTION);
  const [isCreating, setIsCreating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tags, setTags] = useState([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const dropdownRef = useRef(null);

  const { allBranches, isDraftVersionActive } = useStore((state) => ({
    allBranches: state.allBranches || [],
    isDraftVersionActive: state.isDraftVersionActive,
  }));

  const workspaceActions = useWorkspaceBranchesStore((state) => state.actions);
  const workspaceBranches = useWorkspaceBranchesStore((state) => state.branches);

  // Fetch app-specific tags using existing checkForUpdates API
  useEffect(() => {
    if (!appId) {
      setIsLoadingTags(false);
      return;
    }
    setIsLoadingTags(true);
    gitSyncService
      .checkForUpdates(appId)
      .then((data) => {
        const appTags = data?.meta_data?.tags || [];
        setTags(
          appTags.map((tag) => {
            const [, version] = tag.name.split('/');
            return {
              label: version || tag.name,
              commitSha: tag.commit?.sha,
            };
          })
        );
      })
      .catch((err) => {
        console.error('Failed to fetch tags:', err);
        setTags([]);
      })
      .finally(() => setIsLoadingTags(false));
  }, [appId]);

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

  const dropdownOptions = [LATEST_MAIN_OPTION, ...tags];

  const validateBranchName = (name) => {
    if (!name || name.trim().length === 0) return 'Branch name is required';
    if (/\s/.test(name)) return 'Branch name cannot contain spaces';
    if (!/^[a-zA-Z0-9_-]+$/.test(name))
      return 'Branch name can only contain letters, numbers, hyphens, and underscores';

    const existsInWorkspace = workspaceBranches.some((b) => b.name?.toLowerCase() === name.toLowerCase());
    const existsInApp = allBranches.some((b) => b.name?.toLowerCase() === name.toLowerCase());
    if (existsInWorkspace || existsInApp) return 'A branch with this name already exists';

    const reservedNames = ['main', 'master', 'head', 'origin'];
    if (reservedNames.includes(name.toLowerCase())) return 'This branch name is reserved';
    return '';
  };

  const handleBranchNameChange = (e) => {
    setBranchName(e.target.value);
    if (validationError) setValidationError('');
  };

  const handleCreateBranch = async () => {
    const error = validateBranchName(branchName);
    if (error) {
      setValidationError(error);
      return;
    }

    setIsCreating(true);
    try {
      // Find the default (main) branch ID to use as source
      const defaultBranch = workspaceBranches.find((b) => b.is_default || b.isDefault);
      const sourceBranchId = defaultBranch?.id || null;

      const newBranch = await workspaceActions.createBranch(
        branchName.trim(),
        sourceBranchId,
        selectedOption.commitSha || undefined
      );

      toast.success('Branch was created successfully');

      // Switch to the new branch using the backend API to get resolvedAppId
      const switchResult = await workspaceBranchesService.switchBranch(newBranch.id, appId);
      workspaceActions.switchBranch(newBranch.id);

      onClose();

      // Navigate based on whether app exists on the new branch
      const pathParts = window.location.pathname.split('/');
      const resolvedAppId = switchResult?.resolvedAppId;
      if (resolvedAppId) {
        window.location.href = `/${pathParts[1]}/apps/${resolvedAppId}`;
      } else {
        sessionStorage.setItem('git_sync_toast', 'This app does not exist for this branch on ToolJet');
        window.location.href = `/${pathParts[1]}`;
      }
    } catch (error) {
      console.error('Error creating branch:', error);
      const msg = error?.data?.message || error?.message || 'Failed to create branch';
      setValidationError(msg);
      toast.error(msg);
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

  return (
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

        {/* Create from dropdown — shows "Latest (main)" + app-specific git tags */}
        <div className="form-group">
          <label htmlFor="create-from-select" className="form-label">
            Create from
          </label>
          <div className="custom-dropdown" ref={dropdownRef}>
            <button
              type="button"
              className={cx('custom-dropdown-trigger', { 'is-open': isDropdownOpen })}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={isCreating || isLoadingTags}
            >
              <div className="custom-dropdown-value">
                <span className="version-name">{isLoadingTags ? 'Loading...' : selectedOption.label}</span>
                {!selectedOption.commitSha && !isLoadingTags && (
                  <span className={cx('status-badge', 'status-badge-released')}>Default</span>
                )}
              </div>
              <SolidIcon name="cheverondown" width="16" />
            </button>
            {isDropdownOpen && (
              <div className="custom-dropdown-menu">
                {dropdownOptions.map((option, idx) => {
                  const isSelected = option.label === selectedOption.label;
                  return (
                    <div
                      key={idx}
                      className={cx('dropdown-item', { 'is-selected': isSelected })}
                      onClick={() => {
                        setSelectedOption(option);
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
                          <span className="item-name">{option.label}</span>
                          {!option.commitSha && (
                            <span className={cx('status-badge', 'status-badge-released')}>Default</span>
                          )}
                        </div>
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
            placeholder="Enter branch name"
            value={branchName}
            onChange={handleBranchNameChange}
            onKeyDown={handleKeyDown}
            disabled={isCreating}
            autoFocus
          />
          {validationError && <div className="form-error-message">{validationError}</div>}
          <div className="form-helper-text">Branch name must be unique and max 50 characters</div>
        </div>

        {/* Auto-commit checkbox */}
        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" className="form-checkbox" checked={true} disabled={true} />
            <span className="checkbox-text">
              Commit changes
              <span className="checkbox-helper">Branch will always be created in git to ensure sync with ToolJet</span>
            </span>
          </label>
        </div>

        {/* Info message */}
        <Alert placeSvgTop={true} svg="warning-icon" cls="create-branch-info">
          Branch can only be created from {defaultGitBranch}
        </Alert>

        {/* Footer buttons */}
        <div className="col d-flex justify-content-end gap-2 mt-3">
          <ButtonSolid variant="tertiary" onClick={onClose} disabled={isCreating} size="md">
            Cancel
          </ButtonSolid>
          <ButtonSolid
            variant="primary"
            onClick={handleCreateBranch}
            disabled={isCreating || isDraftVersionActive || !branchName.trim() || isLoadingTags}
            isLoading={isCreating}
            size="md"
          >
            Create branch
          </ButtonSolid>
        </div>
      </div>
    </AlertDialog>
  );
}
