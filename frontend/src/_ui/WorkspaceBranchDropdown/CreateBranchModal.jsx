import React, { useState, useEffect, useRef } from 'react';
import AlertDialog from '@/_ui/AlertDialog';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { toast } from 'react-hot-toast';
import { Alert } from '@/_ui/Alert';
import cx from 'classnames';
import '@/_styles/create-branch-modal.scss';

const RESERVED_NAMES = ['main', 'master', 'head', 'origin'];

export function WorkspaceCreateBranchModal({ onClose, onSuccess }) {
  const [branchName, setBranchName] = useState('');
  const [autoCommit, setAutoCommit] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sourceBranchId, setSourceBranchId] = useState('');
  const dropdownRef = useRef(null);

  const { branches, activeBranchId } = useWorkspaceBranchesStore((state) => ({
    branches: state.branches,
    activeBranchId: state.activeBranchId,
  }));
  const actions = useWorkspaceBranchesStore((state) => state.actions);

  const selectedSourceBranchId = sourceBranchId || activeBranchId;
  const selectedSourceBranch = branches.find((b) => b.id === selectedSourceBranchId);

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

  // Set default source branch on mount
  useEffect(() => {
    if (branches.length > 0 && !sourceBranchId) {
      // Default to the default branch
      const defaultBranch = branches.find((b) => b.is_default || b.isDefault);
      if (defaultBranch) {
        setSourceBranchId(defaultBranch.id);
      } else if (activeBranchId) {
        setSourceBranchId(activeBranchId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches, activeBranchId]);

  const validateBranchName = (name) => {
    if (!name || name.trim().length === 0) return 'Branch name is required';
    if (/\s/.test(name)) return 'Branch name cannot contain spaces';
    if (!/^[a-zA-Z0-9_-]+$/.test(name))
      return 'Branch name can only contain letters, numbers, hyphens, and underscores';
    if (branches.some((b) => b.name?.toLowerCase() === name.toLowerCase()))
      return 'A branch with this name already exists';
    if (RESERVED_NAMES.includes(name.toLowerCase())) return 'This branch name is reserved';
    return '';
  };

  const handleBranchNameChange = (e) => {
    const newName = e.target.value;
    setBranchName(newName);
    if (validationError) setValidationError('');
  };

  const handleCreate = async () => {
    const error = validateBranchName(branchName);
    if (error) {
      setValidationError(error);
      return;
    }

    setIsCreating(true);
    try {
      const newBranch = await actions.createBranch(branchName.trim(), selectedSourceBranchId);
      // toast.success(`Branch "${branchName}" created successfully`);
      toast.success(`Branch was created successfully`);
      await actions.switchBranch(newBranch.id);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating branch:', error);
      setValidationError(error?.message || 'An unexpected error occurred');
      toast.error(error?.message || 'Failed to create branch');
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isCreating && !isDropdownOpen) {
      handleCreate();
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
        {/* Create from dropdown */}
        {/* <div className="form-group">
          <label htmlFor="create-from-select" className="form-label">
            Create from branch
          </label>
          <div className="custom-dropdown" ref={dropdownRef}>
            <button
              type="button"
              className={cx('custom-dropdown-trigger', { 'is-open': isDropdownOpen })}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={isCreating}
            >
              <div className="custom-dropdown-value">
                {selectedSourceBranch ? (
                  <>
                    <span className="version-name">{selectedSourceBranch.name}</span>
                    {(selectedSourceBranch.is_default || selectedSourceBranch.isDefault) && (
                      <span className={cx('status-badge', 'status-badge-released')}>Default</span>
                    )}
                  </>
                ) : (
                  <span className="version-name">Select branch...</span>
                )}
              </div>
              <SolidIcon name="cheverondown" width="16" />
            </button>
            {isDropdownOpen && (
              <div className="custom-dropdown-menu">
                {branches.map((branch) => {
                  const isSelected = branch.id === selectedSourceBranchId;
                  return (
                    <div
                      key={branch.id}
                      className={cx('dropdown-item', { 'is-selected': isSelected })}
                      onClick={() => {
                        setSourceBranchId(branch.id);
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
                          <span className="item-name">{branch.name}</span>
                          {(branch.is_default || branch.isDefault) && (
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
        </div> */}

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
          <div className="form-helper-text">
            {/* Branch name must be unique and contain only letters, numbers, hyphens, and underscores */}
            Branch name must be unique and max 50 characters
          </div>
        </div>
        {/* Auto-commit checkbox */}
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={autoCommit}
              onChange={(e) => setAutoCommit(e.target.checked)}
              disabled={true}
            />
            <span className="checkbox-text">
              Commit changes
              <span className="checkbox-helper">Branch will always be created in git to ensure sync with ToolJet</span>
            </span>
          </label>
        </div>
        {/* Info message */}
        <Alert placeSvgTop={true} svg="warning-icon" cls="create-branch-info">
          {/* Branch can only be created from the default branch */}
          Branch can only be created from the master
        </Alert>

        {/* Footer buttons */}
        <div className="col d-flex justify-content-end gap-2 mt-3">
          <ButtonSolid variant="tertiary" onClick={onClose} disabled={isCreating} size="md">
            Cancel
          </ButtonSolid>
          <ButtonSolid
            variant="primary"
            onClick={handleCreate}
            disabled={isCreating || !branchName.trim()}
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

// Keep backward compatibility
export { WorkspaceCreateBranchModal as CreateBranchModal };
export default WorkspaceCreateBranchModal;
