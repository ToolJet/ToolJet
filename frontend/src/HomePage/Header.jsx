import React from 'react';
import { SearchBox } from '@/_components/SearchBox';
import { Button, ButtonGroup, Dropdown } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

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
  darkMode,
}) {
  const { t } = useTranslation();
  return (
    <div className="row">
      <div className="col-4">
        <h2 className="page-title pe-2" data-cy="folder-page-title">
          {folderName}
        </h2>
      </div>
      <div className="col-8 ms-auto d-print-none d-flex flex-row justify-content-end">
        <SearchBox onSubmit={onSearchSubmit} darkMode={darkMode} placeholder={t('globals.search', 'Search')} />
        {canCreateApp() && (
          <>
            {canCreateApp() && (
              <Dropdown as={ButtonGroup}>
                <Button
                  className={`btn btn-primary d-none d-lg-inline mb-3 ms-2 ${creatingApp ? 'btn-loading' : ''}`}
                  onClick={createApp}
                  data-cy="create-new-app-button"
                >
                  {isImportingApp && <span className="spinner-border spinner-border-sm mx-2" role="status"></span>}
                  {t('homePage.header.createNewApplication', 'Create new application')}
                </Button>
                <Dropdown.Toggle split className="btn btn-primary d-none d-lg-inline mb-3 " />
                <Dropdown.Menu className="import-lg-position">
                  <Dropdown.Item onClick={showTemplateLibraryModal}>
                    {t('homePage.header.chooseFromTemplate', 'Choose from template')}
                  </Dropdown.Item>
                  <label className="homepage-dropdown-style" onChange={handleImportApp}>
                    {t('homePage.header.import', 'Import')}
                    <input type="file" accept=".json" ref={fileInput} style={{ display: 'none' }} />
                  </label>
                </Dropdown.Menu>
              </Dropdown>
            )}
          </>
        )}
      </div>
    </div>
  );
}
