import React, { useState } from 'react';
import { datasourceService, authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Button from '@/_ui/Button';
import GoogleSheetsAccessType from '@/_components/GoogleSheetsAccessType';

const Googlesheets = ({
  optionchanged,
  createDataSource,
  options,
  isSaving,
  selectedDataSource,
  currentAppEnvironmentId,
  isDisabled,
}) => {
  const [authStatus, setAuthStatus] = useState(null);
  const { t } = useTranslation();

  function authGoogle() {
    const provider = 'googlesheets';
    const organizationId = authenticationService.currentSessionValue?.current_organization_id;
    setAuthStatus('waiting_for_url');

    const scope =
      options.access_type?.value === 'read'
        ? 'https://www.googleapis.com/auth/spreadsheets.readonly'
        : 'https://www.googleapis.com/auth/spreadsheets';

    datasourceService
      .fetchOauth2BaseUrl(provider, null, options, currentAppEnvironmentId, organizationId)
      .then((data) => {
        const authUrl = `${data.url}&scope=${scope}&access_type=offline&prompt=consent`;
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

  return (
    <div>
      <GoogleSheetsAccessType
        options={options}
        optionchanged={optionchanged}
        disabled={authStatus === 'waiting_for_token' || isDisabled}
      />
      {options?.authentication_type?.value === 'oauth2' && selectedDataSource?.kind !== 'googlesheetsv2' && (
        <div className="row mt-3">
          <center>
            {authStatus === 'waiting_for_token' && (
              <div>
                <Button
                  className={`m2 ${isSaving ? ' loading' : ''}`}
                  disabled={isSaving || isDisabled}
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
                disabled={isSaving || isDisabled}
                onClick={() => authGoogle()}
                data-cy="button-connect-gsheet"
              >
                {selectedDataSource?.id ? t('globals.reconnect', 'Reconnect') : t('globals.connect', 'Connect')}{' '}
                {t('googleSheets.toGoogleSheets', 'to Google Sheets')}
              </Button>
            )}
          </center>
        </div>
      )}
    </div>
  );
};

export default Googlesheets;
