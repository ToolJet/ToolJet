import React, { useState, useEffect } from 'react';
import cx from 'classnames';
import { folderService } from '@/_services';
import { toast } from 'react-hot-toast';
import Modal from './Modal';
import { FolderMenu } from './FolderMenu';
import { ConfirmDialog } from '@/_components';
import { useTranslation } from 'react-i18next';

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
    <>
      <div data-testid="applicationFoldersList" className={cx(`list-group px-4 py-3 mb-3`, { dark: darkMode })}>
        <a
          className={cx(`list-group-item p-2 border-0 list-group-item-action d-flex align-items-center all-apps-link`, {
            'color-black': !darkMode,
            'text-white': darkMode,
            'bg-light-indigo': !activeFolder.id && !darkMode,
            'bg-dark-indigo': !activeFolder.id && darkMode,
          })}
          onClick={() => handleFolderChange({})}
          data-cy="all-applications-link"
        >
          <svg
            className="icon mx-1"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3.5 2.91667C3.17783 2.91667 2.91667 3.17783 2.91667 3.5V4.66667C2.91667 4.98883 3.17783 5.25 3.5 5.25H10.5C10.8222 5.25 11.0833 4.98883 11.0833 4.66667V3.5C11.0833 3.17783 10.8222 2.91667 10.5 2.91667H3.5ZM1.75 3.5C1.75 2.5335 2.5335 1.75 3.5 1.75H10.5C11.4665 1.75 12.25 2.5335 12.25 3.5V4.66667C12.25 5.63316 11.4665 6.41667 10.5 6.41667H3.5C2.5335 6.41667 1.75 5.63316 1.75 4.66667V3.5ZM3.5 8.75C3.17783 8.75 2.91667 9.01117 2.91667 9.33333V10.5C2.91667 10.8222 3.17783 11.0833 3.5 11.0833H10.5C10.8222 11.0833 11.0833 10.8222 11.0833 10.5V9.33333C11.0833 9.01117 10.8222 8.75 10.5 8.75H3.5ZM1.75 9.33333C1.75 8.36683 2.5335 7.58333 3.5 7.58333H10.5C11.4665 7.58333 12.25 8.36683 12.25 9.33333V10.5C12.25 11.4665 11.4665 12.25 10.5 12.25H3.5C2.5335 12.25 1.75 11.4665 1.75 10.5V9.33333Z"
              fill="#C1C8CD"
            />
          </svg>
          {t('homePage.foldersSection.allApplications', 'All apps')}
        </a>
      </div>
      <hr></hr>
      <div className="w-100 px-4 py-3 folder-list">
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

        {isLoading && (
          <div className="px-1" style={{ minHeight: '200px' }}>
            {[1, 2, 3, 4, 5].map((element, index) => {
              return (
                <div className="folders-skeleton row" key={index}>
                  <div className="folder-icon-skeleton col-2 me-2"></div>
                  <div className="skeleton-line w-100 col"></div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && folders && folders.length > 0
          ? folders.map((folder, index) => (
              <a
                key={index}
                className={cx(
                  `folder-list-group-item list-group-item h-4 mb-1 list-group-item-action no-border d-flex align-items-center`,
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
            ))
          : !isLoading && (
              <div className="folder-info" data-cy="folder-info-text">
                {t(
                  'homePage.foldersSection.noFolders',
                  `You haven't created any folders. Use folders to organize your apps`
                )}
              </div>
            )}

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
              />
            </div>
          </div>
          <div className="row">
            <div className="col d-flex modal-footer-btn">
              <button
                className="btn btn-light"
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
    </>
  );
};
