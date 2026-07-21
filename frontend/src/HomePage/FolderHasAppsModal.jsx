import React from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import '@/_styles/folder-has-apps-modal.scss';

export function FolderHasAppsModal({ show, branches = [], onClose, darkMode, appType }) {
  const defaultBranchName = useWorkspaceBranchesStore(
    (state) => state.branches?.find((branch) => branch.is_default || branch.isDefault)?.name
  );
  const itemsLabel = appType === 'workflow' ? 'workflows' : appType === 'module' ? 'modules' : 'apps';

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('folder-has-apps-modal-overlay')) {
      onClose();
    }
  };

  const handleKeyDown = React.useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  React.useEffect(() => {
    if (!show) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, handleKeyDown]);

  if (!show) return null;

  return (
    <div className="folder-has-apps-modal-overlay" onClick={handleOverlayClick}>
      <div className={`folder-has-apps-modal${darkMode ? ' dark-theme' : ''}`} data-cy="folder-has-apps-modal">
        <SolidIcon name="warning" width="32" fill="#DB4324" className="folder-has-apps-modal-icon" />

        <div className="folder-has-apps-modal-body">
          <h3 className="folder-has-apps-modal-title" data-cy="folder-has-apps-modal-title">
            Folder with {itemsLabel} cannot be deleted
          </h3>

          <p className="folder-has-apps-modal-intro-text">
            This folder contains {itemsLabel} on the following branches:
          </p>
          <ol>
            {branches.map((branchName) => (
              <li key={branchName}>{branchName}</li>
            ))}
          </ol>

          <p className="folder-has-apps-modal-intro-text">
            Folders are shared across all branches in this workspace, so to delete it:
          </p>
          <ul>
            <li>Remove all {itemsLabel} from this folder in each listed branch</li>
            <li>Delete the folder from any branch, it&apos;ll be removed workspace-wide</li>
          </ul>

          <p className="mb-0">
            Make sure changes are committed and merged to {defaultBranchName || 'the default branch'}. Else, the folder
            will reappear on the next pull.
          </p>
        </div>

        <div className="folder-has-apps-modal-footer">
          <ButtonSolid variant="tertiary" onClick={onClose} data-cy="folder-has-apps-understand-button">
            I understand
          </ButtonSolid>
        </div>
      </div>
    </div>
  );
}
