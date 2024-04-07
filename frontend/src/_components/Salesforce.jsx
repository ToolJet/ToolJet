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
  const redirectUri = `http://localhost:8082/oauth2/authorize`;
  const selectOptions = [
    { value: 'v1', label: 'v1' },
    { value: 'v2', label: 'v2' },
  ];
  function authSalesforce() {
    const provider = selectedDataSource?.kind;
    const plugin_id = selectedDataSource?.plugin?.id;
    const source_options = options;
    setAuthStatus('waiting_for_url');

    datasourceService
      .fetchOauth2BaseUrl(provider, plugin_id, source_options)
      .then((data) => {
        console.log('options', source_options);
        console.log('data from Oauth', data);
      })
      .catch(({ error }) => {
        toast.error(error);
        setAuthStatus(null);
      });
  }

  return (
    <div>
      <div>
        <label className="form-label mt-3">API Version</label>
        <Select
          width="100%"
          type="select"
          className="form-control"
          options={selectOptions}
          onChange={(e) => optionchanged('api_version', e.target.value)}
          value={options?.api_version?.value ?? ''}
        ></Select>
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
          <Button onClick={() => authSalesforce()}>{t('slack.connectSalesforce', 'Connect to Salesforce')}</Button>
        </center>
      </div>
    </div>
  );
};
export default Salesforce;
