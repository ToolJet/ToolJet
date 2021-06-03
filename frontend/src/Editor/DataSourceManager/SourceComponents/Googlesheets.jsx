import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import { datasourceService } from '@/_services';
import { toast } from 'react-toastify';

export const Googlesheets = ({
  optionchanged, createDataSource, options, isSaving, selectedDataSource
}) => {
  const [authStatus, setAuthStatus] = useState(null);

  function authGoogle() {
    const provider = 'google';
    setAuthStatus('waiting_for_url');

    const scope = options.access_type.value === 'read'
      ? 'https://www.googleapis.com/auth/spreadsheets.readonly'
      : 'https://www.googleapis.com/auth/spreadsheets';

    datasourceService.fetchOauth2BaseUrl(provider).then((data) => {
      const authUrl = `${data.url}&scope=${scope}&access_type=offline&prompt=select_account`;
      localStorage.setItem('sourceWaitingForOAuth', 'newSource');
      optionchanged('provider', provider).then(() => {
        optionchanged('oauth2', true);
      });
      setAuthStatus('waiting_for_token');
      window.open(authUrl);
    }).catch(({ error }) => {
      toast.error(error, { hideProgressBar: true, position: 'top-center' });
      setAuthStatus(null);
    });;
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
            <div className="form-label">Authorize</div>
            <p>If you want your ToolJet apps to modify your Google sheets, make sure to select read and write access</p>
            <div>
              <label className="form-check mt-3">
                <input
                  className="form-check-input"
                  type="radio"
                  onClick={() => optionchanged('access_type', 'read')}
                  checked={options.access_type.value === 'read'}
                  disabled={authStatus === 'waiting_for_token'}
                />
                <span className="form-check-label">
                  Read only <br />
                  <small className="text-muted">Your ToolJet apps can only read data from Google sheets</small>
                </span>
              </label>
              <label className="form-check mt2">
                <input
                  className="form-check-input"
                  type="radio"
                  onClick={() => optionchanged('access_type', 'write')}
                  checked={options.access_type.value === 'write'}
                  disabled={authStatus === 'waiting_for_token'}
                />
                <span className="form-check-label">
                  Read and write <br />
                  <small className="text-muted">
                    Your ToolJet apps can read data from sheets, modify sheets, and more.
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
              onClick={() => authGoogle()}
            >
              {selectedDataSource.id ? 'Reconnect' : 'Connect'} to Google Sheets
            </Button>
          )}
        </center>
      </div>
    </div>
  );
};
