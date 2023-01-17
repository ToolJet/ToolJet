import React, { useState, useEffect } from 'react';
import cx from 'classnames';
import { folderService } from '@/_services';
import { toast } from 'react-hot-toast';
import Modal from './Modal';
import { FolderMenu } from './FolderMenu';
import { ConfirmDialog } from '@/_components';
import { useTranslation } from 'react-i18next';
import Skeleton from 'react-loading-skeleton';

export const Folders = function Folders({
  folders,
  foldersLoading,
  currentFolder,
  folderChanged,
  foldersChanged,
  canCreateFolder,
  canUpdateFolder,
  canDeleteFolder,
  darkMode,
}) {
  const [isLoading, setLoadingStatus] = useState(foldersLoading);
  const { t } = useTranslation();

  useEffect(() => {
    setLoadingStatus(foldersLoading);
  }, [foldersLoading]);

  const [showForm, setShowForm] = useState(false);
  const [isCreating, setCreationStatus] = useState(false);
  const [isDeleting, setDeletionStatus] = useState(false);
  const [isUpdating, setUpdationStatus] = useState(false);
  const [deletingFolder, setDeletingFolder] = useState(null);
  const [updatingFolder, setUpdatingFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [activeFolder, setActiveFolder] = useState(currentFolder || {});

  function saveFolder() {
    if (validateName()) {
      setCreationStatus(true);
      folderService
        .create(newFolderName)
        .then(() => {
          toast.success('Folder created.');
          setCreationStatus(false);
          setShowForm(false);
          setNewFolderName('');
          foldersChanged();
        })
        .catch(({ error }) => {
          toast.error('Error creating folder: ' + error);
          setCreationStatus(false);
          setShowForm(false);
          setNewFolderName('');
        });
    }
  }

  function handleFolderChange(folder) {
    setActiveFolder(folder);
    folderChanged(folder);
  }

  function deleteFolder(folder) {
    setShowDeleteConfirmation(true);
    setDeletingFolder(folder);
  }

  function updateFolder(folder) {
    setNewFolderName(folder.name);
    setShowUpdateForm(true);
    setUpdatingFolder(folder);
  }

  function executeDeletion() {
    setDeletionStatus(true);
    folderService
      .deleteFolder(deletingFolder.id)
      .then(() => {
        toast.success('Folder has been deleted.');
        setShowDeleteConfirmation(false);
        setDeletionStatus(false);
        foldersChanged();
      })
      .catch(({ error }) => {
        toast.error(error);
        setShowDeleteConfirmation(false);
        setDeletionStatus(false);
      });
  }

  function cancelDeleteDialog() {
    setShowDeleteConfirmation(false);
    setDeletingFolder(null);
  }

  function validateName() {
    if (!newFolderName?.trim()) {
      toast.error('Folder name cannot be empty.');
      return false;
    }

    if (newFolderName?.trim().length > 25) {
      toast.error('Folder name cannot be longer than 25 characters.');
      return false;
    }
    return true;
  }

  function executeEditFolder() {
    if (validateName()) {
      setUpdationStatus(true);
      folderService
        .updateFolder(newFolderName, updatingFolder.id)
        .then(() => {
          toast.success('Folder has been updated.');
          setUpdationStatus(false);
          setShowUpdateForm(false);
          setNewFolderName('');
          foldersChanged();
        })
        .catch(({ error }) => {
          toast.error(error);
          setNewFolderName('');
          setUpdationStatus(false);
        });
    }
  }

  return (
    <div className="w-100 p-3 folder-list">
      <ConfirmDialog
        show={showDeleteConfirmation}
        message={t(
          'homePage.foldersSection.wishToDeleteFolder',
          `Are you sure you want to delete the folder? Apps within the folder will not be deleted.`
        )}
        confirmButtonLoading={isDeleting}
        onConfirm={() => executeDeletion()}
        onCancel={() => cancelDeleteDialog()}
        darkMode={darkMode}
      />

      <div className="d-flex justify-content-between mb-2">
        <div className="folder-info text-uppercase" data-cy="folder-info">
          {t('homePage.foldersSection.folders', 'Folders')}{' '}
          {!isLoading && folders && folders.length > 0 && `(${folders.length})`}
        </div>
        {canCreateFolder && (
          <div
            className="folder-create-btn"
            onClick={() => {
              setNewFolderName('');
              setShowForm(true);
            }}
            data-cy="create-new-folder-button"
          >
            {t('homePage.foldersSection.createNewFolder', '+ Create new')}
          </div>
        )}
      </div>

      {!isLoading && (
        <div data-testid="applicationFoldersList" className={cx(`mb-1`, { dark: darkMode })}>
          <a
            className={cx(
              `list-group-item border-0 list-group-item-action d-flex align-items-center rounded-2 all-apps-link`,
              {
                'color-black': !darkMode,
                'text-white': darkMode,
                'bg-light-indigo': !activeFolder.id && !darkMode,
                'bg-dark-indigo': !activeFolder.id && darkMode,
              }
            )}
            onClick={() => handleFolderChange({})}
            data-cy="all-applications-link"
          >
            {t('homePage.foldersSection.allApplications', 'All apps')}
          </a>
        </div>
      )}
      {isLoading && <Skeleton count={3} height={22} className="mb-1" />}
      {!isLoading &&
        folders &&
        folders.length > 0 &&
        folders.map((folder, index) => (
          <a
            key={index}
            className={cx(
              `folder-list-group-item rounded-2 list-group-item h-4 mb-1 list-group-item-action no-border d-flex align-items-center`,
              {
                dark: darkMode,
                'text-white': darkMode,
                'bg-light-indigo': activeFolder.id === folder.id && !darkMode,
                'bg-dark-indigo': activeFolder.id === folder.id && darkMode,
              }
            )}
            onClick={() => handleFolderChange(folder)}
            data-cy={`${folder.name.toLowerCase().replace(/\s+/g, '-')}-list-card`}
          >
            <div className="flex-grow-1" data-cy={`${folder.name.toLowerCase().replace(/\s+/g, '-')}-name`}>
              {`${folder.name}${folder.count > 0 ? ` (${folder.count})` : ''}`}
            </div>
            {(canDeleteFolder || canUpdateFolder) && (
              <FolderMenu
                canDeleteFolder={canDeleteFolder}
                canUpdateFolder={canUpdateFolder}
                deleteFolder={() => deleteFolder(folder)}
                editFolder={() => updateFolder(folder)}
                darkMode={darkMode}
              />
            )}
          </a>
        ))}

      <Modal
        show={showForm || showUpdateForm}
        closeModal={() => (showUpdateForm ? setShowUpdateForm(false) : setShowForm(false))}
        title={
          showUpdateForm
            ? t('homePage.foldersSection.updateFolder', 'Update Folder')
            : t('homePage.foldersSection.createFolder', 'Create folder')
        }
      >
        <div className="row">
          <div className="col modal-main">
            <input
              type="text"
              onChange={(e) => setNewFolderName(e.target.value)}
              className="form-control"
              placeholder={t('homePage.foldersSection.folderName', 'folder name')}
              disabled={isCreating || isUpdating}
              value={newFolderName}
              maxLength={25}
              data-cy="folder-name-input"
              autoFocus
            />
          </div>
        </div>
        <div className="row">
          <div className="col d-flex modal-footer-btn">
            <button
              className="btn"
              onClick={() => (showUpdateForm ? setShowUpdateForm(false) : setShowForm(false))}
              data-cy="cancel-button"
            >
              {t('globals.cancel', 'Cancel')}
            </button>
            <button
              className={`btn btn-primary ${isCreating || isUpdating ? 'btn-loading' : ''}`}
              onClick={showUpdateForm ? executeEditFolder : saveFolder}
              data-cy={`${showUpdateForm ? 'update-folder' : 'create-folder'}-button`}
            >
              {showUpdateForm
                ? t('homePage.foldersSection.updateFolder', 'Update Folder')
                : t('homePage.foldersSection.createFolder', 'Create folder')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
