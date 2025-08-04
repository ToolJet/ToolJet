import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import TemplateLibraryModal from './TemplateLibraryModal';
import { useTranslation } from 'react-i18next';
import { appsService } from '@/_services';
import EmptyIllustration from '@assets/images/no-apps.svg';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import EmptyFoldersIllustration from '@assets/images/icons/no-queries-added.svg';
import { retrieveWhiteLabelText } from '@white-label/whiteLabelling';
import posthogHelper from '@/modules/common/helpers/posthogHelper';
import { authenticationService } from '@/_services';

export const BlankPage = function BlankPage({
  readAndImport,
  isImportingApp,
  fileInput,
  openCreateAppModal,
  openCreateAppFromTemplateModal,
  creatingApp,
  darkMode,
  showTemplateLibraryModal,
  hideTemplateLibraryModal,
  viewTemplateLibraryModal,
  appType,
  canCreateApp,
  workflowsLimit,
}) {
  const { t } = useTranslation();
  const whiteLabelText = retrieveWhiteLabelText();
  const [appsLimit, setAppsLimit] = useState(null);

  useEffect(() => {
    fetchAppsLimit();
  }, []);

  const staticTemplates = [
    { id: 'customer-ticketing-form', name: 'Customer ticketing form' },
    { id: 'inventory-management-tooljet-db', name: 'Inventory management' },
    { id: 'kpi-management-dashboard-tooljet-db', name: 'KPI management dashboard' },
  ];

  function fetchAppsLimit() {
    appsService.getAppsLimit().then((data) => {
      setAppsLimit({ ...data?.appsCount });
    });
  }

  const appCreationDisabled = !canCreateApp() || (!appsLimit?.canAddUnlimited && appsLimit?.percentage >= 100);
  const workflowsCreationDisabled =
    !canCreateApp() || (!workflowsLimit?.canAddUnlimited && workflowsLimit?.percentage >= 100);

  const templateOptionsView = (
    <>
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
                /* Posthog Event */
                posthogHelper.captureEvent('create_application_from_template', {
                  workspace_id:
                    authenticationService?.currentUserValue?.organization_id ||
                    authenticationService?.currentSessionValue?.current_organization_id,
                  template_name: name,
                  button_name: 'create_application_from_template_card',
                });
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
          disabled={appCreationDisabled}
          className={cx('see-all-temlplates-link tj-text-sm font-weight-600 bg-transparent border-0', {
            disabled: appCreationDisabled,
          })}
          onClick={() => {
            posthogHelper.captureEvent('click_import_from_template', {
              workspace_id:
                authenticationService?.currentUserValue?.organization_id ||
                authenticationService?.currentSessionValue?.current_organization_id,
              button_name: 'click_see_all_templates_button',
            });
            viewTemplateLibraryModal();
          }}
          data-cy="see-all-apps-template-buton"
        >
          See all templates
        </button>
      </div>
    </>
  );

  return (
    appsLimit && (
      <div>
        <div className="page-wrapper blank-page-wrapper">
          <div className="container-xl"></div>
          <div>
            <div className="container-xl d-flex flex-column justify-content-center">
              <div>
                <div className="row homepage-empty-container">
                  <div className="col-7">
                    <h3 className="empty-welcome-header" data-cy="empty-homepage-welcome-header">
                      {t('blankPage.welcomeToToolJet', `Welcome to your new ${whiteLabelText} workspace`, {
                        whiteLabelText,
                      })}
                    </h3>
                    <p className={`empty-title`} data-cy="empty-homepage-description">
                      {appType !== 'workflow'
                        ? t(
                            'blankPage.getStartedCreateNewApp',
                            `You can get started by creating a new application or by creating an application using a template in ${whiteLabelText} Library.`,
                            {
                              whiteLabelText,
                            }
                          )
                        : t(
                            'blankPage.getStartedCreateNewWorkflow',
                            `You can get started by creating a new workflow.`,
                            {
                              whiteLabelText,
                            }
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
                          disabled={appType !== 'workflow' ? appCreationDisabled : workflowsCreationDisabled}
                          fill={'#FDFDFE'}
                        >
                          Create new {appType !== 'workflow' ? 'application' : 'workflow'}
                        </ButtonSolid>
                      </div>
                      <div className="col-6">
                        <ButtonSolid
                          disabled={appType !== 'workflow' ? appCreationDisabled : workflowsCreationDisabled}
                          leftIcon="folderdownload"
                          onChange={readAndImport}
                          isLoading={isImportingApp}
                          data-cy={appType !== 'workflow' ? 'button-import-an-app' : 'button-import-a-workflow'}
                          className="col"
                          variant="tertiary"
                        >
                          <label
                            className={cx('', {
                              'cursor-pointer':
                                appType !== 'workflow' ? !appCreationDisabled : !workflowsCreationDisabled,
                            })}
                            style={{ visibility: isImportingApp ? 'hidden' : 'visible' }}
                            data-cy={appType !== 'workflow' ? 'import-an-application' : 'import-a-workflow'}
                          >
                            &nbsp;
                            {appType !== 'workflow'
                              ? t('blankPage.importApplication', 'Import an app')
                              : t('blankPage.importWorkflow', 'Import a workflow')}
                            <input
                              disabled={appType !== 'workflow' ? appCreationDisabled : workflowsCreationDisabled}
                              type="file"
                              ref={fileInput}
                              style={{ display: 'none' }}
                              data-cy="import-option-input"
                              onClick={() => {
                                /* Posthog Event */
                                posthogHelper.captureEvent('click_import_button', {
                                  workspace_id:
                                    authenticationService?.currentUserValue?.organization_id ||
                                    authenticationService?.currentSessionValue?.current_organization_id,
                                  button_name: 'click_import_an_application_button',
                                });
                              }}
                            />
                          </label>
                        </ButtonSolid>
                      </div>
                    </div>
                  </div>
                  <div className="col-5 empty-home-page-image" data-cy="empty-home-page-image">
                    <EmptyIllustration />
                  </div>
                </div>
                {appType !== 'workflow' && !appCreationDisabled && templateOptionsView}
              </div>
            </div>
          </div>
        </div>
        <div className="d-flex justify-content-center align-items-center flex-column mt-3 blank-page-wrapper-mobile">
          <div className="mb-4">
            <EmptyFoldersIllustration />
          </div>
          <div className="tj-text-md text-secondary">No apps created yet</div>
        </div>
        <TemplateLibraryModal
          show={showTemplateLibraryModal}
          onHide={hideTemplateLibraryModal}
          onCloseButtonClick={hideTemplateLibraryModal}
          darkMode={darkMode}
          appCreationDisabled={appCreationDisabled}
        />
      </div>
    )
  );
};
