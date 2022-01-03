import React, { useState, useEffect } from 'react';
import { folderService } from '@/_services';
import { toast } from 'react-hot-toast';

export const Folders = function Folders({
  folders,
  foldersLoading,
  totalCount,
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
        position: 'top-left',
      });
      return;
    }
    setCreationStatus(true);
    folderService.create(newFolderName).then(() => {
      toast.success('folder created.', {
        position: 'top-left',
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
    <div className="w-100 px-3 card folder-list">
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
            className={`list-group-item list-group-item-action d-flex align-items-center ${
              !activeFolder.id ? 'active' : ''
            }`}
            onClick={() => handleFolderChange({})}
          >
            All applications
            <small className="text-muted ms-auto">
              <span className="badge bg-primary-lt" data-testid="allApplicationsCount">
                {totalCount}
              </span>
            </small>
          </a>
          {folders.map((folder, index) => (
            <a
              key={index}
              className={`list-group-item list-group-item-action d-flex align-items-center ${
                activeFolder.id === folder.id ? 'active' : ''
              }`}
              onClick={() => handleFolderChange(folder)}
            >
              {folder.name}
              <small className="text-muted ms-auto">
                <span className="badge bg-primary-lt">{folder.count}</span>
              </small>
            </a>
          ))}
          <hr />
          {!showForm && canCreateFolder && (
            <a className="mx-3 fw-500" onClick={() => setShowForm(true)}>
              + Folder
            </a>
          )}
          {showForm && (
            <div className="p-2 row">
              <div className="col">
                <input
                  type="text"
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="form-control"
                  placeholder="folder name"
                  disabled={isCreating}
                />
              </div>
              <div className="col-auto">
                <button className={`btn btn-primary ${isCreating ? 'btn-loading' : ''}`} onClick={saveFolder}>
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
