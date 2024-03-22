import React, { useState } from 'react';
import { datasourceService } from '@/_services';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import Button from '@/_ui/Button';
import Select from '@/_ui/Select';
import Input from '@/_ui/Input';

const Salesforce = ({ optionchanged, createDataSource, options, isSaving }) => {
  const [authStatus, setAuthStatus] = useState(null);
  const { t } = useTranslation();
  const redirectUri = '/oauth/callback/salesforce';
  const selectOptions = [
    { value: 'v1', label: 'v1' },
    { value: 'v2', label: 'v2' },
  ];
  function authGoogle() {
    const provider = 'salesforce';
    setAuthStatus('waiting_for_url');

    datasourceService
      .fetchOauth2BaseUrl(provider)
      .then((data) => {
        console.log(data);
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
        <Select width="100%" options={selectOptions}></Select>
      </div>
      <div>
        <label className="form-label mt-3">Client ID</label>
        <Input type="text" className="form-control" />
      </div>
      <div>
        <label className="form-label mt-3">Client Secret</label>
        <Input type="password" encrypted={true} className="form-control" />
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
          <Button onClick={() => authGoogle()}>{t('slack.connectSalesforce', 'Connect to Salesforce')}</Button>
        </center>
      </div>
    </div>
  );
};
export default Salesforce;
