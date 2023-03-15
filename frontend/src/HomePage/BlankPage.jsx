import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import TemplateLibraryModal from './TemplateLibraryModal/';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { libraryAppService } from '@/_services';
import EmptyIllustration from '@assets/images/no-apps.svg';
import { ButtonSolid } from '../_ui/AppButton/AppButton';

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
  const history = useHistory();

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
          history.push(`/apps/${data.id}`);
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
                    {/* <div className="col">
                      <a
                        onClick={createApp}
                        className={`btn btn-primary ${creatingApp ? 'btn-loading' : ''}`}
                        data-cy="create-new-application"
                      >
                        <svg
                          className="icon"
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M9.99967 3.33301C10.4599 3.33301 10.833 3.7061 10.833 4.16634V9.16634H15.833C16.2932 9.16634 16.6663 9.53944 16.6663 9.99967C16.6663 10.4599 16.2932 10.833 15.833 10.833H10.833V15.833C10.833 16.2932 10.4599 16.6663 9.99967 16.6663C9.53944 16.6663 9.16634 16.2932 9.16634 15.833V10.833H4.16634C3.7061 10.833 3.33301 10.4599 3.33301 9.99967C3.33301 9.53944 3.7061 9.16634 4.16634 9.16634H9.16634V4.16634C9.16634 3.7061 9.53944 3.33301 9.99967 3.33301Z"
                            fill="#FDFDFE"
                          />
                        </svg>
                        New app from scratch
                      </a>
                    </div> */}
                    <ButtonSolid
                      leftIcon="plus"
                      onClick={createApp}
                      isLoading={creatingApp}
                      data-cy="create-new-application"
                      className="col"
                      fill={'#FDFDFE'}
                    >
                      New app from scratch
                    </ButtonSolid>
                    <div className="col">
                      <ButtonSolid
                        // fill={'#FDFDFE'}
                        leftIcon="folderdownload"
                        onChange={handleImportApp}
                        isLoading={isImportingApp}
                        data-cy="create-new-application"
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
                <span
                  className="see-all-temlplates-link tj-text-sm font-weight-600"
                  onClick={viewTemplateLibraryModal}
                  data-cy="see-all-apps-template-buton"
                >
                  See all templates
                </span>
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
