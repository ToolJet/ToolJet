import React, { useState } from 'react';
import { datasourceService } from '@/_services';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import Radio from '@/_ui/Radio';
import Button from '@/_ui/Button';

const Googlesheets = ({ optionchanged, createDataSource, options, isSaving, selectedDataSource }) => {
  const [authStatus, setAuthStatus] = useState(null);
  const { t } = useTranslation();

  function authGoogle() {
    const provider = 'googlesheets';
    setAuthStatus('waiting_for_url');

    const scope =
      options.access_type?.value === 'read'
        ? 'https://www.googleapis.com/auth/spreadsheets.readonly'
        : 'https://www.googleapis.com/auth/spreadsheets';

    datasourceService
      .fetchOauth2BaseUrl(provider)
      .then((data) => {
        const authUrl = `${data.url}&scope=${scope}&access_type=offline&prompt=consent`;
        localStorage.setItem('sourceWaitingForOAuth', 'newSource');
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

  return (
    <div>
      <div className="row">
        <div className="col-md-12">
          <div className="mb-3">
            <div data-cy="google-sheet-connection-form-header" className="form-label">
              {t('globals.authorize', 'Authorize')}
            </div>
            <p data-cy="google-sheet-connection-form-description">
              {t(
                'googleSheets.enableReadAndWrite',
                'If you want your ToolJet apps to modify your Google sheets, make sure to select read and write access'
              )}
            </p>
            <div>
              <Radio
                checked={options?.access_type?.value === 'read'}
                disabled={authStatus === 'waiting_for_token'}
                onClick={() => optionchanged('access_type', 'read')}
                text={t('googleSheets.readOnly', 'Read only')}
                helpText={t(
                  'googleSheets.readDataFromSheets',
                  'Your ToolJet apps can only read data from Google sheets'
                )}
              />
              <Radio
                checked={options?.access_type?.value === 'write'}
                disabled={authStatus === 'waiting_for_token'}
                onClick={() => optionchanged('access_type', 'write')}
                text={t('googleSheets.readWrite', 'Read and write')}
                helpText={t(
                  'googleSheets.readModifySheets',
                  'Your ToolJet apps can read data from sheets, modify sheets, and more.'
                )}
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
                data-cy="button-connect-gsheet"
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
              data-cy="button-connect-gsheet"
            >
              {selectedDataSource?.id ? t('globals.reconnect', 'Reconnect') : t('globals.connect', 'Connect')}{' '}
              {t('googleSheets.toGoogleSheets', 'to Google Sheets')}
            </Button>
          )}
        </center>
      </div>
    </div>
  );
};

export default Googlesheets;
