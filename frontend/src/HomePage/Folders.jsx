import React, { useState } from 'react';
import { folderService } from '@/_services';
import { toast } from 'react-toastify';

export const Folders = function Folders({
  
}) {

  const [isLoading, setLoadingStatus] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setCreationStatus] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  function saveFolder() {
    setCreationStatus(true);
    folderService.create(newFolderName).then(() => {
      toast.info('folder created.', {
        hideProgressBar: true,
        position: 'top-left'
      });
      setCreationStatus(false);
      setShowForm(false);
      setNewFolderName('');
    })
  }

  return (<div className="w-100 mt-4 px-3 card">
    {isLoading && (
      <div className="p-5">
        <center>
          <div class="spinner-border text-azure" role="status"></div>
        </center>
      </div>
    )}

    {!isLoading && (
      <div class="list-group list-group-transparent mb-3">

        <a class="list-group-item list-group-item-action d-flex align-items-center active" href="#">
          All applications
            <small class="text-muted ms-auto">
            {/* <span class="badge bg-azure-lt">{meta.count}</span> */}
          </small>
        </a>
        {!showForm &&
          <a class="list-group-item list-group-item-action d-flex align-items-center" onClick={() => setShowForm(true)}>
            + Folder
          </a>
        }
        {showForm && 
          <div className="p-2 row">
            <div className="col">
              <input
                onClick={() => onComponentClick(id, component)}
                type="text"
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
        }
      </div>
    )}
  </div>)
}
