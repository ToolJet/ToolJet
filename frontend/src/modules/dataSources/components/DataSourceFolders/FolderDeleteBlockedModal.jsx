import React from 'react';
import Modal from '@/HomePage/Modal';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import './dataSourceFolders.scss';

// Shown when the backend refuses to delete a data-source folder because the folder still holds
// data sources on some branch (FoldersService.deleteFolder). Purely informational — there is no
// action to retry here, so it follows the "Dependent queries found!" info-modal pattern in
// components/List rather than a confirm dialog.
//
// Why this exists at all: a folder can be empty on the branch the user is looking at and still be
// populated on another one, so a bare "cannot be deleted" toast reads as wrong and points nowhere.
// The refusal carries the owning branch names with it; this is where they get shown.
export const FolderDeleteBlockedModal = ({ show, folderName, branches, onClose }) => {
  const owningBranches = branches ?? [];

  return (
    <Modal show={show} closeModal={onClose} title="Folder cannot be deleted" customClassName="folder-delete-blocked">
      <div className="folder-delete-blocked-body">
        <p
          className="folder-delete-blocked-message"
          data-testid="folder-delete-blocked-message"
          data-cy="modal-message"
        >
          <b>{folderName}</b> still has data sources on the following{' '}
          {owningBranches.length === 1 ? 'branch' : 'branches'}:
        </p>
        <ul className="folder-delete-blocked-branches" data-cy="folder-delete-blocked-branch-list">
          {owningBranches.map((branch) => (
            <li key={branch} className="folder-delete-blocked-branch" data-cy="folder-delete-blocked-branch">
              {branch}
            </li>
          ))}
        </ul>
        <p className="folder-delete-blocked-hint">
          Remove them from the folder on each branch, then delete the folder.
        </p>
      </div>
      <div className="folder-delete-blocked-footer">
        <ButtonSolid onClick={onClose} data-cy="folder-delete-blocked-dismiss-button">
          Got it
        </ButtonSolid>
      </div>
    </Modal>
  );
};
