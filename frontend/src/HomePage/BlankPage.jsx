import React from 'react';
import TemplateLibraryModal from './TemplateLibraryModal/';
import { useTranslation } from 'react-i18next';

export const BlankPage = function BlankPage({
  createApp,
  darkMode,
  creatingApp,
  handleImportApp,
  isImportingApp,
  fileInput,
  showTemplateLibraryModal,
  hideTemplateLibraryModal,
  viewTemplateLibraryModal,
}) {
  const { t } = useTranslation();
  return (
    <div>
      <div className="page-wrapper">
        <div className="container-xl"></div>
        <div className="page-body">
          <div className="container-xl d-flex flex-column justify-content-center">
            <div>
              <div className="row">
                <div className="col-6">
                  <h3
                    className="empty-welcome-header"
                    style={{ color: darkMode && '#ffffff' }}
                    data-cy="empty-welcome-header"
                  >
                    {t('blankPage.welcomeToToolJet', 'Welcome to ToolJet!')}
                  </h3>
                  <p className={`empty-title ${darkMode && 'text-white-50'}`} data-cy="empty-description">
                    {t(
                      'blankPage.getStartedCreateNewApp',
                      'You can get started by creating a new application or by creating an application using a template in ToolJet Library.'
                    )}
                  </p>
                  <div className="row">
                    <div className="col">
                      <a
                        onClick={createApp}
                        className={`btn btn-primary ${creatingApp ? 'btn-loading' : ''}`}
                        data-cy="create-new-application"
                      >
                        {t('homePage.header.createNewApplication', 'Create new application')}
                      </a>
                    </div>
                    <div className="col">
                      <a
                        className={`btn empty-import-button ${isImportingApp ? 'btn-loading' : ''}`}
                        onChange={handleImportApp}
                      >
                        <label
                          style={{ visibility: isImportingApp ? 'hidden' : 'visible' }}
                          data-cy="import-an-application"
                        >
                          {t('blankPage.importApplication', 'Import an application')}
                          <input type="file" ref={fileInput} style={{ display: 'none' }} />
                        </label>
                      </a>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <img src={'assets/images/no-apps.svg'} alt="" data-cy="empty-img" />
                </div>
              </div>
              {/* <h3
                className="empty-welcome-header"
                style={{ color: darkMode && '#ffffff' }}
                data-cy="empty-welcome-header"
              >
                {t('blankPage.welcomeToToolJet', 'Welcome to ToolJet!')}
              </h3>
              <p className={`empty-title ${darkMode && 'text-white-50'}`} data-cy="empty-description">
                {t(
                  'blankPage.getStartedCreateNewApp',
                  'You can get started by creating a new application or by creating an application using a template in ToolJet Library.'
                )}
              </p> */}
            </div>
          </div>
        </div>
      </div>
      <TemplateLibraryModal
        show={showTemplateLibraryModal}
        onHide={hideTemplateLibraryModal}
        onCloseButtonClick={hideTemplateLibraryModal}
        darkMode={darkMode}
      />
    </div>
  );
};
