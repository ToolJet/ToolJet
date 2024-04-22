import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import EmptyIllustration from '@assets/images/no-apps.svg';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { useNavigate } from 'react-router-dom';
import EmptyFoldersIllustration from '@assets/images/icons/no-queries-added.svg';

export const BlankPage = function BlankPage({
  readAndImport,
  isImportingApp,
  fileInput,
  openCreateAppModal,
  openCreateAppFromTemplateModal,
  creatingApp,
  darkMode,
  viewTemplateLibraryModal,
  canCreateApp,
}) {
  const { t } = useTranslation();
  const [deploying, setDeploying] = useState(false);
  const navigate = useNavigate();

  const staticTemplates = [
    { id: 'customer-ticketing-form', name: 'Customer ticketing form' },
    { id: 'inventory-management-tooljet-db', name: 'Inventory management' },
    { id: 'kpi-management-dashboard-tooljet-db', name: 'KPI management dashboard' },
  ];

  const appCreationDisabled = !canCreateApp();

  const EmptyState = () => {
    return (
      <div
        style={{
          transform: 'translateY(80%)',
        }}
        className="d-flex justify-content-center align-items-center flex-column mt-3"
      >
        <div className="mb-4">
          <EmptyFoldersIllustration />
        </div>
        <div className="tj-text-md text-secondary" data-cy="empty-ds-page-text">
          No datasources added
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-wrapper blank-page-wrapper">
        <div className="container-xl"></div>
        <div>
          <div className="container-xl d-flex flex-column justify-content-center">
            <div>
              <div className="row homepage-empty-container">
                <div className="col-6">
                  <h3 className="empty-welcome-header" data-cy="empty-homepage-welcome-header">
                    {t('blankPage.welcomeToToolJet', 'Welcome to your new ToolJet workspace')}
                  </h3>
                  <p className={`empty-title`} data-cy="empty-homepage-description">
                    {t(
                      'blankPage.getStartedCreateNewApp',
                      'You can get started by creating a new application or by creating an application using a template in ToolJet Library.'
                    )}
                  </p>
                  <div className="row mt-4">
                    <div className="col-6">
                      <ButtonSolid
                        leftIcon="plus"
                        onClick={openCreateAppModal}
                        isLoading={creatingApp}
                        data-cy="button-new-app-from-scratch"
                        className="col"
                        fill={'#FDFDFE'}
                        disabled={appCreationDisabled}
                      >
                        Create new application
                      </ButtonSolid>
                    </div>
                    <div className="col-6">
                      <ButtonSolid
                        leftIcon="folderdownload"
                        onChange={readAndImport}
                        isLoading={isImportingApp}
                        data-cy="button-import-an-app"
                        className="col"
                        disabled={appCreationDisabled}
                        variant={!appCreationDisabled ? 'tertiary' : 'primary'}
                      >
                        <label
                          className="cursor-pointer"
                          style={{ visibility: isImportingApp ? 'hidden' : 'visible' }}
                          data-cy="import-an-application"
                          disabled={appCreationDisabled}
                        >
                          &nbsp;{t('blankPage.importApplication', 'Import an app')}
                          <input
                            type="file"
                            ref={fileInput}
                            style={{ display: 'none' }}
                            data-cy="import-option-input"
                            disabled={appCreationDisabled}
                          />
                        </label>
                      </ButtonSolid>
                    </div>
                  </div>
                </div>
                <div className="col-6 empty-home-page-image" data-cy="empty-home-page-image">
                  <EmptyIllustration />
                </div>
              </div>
              {!appCreationDisabled && (
                <div>
                  <div className="hr-text" data-cy="action-option">
                    Or choose from templates
                  </div>
                  <div className="row" data-cy="app-template-row">
                    {staticTemplates.map(({ id, name }) => {
                      return (
                        <div
                          key={id}
                          className="col-4 app-template-card-wrapper"
                          onClick={() => {
                            openCreateAppFromTemplateModal({ id, name });
                          }}
                        >
                          <div
                            className="template-card cursor-pointer"
                            data-cy={`${name.toLowerCase().replace(/\s+/g, '-')}-app-template-card`}
                          >
                            <div
                              className="img-responsive img-responsive-21x9 card-img-top template-card-img"
                              style={{
                                backgroundImage: `url(assets/images/templates/${id}${darkMode ? '-dark' : ''}.png)`,
                              }}
                              data-cy={`${name.toLowerCase().replace(/\s+/g, '-')}-app-template-image`}
                            />
                            <div className="card-body">
                              <h3
                                className="tj-text-md font-weight-500"
                                data-cy={`${name.toLowerCase().replace(/\s+/g, '-')}-app-template-title`}
                              >
                                {name}
                              </h3>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="m-auto text-center mt-4">
                    <button
                      className="see-all-temlplates-link tj-text-sm font-weight-600 bg-transparent border-0"
                      onClick={viewTemplateLibraryModal}
                      data-cy="see-all-apps-template-buton"
                    >
                      See all templates
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="justify-content-center align-items-center flex-column mt-3 blank-page-wrapper-mobile">
        <div className="mb-4">
          <EmptyFoldersIllustration />
        </div>
        <div className="tj-text-md text-secondary">No apps created yet</div>
      </div>
    </div>
  );
};
