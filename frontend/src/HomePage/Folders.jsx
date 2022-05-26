import React, { useState, useEffect, useCallback } from 'react';
import { folderService } from '@/_services';
import { toast } from 'react-hot-toast';
import Modal from './Modal';
import { FolderMenu } from './FolderMenu';
import useHover from '@/_hooks/useHover';
import { ConfirmDialog } from '@/_components';

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
  const [deletingFolder, setDeletingFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [activeFolder, setActiveFolder] = useState(currentFolder || {});

  function saveFolder() {
    if (!newFolderName || !newFolderName.trim()) {
      toast.error("folder name can't be empty.", {
        position: 'top-center',
      });
      return;
    }
    setCreationStatus(true);
    folderService.create(newFolderName).then(() => {
      toast.success('folder created.', {
        position: 'top-center',
      });
      setCreationStatus(false);
      setShowForm(false);
      setNewFolderName('');
      foldersChanged();
    });
  }

  function handleFolderChange(folder) {
    setActiveFolder(folder);
    folderChanged(folder);
  }

  function deleteFolder(folder) {
    console.log(folder);
    setShowDeleteConfirmation(true);
    setDeletingFolder(folder);
  }

  function executeDeletion() {
    setDeletionStatus(true);
    folderService
      .deleteFolder(deletingFolder.id)
      .then(() => {
        toast.success('folder has been deleted.', {
          position: 'top-center',
        });
        setShowDeleteConfirmation(false);
        setDeletionStatus(false);
        foldersChanged();
      })
      .catch(() => {
        setShowDeleteConfirmation(false);
        setDeletionStatus(false);
      });
  }

  function cancelDeleteDialog() {
    setShowDeleteConfirmation(false);
    setDeletingFolder(null);
  }

  return (
    <div className="w-100 px-3 pe-lg-4 folder-list">
      <ConfirmDialog
        show={showDeleteConfirmation}
        message={`${
          deletingFolder
            ? `${
                deletingFolder.folder_apps.length > 0
                  ? `the folder ${deletingFolder.name} has ${deletingFolder.folder_apps.length} apps in it, by deleting the apps contain the folder will moved to uncategoried section.`
                  : 'Are you sure, do you want to delete this folder ?'
              } `
            : ''
        }`}
        confirmButtonLoading={isDeleting}
        onConfirm={() => executeDeletion()}
        onCancel={() => cancelDeleteDialog()}
        darkMode={darkMode}
      />

      <div
        data-testid="applicationFoldersList"
        className={`list-group list-group-transparent mb-3 ${darkMode && 'dark'}`}
      >
        <a
          className={`list-group-item list-group-item-action d-flex align-items-center all-apps-link ${
            !activeFolder.id ? 'active' : ''
          }`}
          onClick={() => handleFolderChange({})}
        >
          All applications
        </a>
        <hr></hr>
        <div className="d-flex justify-content-between mb-3">
          <div className="folder-info">Folders</div>
          {canCreateFolder && (
            <div className="folder-create-btn" onClick={() => setShowForm(true)}>
              + Create new folder
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
                className={`list-group-item list-group-item-action d-flex align-items-center ${
                  activeFolder.id === folder.id ? 'active' : ''
                } ${darkMode && 'dark'} ${focused ? ' highlight' : ''}`}
              >
                <div onClick={() => handleFolderChange(folder)} className="flex-grow-1">
                  <span className="me-2">
                    <img src="/assets/images/icons/folder.svg" alt="" width="14" height="14" className="folder-ico" />
                  </span>
                  {`${folder.name}${folder.count > 0 ? ` (${folder.count})` : ''}`}
                </div>
                <div className="pt-1">
                  {(canDeleteFolder || canUpdateFolder) && (
                    <FolderMenu
                      onMenuOpen={onMenuToggle}
                      canDeleteFolder={canDeleteFolder}
                      canUpdateFolder={canUpdateFolder}
                      deleteFolder={() => deleteFolder(folder)}
                      isMenuOpen={isMenuOpen}
                      darkMode={darkMode}
                      currentFolder={currentFolder}
                    />
                  )}
                </div>
              </a>
            ))
          : !isLoading && (
              <div className="folder-info">You haven&apos;t created any folders. Use folders to organize your apps</div>
            )}

        <Modal show={showForm} closeModal={() => setShowForm(false)} title="Create folder">
          <div className="row">
            <div className="col modal-main">
              <input
                type="text"
                onChange={(e) => setNewFolderName(e.target.value)}
                className="form-control"
                placeholder="folder name"
                disabled={isCreating}
                maxLength={25}
              />
            </div>
          </div>
          <div className="row">
            <div className="col d-flex modal-footer-btn">
              <button className="btn btn-light" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button className={`btn btn-primary ${isCreating ? 'btn-loading' : ''}`} onClick={saveFolder}>
                Create folder
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};
