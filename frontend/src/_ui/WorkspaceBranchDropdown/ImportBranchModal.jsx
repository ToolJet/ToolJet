import React from 'react';
import ReactDOM from 'react-dom';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import '@/_styles/import-branch-modal.scss';

export function ImportBranchModal({ show, branchName, isImporting, onCancel, onConfirm }) {
  if (!show) return null;

  const darkMode = localStorage.getItem('darkMode') === 'true';

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('import-branch-modal-overlay') && !isImporting) {
      onCancel();
    }
  };

  return ReactDOM.createPortal(
    <div className="import-branch-modal-overlay" onClick={handleOverlayClick}>
      <div className={`import-branch-modal${darkMode ? ' theme-dark dark-theme' : ''}`}>
        <div className="import-branch-modal-header">
          <h3 className="import-branch-modal-title">Import branch</h3>
        </div>

        <div className="import-branch-modal-body">
          <p className="import-branch-message">
            The branch &lsquo;<strong>{branchName}</strong>&rsquo; already exists in git remote. Do you want to import
            it?
          </p>
        </div>

        <div className="import-branch-modal-footer">
          <ButtonSolid variant="tertiary" onClick={onCancel} disabled={isImporting} size="md" data-cy="cancel-button">
            Cancel
          </ButtonSolid>
          <ButtonSolid
            variant="primary"
            onClick={onConfirm}
            disabled={isImporting}
            isLoading={isImporting}
            size="md"
            data-cy="import-branch-button"
          >
            Import branch
          </ButtonSolid>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ImportBranchModal;
