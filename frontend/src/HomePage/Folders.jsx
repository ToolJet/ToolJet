import React, { useState, useEffect, useCallback } from 'react';
import cx from 'classnames';
import { folderService } from '@/_services';
import { toast } from 'react-hot-toast';
import Modal from './Modal';
import { FolderMenu } from './FolderMenu';
import useHover from '@/_hooks/useHover';
import { ConfirmDialog } from '@/_components';
import { Fade } from '@/_ui/Fade';
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
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [hoverRef, isHovered] = useHover();
  const [focused, setFocused] = useState(false);
  const { t } = useTranslation();
  const onMenuToggle = useCallback(
    (status) => {
      setMenuOpen(!!status);
      !status && !isHovered && setFocused(false);
    },
    [isHovered]
  );

  useEffect(() => {
    !isMenuOpen && setFocused(!!isHovered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovered]);

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
      folderService.create(newFolderName).then(() => {
        toast.success('Folder created.', {
          position: 'top-center',
        });
        setCreationStatus(false);
        setShowForm(false);
        setNewFolderName('');
        foldersChanged();
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
        toast.success('Folder has been deleted.', {
          position: 'top-center',
        });
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
      toast.error('Folder name cannot be empty.', {
        position: 'top-center',
      });
      return false;
    } else if (newFolderName?.trim().length > 25) {
      toast.error('Folder name cannot be longer than 25 characters.', {
        position: 'top-center',
      });
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
          toast.success('Folder has been updated.', {
            position: 'top-center',
          });
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
      <div data-testid="applicationFoldersList" className={cx(`list-group p-4 mb-3`, { dark: darkMode })}>
        <a
          className={cx(`list-group-item list-group-item-action d-flex align-items-center all-apps-link`, {
            'color-black': !darkMode,
            'bg-light-indigo': !activeFolder.id && !darkMode,
            'bg-dark-indigo': !activeFolder.id && darkMode,
          })}
          onClick={() => handleFolderChange({})}
          data-cy="all-applications-link"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M4 3.33333C3.63181 3.33333 3.33333 3.63181 3.33333 4V5.33333C3.33333 5.70152 3.63181 6 4 6H12C12.3682 6 12.6667 5.70152 12.6667 5.33333V4C12.6667 3.63181 12.3682 3.33333 12 3.33333H4ZM2 4C2 2.89543 2.89543 2 4 2H12C13.1046 2 14 2.89543 14 4V5.33333C14 6.4379 13.1046 7.33333 12 7.33333H4C2.89543 7.33333 2 6.4379 2 5.33333V4ZM4 10C3.63181 10 3.33333 10.2985 3.33333 10.6667V12C3.33333 12.3682 3.63181 12.6667 4 12.6667H12C12.3682 12.6667 12.6667 12.3682 12.6667 12V10.6667C12.6667 10.2985 12.3682 10 12 10H4ZM2 10.6667C2 9.5621 2.89543 8.66667 4 8.66667H12C13.1046 8.66667 14 9.5621 14 10.6667V12C14 13.1046 13.1046 14 12 14H4C2.89543 14 2 13.1046 2 12V10.6667Z"
              fill="#C1C8CD"
            />
          </svg>
          &nbsp;&nbsp;{t('homePage.foldersSection.allApplications', 'All apps')}
        </a>
      </div>
      <hr></hr>
      <div className="w-100 p-4 pe-lg-4 folder-list">
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

        <div className="d-flex justify-content-between mb-3">
          <div className="folder-info" data-cy="folder-info">
            {t('homePage.foldersSection.folders', 'Folders')}
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
              {t('homePage.foldersSection.createNewFolder', '+ Create new folder')}
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
                ref={hoverRef}
                className={cx(`list-group-item list-group-item-action no-border d-flex align-items-center`, {
                  dark: darkMode,
                  highlight: focused,
                  'bg-light-indigo': activeFolder.id === folder.id && !darkMode,
                  'bg-dark-indigo': activeFolder.id === folder.id && darkMode,
                })}
                data-cy={`${folder.name.toLowerCase().replace(/\s+/g, '-')}-list-card`}
              >
                <div
                  onClick={() => handleFolderChange(folder)}
                  className="flex-grow-1"
                  data-cy={`${folder.name.toLowerCase().replace(/\s+/g, '-')}-name`}
                >
                  {`${folder.name}${folder.count > 0 ? ` (${folder.count})` : ''}`}
                </div>
                <Fade visible={true} className="pt-1">
                  {(canDeleteFolder || canUpdateFolder) && (
                    <FolderMenu
                      onMenuOpen={onMenuToggle}
                      canDeleteFolder={canDeleteFolder}
                      canUpdateFolder={canUpdateFolder}
                      deleteFolder={() => deleteFolder(folder)}
                      editFolder={() => updateFolder(folder)}
                      darkMode={darkMode}
                    />
                  )}
                </Fade>
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
