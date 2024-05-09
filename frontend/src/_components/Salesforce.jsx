import React, { useState } from 'react';
import { datasourceService } from '@/_services';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import Button from '@/_ui/Button';
import Select from '@/_ui/Select';
import Input from '@/_ui/Input';

const Salesforce = ({ optionchanged, createDataSource, options, isSaving, selectedDataSource, workspaceConstants }) => {
  const [authStatus, setAuthStatus] = useState(null);
  const { t } = useTranslation();
  const hostUrl = window.public_config?.TOOLJET_HOST;
  const subPathUrl = window.public_config?.SUB_PATH;
  const fullUrl = `${hostUrl}${subPathUrl ? subPathUrl : '/'}oauth2/authorize`;
  const redirectUri = fullUrl;
  const selectOptions = [
    { value: 'v1', label: 'v1' },
    { value: 'v2', label: 'v2' },
  ];
  function authSalesforce() {
    const provider = 'salesforce';
    const plugin_id = selectedDataSource?.plugin?.id;
    const source_options = options;
    setAuthStatus('waiting_for_url');

    datasourceService
      .fetchOauth2BaseUrl(provider, plugin_id, source_options)
      .then((data) => {
        console.log('options', source_options);
        console.log('data from Oauth', data.url);
        console.log('selectedDataSource.kind', selectedDataSource.kind);
        localStorage.setItem('sourceWaitingForOAuth', 'newSource');
        optionchanged('provider', provider).then(() => {
          optionchanged('oauth2', true);
          optionchanged('plugin_id', plugin_id);
        });
        setAuthStatus('waiting_for_token');
        window.open(data.url);
      })
      .catch(({ error }) => {
        toast.error(error);
        setAuthStatus(null);
      });
  }
  function saveDataSource() {
    console.log('selectedDS', selectedDataSource);
    optionchanged('code', localStorage.getItem('OAuthCode')).then(() => {
      createDataSource();
    });
  }

  return (
    <div>
      <div>
        <label className="form-label text-muted mt-3">API version</label>
        <Select
          options={selectOptions}
          value={options?.api_version?.value}
          onChange={(value) => optionchanged('api_version', value)}
          width={'100%'}
          useMenuPortal={false}
        />
      </div>
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
      <div>
        <label className="form-label mt-3">Redirect URI</label>
        <Input
          value={redirectUri}
          helpText="In Salesforce, use the URL above when prompted to enter an OAuth callback or redirect URL"
          type="copyToClipboard"
          disabled="true"
          className="form-control"
        />
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
              onClick={() => authSalesforce()}
            >
              {t('slack.connectSalesforce', 'Connect to Salesforce')}
            </Button>
          )}
        </center>
      </div>
    </div>
  );
};
export default Salesforce;
