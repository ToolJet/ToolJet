import React, { useState, useEffect } from 'react';
import { folderService } from '@/_services';
import { toast } from 'react-hot-toast';
import Modal from './Modal';

export const Folders = function Folders({
  folders,
  foldersLoading,
  currentFolder,
  folderChanged,
  foldersChanged,
  canCreateFolder,
}) {
  const [isLoading, setLoadingStatus] = useState(foldersLoading);

  useEffect(() => {
    setLoadingStatus(foldersLoading);
  }, [foldersLoading]);

  const [showForm, setShowForm] = useState(false);
  const [isCreating, setCreationStatus] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
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

  return (
    <div className="w-100 px-3 pe-lg-4 folder-list">
      {isLoading && (
        <div className="px-1 py-2" style={{ minHeight: '200px' }}>
          {[1, 2, 3, 4, 5].map((element, index) => {
            return (
              <div className="row" key={index}>
                <div className="col p-1">
                  <div className="skeleton-line w-100"></div>
                </div>
                <div className="col-2 pt-1">
                  <div className="skeleton-line w-100"></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && (
        <div data-testid="applicationFoldersList" className="list-group list-group-transparent mb-3">
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
          {folders && folders.length > 0 ? (
            folders.map((folder, index) => (
              <a
                key={index}
                className={`list-group-item list-group-item-action d-flex align-items-center ${
                  activeFolder.id === folder.id ? 'active' : ''
                }`}
                onClick={() => handleFolderChange(folder)}
              >
                <span className="me-2">
                  <img src="/assets/images/icons/folder.svg" alt="" width="14" height="14" className="folder-ico" />
                </span>
                {`${folder.name}${folder.count > 0 ? ` (${folder.count})` : ''}`}
              </a>
            ))
          ) : (
            <div className="folder-info">You haven&apos;t created any folders. Use folders to organize your apps</div>
          )}
          {}
          <Modal show={showForm} setShow={setShowForm} title="Create folder">
            <div className="row">
              <div className="col modal-main">
                <input
                  type="text"
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="form-control"
                  placeholder="folder name"
                  disabled={isCreating}
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
      )}
    </div>
  );
};
