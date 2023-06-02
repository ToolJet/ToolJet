import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import TemplateLibraryModal from './TemplateLibraryModal/';
import { useTranslation } from 'react-i18next';
import { libraryAppService } from '@/_services';
import EmptyIllustration from '@assets/images/no-apps.svg';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { getWorkspaceId } from '../_helpers/utils';
import { useNavigate } from 'react-router-dom';

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
  const [deploying, setDeploying] = useState(false);
  const navigate = useNavigate();

  const staticTemplates = [
    { id: 's3-file-explorer', name: 'S3 file explore' },
    { id: 'job-application-tracker', name: 'Job application tracker' },
    { id: 'whatsapp-and-sms-crm', name: 'Whatsapp and sms crm' },
  ];

  function deployApp(id) {
    if (!deploying) {
      const loadingToastId = toast.loading('Deploying app...');
      setDeploying(true);
      libraryAppService
        .deploy(id)
        .then((data) => {
          setDeploying(false);
          toast.dismiss(loadingToastId);
          toast.success('App created.');
          navigate(`/${getWorkspaceId()}/apps/${data.id}`);
        })
        .catch((e) => {
          toast.dismiss(loadingToastId);
          toast.error(e.error);
          setDeploying(false);
        });
    }
  }

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
                    <ButtonSolid
                      leftIcon="plus"
                      onClick={createApp}
                      isLoading={creatingApp}
                      data-cy="button-new-app-from-scratch"
                      className="col"
                      fill={'#FDFDFE'}
                    >
                      Create new application
                    </ButtonSolid>
                    <div className="col">
                      <ButtonSolid
                        leftIcon="folderdownload"
                        onChange={handleImportApp}
                        isLoading={isImportingApp}
                        data-cy="button-import-an-app"
                        className="col"
                        variant="tertiary"
                      >
                        <label
                          className="cursor-pointer"
                          style={{ visibility: isImportingApp ? 'hidden' : 'visible' }}
                          data-cy="import-an-application"
                        >
                          &nbsp;{t('blankPage.importApplication', 'Import an app')}
                          <input
                            type="file"
                            ref={fileInput}
                            style={{ display: 'none' }}
                            data-cy="import-option-input"
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
              <div className="hr-text" data-cy="action-option">
                Or choose from templates
              </div>
              <div className="row" data-cy="app-template-row">
                {staticTemplates.map(({ id, name }) => {
                  return (
                    <div key={id} className="col-4 app-template-card-wrapper" onClick={() => deployApp(id)}>
                      <div
                        className="template-card cursor-pointer"
                        data-cy={`${name.toLowerCase().replace(/\s+/g, '-')}-app-template-card`}
                      >
                        <div
                          className="img-responsive img-responsive-21x9 card-img-top template-card-img"
                          style={{ backgroundImage: `url(assets/images/templates/${id}.png)` }}
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
