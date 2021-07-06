import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import { datasourceService } from '@/_services';

export const Github = ({ optionchanged, createDataSource, options, isSaving, selectedDataSource }) => {
  const [authStatus, setAuthStatus] = useState(null);

  function authGithub() {
    const provider = 'github';
    setAuthStatus('waiting_for_url');

    datasourceService.fetchOauth2BaseUrl(provider).then((data) => {
      const authUrl = `${data.url}`;
      console.log(authUrl);
      localStorage.setItem('sourceWaitingForOAuth', 'newSource');
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
        <div className="row mt-3">
          <div className="col-md-4">
            <label className="form-label">ClientID</label>
            <input
              type="text"
              className="form-control"
              onChange={(e) => optionchanged('client_id', e.target.value)}
              value={options.client_id.value}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Client Secret</label>
            <input
              type="text"
              className="form-control"
              onChange={(e) => optionchanged('client_secret', e.target.value)}
              value={options.client_secret.value}
            />
          </div>
        </div>
      </div>
      {authStatus === 'waiting_for_token' && (
        <div>
          <Button
            className={`m2 ${isSaving ? ' loading' : ''}`}
            disabled={isSaving}
            variant="primary"
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
          variant="primary"
          onClick={() => authGithub()}
        >
          Connect to Github
        </Button>
      )}
    </div>
  );
};
