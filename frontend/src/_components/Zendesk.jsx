import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import Input from '@/_ui/Input';
import Radio from '@/_ui/Radio';
import Button from '@/_ui/Button';

const Zendesk = ({ optionchanged, createDataSource, options, isSaving, selectedDataSource, workspaceConstants }) => {
  const [authStatus, setAuthStatus] = useState(null);

  function authZendesk() {
    const provider = 'zendesk';
    setAuthStatus('waiting_for_url');

    const scope = options?.access_type?.value === 'read' ? 'read' : 'read%20write';

    try {
      const authUrl = `https://${options?.subdomain?.value}.zendesk.com/oauth/authorizations/new?response_type=code&client_id=${options?.client_id?.value}&redirect_uri=${window.location.origin}/oauth2/authorize&scope=${scope}`;
      localStorage.setItem('sourceWaitingForOAuth', 'newSource');
      optionchanged('provider', provider).then(() => {
        optionchanged('oauth2', true);
      });
      setAuthStatus('waiting_for_token');
      window.open(authUrl);
    } catch (error) {
      toast.error(error);
      setAuthStatus(null);
    }
  }

  function saveDataSource() {
    optionchanged('code', localStorage.getItem('OAuthCode')).then(() => {
      createDataSource();
    });
  }

  return (
    <div>
      <div className="row">
        <div className="col-md-12 mb-3 ">
          <label className="form-label text-muted mt-3">Zendesk Sub-domain</label>
          <Input
            type="text"
            className="form-control"
            onChange={(e) => optionchanged('subdomain', e.target.value)}
            value={options?.subdomain?.value ?? ''}
            placeholder="e.g. tooljet"
            workspaceConstants={workspaceConstants}
          />
        </div>

        <div className="col-md-12">
          <label className="form-label text-muted mt-3">Client ID</label>
          <Input
            type="text"
            className="form-control"
            onChange={(e) => optionchanged('client_id', e.target.value)}
            value={options?.client_id?.value}
            placeholder="e.g. tj-zendesk"
            workspaceConstants={workspaceConstants}
          />
        </div>
        <div className="col-md-12 mb-2">
          <label className="form-label text-muted mt-3">
            Client Secret
            <small className="text-green mx-2">
              <img className="mx-2 encrypted-icon" src="assets/images/icons/padlock.svg" width="12" height="12" />
              Encrypted
            </small>
          </label>
          <Input
            type="password"
            className="form-control"
            onChange={(e) => optionchanged('client_secret', e.target.value)}
            value={options?.client_secret?.value}
            workspaceConstants={workspaceConstants}
          />
        </div>

        <div className="col-md-12">
          <div className="mb-3">
            <div className="form-label">Scope(s)</div>
            <p>
              If you want your ToolJet apps to modify your Zendesk resources, make sure to select read and write access
            </p>
            <div>
              <Radio
                checked={options?.access_type?.value === 'read'}
                disabled={authStatus === 'waiting_for_token'}
                onClick={() => optionchanged('access_type', 'read')}
                text="Read only"
                helpText="Your ToolJet apps can only read data from resources"
              />
              <Radio
                checked={options?.access_type?.value === 'write'}
                disabled={authStatus === 'waiting_for_token'}
                onClick={() => optionchanged('access_type', 'write')}
                text="Read and write"
                helpText="Your ToolJet apps can read data from resources, modify resources, and more."
              />
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
                {isSaving ? 'Saving...' : 'Save data source'}
              </Button>
            </div>
          )}

          {(!authStatus || authStatus === 'waiting_for_url') && (
            <Button
              className={`m2 ${authStatus === 'waiting_for_url' ? ' btn-loading' : ''}`}
              disabled={isSaving}
              onClick={() => authZendesk()}
            >
              {selectedDataSource?.id ? 'Reconnect' : 'Connect'} to Zendesk
            </Button>
          )}
        </center>
      </div>
    </div>
  );
};

export default Zendesk;
