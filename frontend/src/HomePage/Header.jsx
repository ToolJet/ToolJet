import React from 'react';
import { SearchBox } from '@/_components/SearchBox';

export default function Header({
  folderName,
  onSearchSubmit,
  handleImportApp,
  isImportingApp,
  creatingApp,
  canCreateApp,
  createApp,
  fileInput,
}) {
  return (
    <div className="row">
      <div className="col-3">
        <h2 className="page-title px-2">{folderName}</h2>
      </div>
      {canCreateApp() && <div className="col-2 ms-auto d-print-none"></div>}
      <div className="col-4 ms-auto d-print-none d-flex flex-row justify-content-end">
        <SearchBox onSubmit={onSearchSubmit} />
        {canCreateApp() && (
          <>
            <label className="btn btn-default d-none d-lg-inline mb-3 ms-2" onChange={handleImportApp}>
              {isImportingApp && <span className="spinner-border spinner-border-sm mx-2" role="status"></span>}
              Import
              <input type="file" accept=".json" ref={fileInput} style={{ display: 'none' }} />
            </label>
            <button
              className={`btn btn-primary d-none d-lg-inline mb-3 ms-2 create-new-app-button ${
                creatingApp ? 'btn-loading' : ''
              }`}
              onClick={createApp}
            >
              Create new application
            </button>
          </>
        )}
      </div>
    </div>
  );
}
