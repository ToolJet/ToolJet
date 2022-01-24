import React from 'react';
import { SearchBox } from '@/_components/SearchBox';
import { Button, ButtonGroup, Dropdown } from 'react-bootstrap';

export default function Header({
  folderName,
  onSearchSubmit,
  handleImportApp,
  isImportingApp,
  creatingApp,
  canCreateApp,
  createApp,
  showTemplateLibraryModal,
  fileInput,
}) {
  return (
    <div className="row">
      <div className="col-4">
        <h2 className="page-title pe-2">{folderName}</h2>
      </div>
      <div className="col-8 ms-auto d-print-none d-flex flex-row justify-content-end">
        <SearchBox onSubmit={onSearchSubmit} />
        {canCreateApp() && (
          <>
            <label className="btn btn-default d-none d-lg-inline mb-3 ms-2" onChange={handleImportApp}>
              {isImportingApp && <span className="spinner-border spinner-border-sm mx-2" role="status"></span>}
              Import
              <input type="file" accept=".json" ref={fileInput} style={{ display: 'none' }} />
            </label>
            {canCreateApp() && (
              <Dropdown as={ButtonGroup}>
                <Button
                  className={`btn btn-primary d-none d-lg-inline mb-3 ms-2 ${creatingApp ? 'btn-loading' : ''}`}
                  onClick={createApp}
                >
                  Create new application
                </Button>

                <Dropdown.Toggle split className="btn btn-primary d-none d-lg-inline mb-3" />

                <Dropdown.Menu>
                  <Dropdown.Item onClick={showTemplateLibraryModal}>Choose from template</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}
          </>
        )}
      </div>
    </div>
  );
}
