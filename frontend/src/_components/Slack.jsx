import React, { useState } from 'react';
import { datasourceService } from '@/_services';
import { useTranslation } from 'react-i18next';

import Button from '@/_ui/Button';

const Slack = ({ optionchanged, createDataSource, options, isSaving, selectedDataSource }) => {
  const [authStatus, setAuthStatus] = useState(null);
  const { t } = useTranslation();

  function authGoogle() {
    const provider = 'slack';
    setAuthStatus('waiting_for_url');

    let scope =
      'users:read,channels:read,groups:read,im:read,mpim:read,channels:history,groups:history,im:history,mpim:history';
    if (options.access_type === 'chat:write') {
      scope = `${scope},chat:write`;
    }

    datasourceService.fetchOauth2BaseUrl(provider).then((data) => {
      const authUrl = `${data.url}&scope=${scope}&access_type=offline&prompt=select_account`;
      if (selectedDataSource?.id) {
        localStorage.setItem('sourceWaitingForOAuth', selectedDataSource.id);
      } else {
        localStorage.setItem('sourceWaitingForOAuth', 'newSource');
      }
      optionchanged('provider', provider).then(() => {
        optionchanged('oauth2', true);
      });
      setAuthStatus('waiting_for_token');
      window.open(authUrl);
    });
  }

  function saveDataSource() {
    optionchanged('code', localStorage.getItem('OAuthCode')).then(() => {
      createDataSource();
    });
  }

  return (
    <div>
      <div className="row">
        <div className="col-md-12">
          <div className="mb-3">
            <div className="form-label">{t('slack.authorize', 'Authorize')}</div>
            <p>
              {t(
                'slack.connectToolJetToSlack',
                'ToolJet can connect to Slack and list users, send messages, etc. Please select appropriate permission scopes.'
              )}
            </p>
            <div>
              <label className="form-check mt-3">
                <input
                  className="form-check-input"
                  type="radio"
                  onClick={() => optionchanged('access_type', 'chat:write')}
                  checked={options?.access_type?.value === 'chat:write'}
                  disabled={authStatus === 'waiting_for_token'}
                />
                <span className="form-check-label">
                  {t('slack.chatWrite', 'chat:write')} <br />
                  <small className="text-muted">
                    {t(
                      'slack.listUsersAndSendMessage',
                      'Your ToolJet app will be able to list users and send messages to users & channels.'
                    )}
                  </small>
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
      <div className="row mt-3">
        <center>
          {authStatus === 'waiting_for_token' && (
            <div>
              <Button
                className={`m2 ${isSaving ? ' loading' : ''}`}
                disabled={isSaving}
                onClick={() => saveDataSource()}
              >
                {isSaving ? t('globals.saving', 'Saving...') : t('globals.saveDatasource', 'Save data source')}
              </Button>
            </div>
          )}

          {(!authStatus || authStatus === 'waiting_for_url') && (
            <Button
              className={`m2 ${authStatus === 'waiting_for_url' ? ' btn-loading' : ''}`}
              disabled={isSaving}
              onClick={() => authGoogle()}
            >
              {t('slack.connectSlack', 'Connect to Slack')}
            </Button>
          )}
        </center>
      </div>
    </div>
  );
};

export default Slack;
