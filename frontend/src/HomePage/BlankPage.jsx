import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import TemplateLibraryModal from './TemplateLibraryModal/';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { libraryAppService } from '@/_services';
import EmptyIllustration from '@assets/images/no-apps.svg';

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
    { id: 's3-file-explorer', name: 'S3 File Explorer' },
    { id: 'job-application-tracker', name: 'Job Application Tracker' },
    { id: 'whatsapp-and-sms-crm', name: 'WhatsApp and SMS CRM' },
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
      <div className="page-wrapper">
        <div className="container-xl"></div>
        <div>
          <div className="container-xl d-flex flex-column justify-content-center">
            <div>
              <div className="row homepage-empty-container">
                <div className="col-6">
                  <h3
                    className="empty-welcome-header"
                    style={{ color: darkMode && '#ffffff' }}
                    data-cy="empty-welcome-header"
                  >
                    {t('blankPage.welcomeToToolJet', 'Welcome to your new ToolJet workspace')}
                  </h3>
                  <p className={`empty-title ${darkMode && 'text-white-50'}`} data-cy="empty-description">
                    {t(
                      'blankPage.getStartedCreateNewApp',
                      'You can get started by creating a new application or by creating an application using a template in ToolJet Library.'
                    )}
                  </p>
                  <div className="row mt-4">
                    <div className="col">
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
                    </div>
                    <div className="col">
                      <a
                        className={`btn empty-import-button ${isImportingApp ? 'btn-loading' : ''}`}
                        onChange={handleImportApp}
                      >
                        <label
                          className="cursor-pointer"
                          style={{ visibility: isImportingApp ? 'hidden' : 'visible' }}
                          data-cy="import-an-application"
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
                              d="M9.59145 1.77401C9.84513 1.63132 10.1549 1.63132 10.4086 1.77401L17.0752 5.52401C17.3376 5.67161 17.5 5.94926 17.5 6.25033V10.0003C17.5 10.4606 17.1269 10.8337 16.6667 10.8337C16.2064 10.8337 15.8333 10.4606 15.8333 10.0003V7.6752L10.8333 10.4877V17.5003C10.8333 17.7964 10.6763 18.0702 10.4207 18.2197C10.1651 18.3691 9.84948 18.3718 9.59145 18.2266L2.92478 14.4766C2.66238 14.329 2.5 14.0514 2.5 13.7503V6.25033C2.5 5.94926 2.66238 5.67161 2.92478 5.52401L9.59145 1.77401ZM10 9.0442L14.9669 6.25033L10 3.45645L5.03311 6.25033L10 9.0442ZM4.16667 7.6752V13.263L9.16667 16.0755V10.4877L4.16667 7.6752ZM15.5893 11.9111C15.9147 12.2365 15.9147 12.7641 15.5893 13.0896L14.5118 14.167H18.3333C18.7936 14.167 19.1667 14.5401 19.1667 15.0003C19.1667 15.4606 18.7936 15.8337 18.3333 15.8337H14.5118L15.5893 16.9111C15.9147 17.2365 15.9147 17.7641 15.5893 18.0896C15.2638 18.415 14.7362 18.415 14.4107 18.0896L11.9107 15.5896C11.5853 15.2641 11.5853 14.7365 11.9107 14.4111L14.4107 11.9111C14.7362 11.5856 15.2638 11.5856 15.5893 11.9111Z"
                              fill="#C1C8CD"
                            />
                          </svg>
                          &nbsp;{t('blankPage.importApplication', 'Import an application')}
                          <input
                            type="file"
                            ref={fileInput}
                            style={{ display: 'none' }}
                            data-cy="import-option-input"
                          />
                        </label>
                      </a>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <EmptyIllustration />
                </div>
              </div>
              <div className="hr-text" data-cy="action-option">
                Or choose from templates
              </div>
              <div className="row">
                {staticTemplates.map(({ id, name }) => {
                  return (
                    <div key={id} className="col-4" onClick={() => deployApp(id)}>
                      <div className="card cursor-pointer">
                        <div
                          className="img-responsive img-responsive-21x9 card-img-top"
                          style={{ backgroundImage: `url(assets/images/templates/${id}.png)` }}
                        />
                        <div className="card-body">
                          <h3 className="card-title">{name}</h3>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="m-auto text-center mt-4">
                <span className="btn btn-link text-decoration-none" onClick={viewTemplateLibraryModal}>
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
