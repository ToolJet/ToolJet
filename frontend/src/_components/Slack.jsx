import React, { useState, useEffect } from 'react';
import { datasourceService } from '@/_services';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import Button from '@/_ui/Button';
import { retrieveWhiteLabelText } from '@white-label/whiteLabelling';
import Input from '@/_ui/Input';
import Select from '@/_ui/Select';
import { canDeleteDataSource, canUpdateDataSource } from '@/_helpers';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { checkIfToolJetCloud } from '@/_helpers/utils';
import { useAppDataStore } from '@/_stores/appDataStore';
import { shallow } from 'zustand/shallow';

const Slack = ({
  optionchanged,
  createDataSource,
  options,
  isSaving,
  selectedDataSource,
  currentAppEnvironmentId,
  isDisabled,
  workspaceConstants,
}) => {
  const [authStatus, setAuthStatus] = useState(null);
  const [whiteLabelText, setWhiteLabelText] = useState('');
  const hostUrl = window.public_config?.TOOLJET_HOST;
  const subPathUrl = window.public_config?.SUB_PATH;
  const fullUrl = `${hostUrl}${subPathUrl ? subPathUrl : '/'}oauth2/authorize`;
  const redirectUri = fullUrl;
  const { t } = useTranslation();
  const { tooljetVersion } = useAppDataStore(
    (state) => ({
      tooljetVersion: state?.metadata?.installed_version,
    }),
    shallow
  );

  const optionsForCredentialSource = checkIfToolJetCloud(tooljetVersion)
    ? [
        { value: 'from_env', name: 'ToolJet slack app' },
        { value: 'from_datasource_configuration', name: 'Custom slack app' },
      ]
    : [
        { value: 'from_env', name: 'Use environment variables' },
        { value: 'from_datasource_configuration', name: 'Custom slack app' },
      ];

  const defaultScopes = [
    'users:read',
    'channels:read',
    'groups:read',
    'im:read',
    'mpim:read',
    'channels:history',
    'groups:history',
    'im:history',
    'mpim:history',
  ];

  useEffect(() => {
    async function fetchLabel() {
      const text = await retrieveWhiteLabelText();
      setWhiteLabelText(text);
    }
    fetchLabel();
  }, []);

  function authGoogle() {
    const provider = 'slack';
    setAuthStatus('waiting_for_url');

    let scope =
      'users:read,channels:read,groups:read,im:read,mpim:read,channels:history,groups:history,im:history,mpim:history';
    if (options?.access_type?.value === 'chat:write') {
      scope = `${scope},chat:write`;
    }

    datasourceService
      .fetchOauth2BaseUrl(provider, null, options)
      .then((data) => {
        const authUrl = `${data.url}&scope=${scope}&access_type=offline&prompt=select_account`;

        localStorage.setItem('sourceWaitingForOAuth', 'newSource');
        localStorage.setItem('currentAppEnvironmentIdForOauth', currentAppEnvironmentId);

        optionchanged('provider', provider).then(() => {
          optionchanged('oauth2', true);
        });
        setAuthStatus('waiting_for_token');
        window.open(authUrl);
      })
      .catch(({ error }) => {
        toast.error(error);
        setAuthStatus(null);
      });
  }

  function saveDataSource() {
    optionchanged('code', localStorage.getItem('OAuthCode')).then(() => {
      createDataSource();
    });
  }

  function toggleAccessType() {
    options?.access_type?.value === 'chat:write'
      ? optionchanged('access_type', '')
      : optionchanged('access_type', 'chat:write');
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
                '${whiteLabelText} can connect to Slack and list users, send messages, etc. Please select appropriate permission scopes.',
                { whiteLabelText }
              )}
            </p>
            <div className="row w-100">
              <div className="card-body datasource-footer-info" style={{ height: '100px' }}>
                <div className="row">
                  <div className="col-1">
                    <SolidIcon name="information" fill="#3E63DD" />
                  </div>

                  <div className="col" style={{ maxWidth: '480px' }}>
                    <p data-cy="white-list-ip-text" className="tj-text" style={{ fontSize: '12px' }}>
                      By default this data source requires the following permissions.
                    </p>
                    <p data-cy="white-list-ip-text" className="tj-text">
                      {defaultScopes.map((scope) => (
                        <span key={scope} class="badge badge-light mb-1 mt-1" style={{ marginRight: '.25rem' }}>
                          {scope}
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="form-check mt-3">
                <input
                  className="form-check-input"
                  type="radio"
                  onClick={() => toggleAccessType()}
                  checked={options?.access_type?.value === 'chat:write'}
                  disabled={authStatus === 'waiting_for_token' || isDisabled}
                />
                <span className="form-check-label">
                  {t('slack.chatWrite', 'chat:write')} <br />
                  <small className="text-muted">
                    {t(
                      'slack.listUsersAndSendMessage',
                      'Your ${whiteLabelText} app will be able to list users and send messages to users & channels.',
                      { whiteLabelText }
                    )}
                  </small>
                </span>
              </label>
            </div>
          </div>
          <div>
            <label className="form-label mt-3">Slack app</label>
            <Select
              options={optionsForCredentialSource}
              value={options?.credential_source?.value}
              onChange={(value) => {
                optionchanged('credential_source', value);
              }}
              width="100%"
              isDisabled={!canUpdateDataSource(selectedDataSource?.id) && !canDeleteDataSource()}
              encrypted={false}
            />
          </div>
          {options?.credential_source?.value === 'from_datasource_configuration' && (
            <>
              <div>
                <label className="form-label mt-3">Client ID</label>
                <Input
                  type="text"
                  className="form-control"
                  onChange={(e) => optionchanged('client_id', e.target.value)}
                  value={options?.client_id?.value ?? ''}
                  placeholder="Client ID"
                  workspaceConstants={workspaceConstants}
                />
              </div>
              <div>
                <label className="form-label mt-3">Client Secret</label>
                <Input
                  type="text"
                  className="form-control"
                  onChange={(e) => optionchanged('client_secret', e.target.value)}
                  value={options?.client_secret?.value ?? ''}
                  placeholder="Client Secret"
                  workspaceConstants={workspaceConstants}
                  encrypted={true}
                />
              </div>
            </>
          )}
          <div>
            <label className="form-label mt-3">Redirect URI</label>
            <Input
              value={redirectUri}
              helpText="In Slack, use the URL above when prompted to enter an OAuth callback or redirect URL"
              type="copyToClipboard"
              disabled="true"
              className="form-control"
            />
          </div>
        </div>
      </div>
      <div className="row mt-3">
        <center>
          {authStatus === 'waiting_for_token' && (
            <div>
              <Button
                className={`m2 ${isSaving ? ' loading' : ''}`}
                disabled={isSaving || isDisabled}
                onClick={() => saveDataSource()}
              >
                {isSaving ? t('globals.saving', 'Saving...') : t('globals.saveDatasource', 'Save data source')}
              </Button>
            </div>
          )}

          {(!authStatus || authStatus === 'waiting_for_url') && (
            <Button
              className={`m2 ${authStatus === 'waiting_for_url' ? ' btn-loading' : ''}`}
              disabled={isSaving || isDisabled}
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
