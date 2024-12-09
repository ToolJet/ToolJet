import React, { useState } from 'react';
import { datasourceService } from '@/_services';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import Button from '@/_ui/Button';
import Input from '@/_ui/Input';
import cx from 'classnames';

const Sharepoint = ({
  optionchanged,
  createDataSource,
  options,
  isSaving,
  selectedDataSource,
  currentAppEnvironmentId,
  workspaceConstants,
  isDisabled,
}) => {
  const [authStatus, setAuthStatus] = useState(null);
  const { t } = useTranslation();

  const hostUrl = window.public_config?.TOOLJET_HOST;
  const subPathUrl = window.public_config?.SUB_PATH;
  const fullUrl = `${hostUrl}${subPathUrl ? subPathUrl : '/'}oauth2/authorize`;
  const redirectUri = fullUrl;

  function authSharepoint() {
    const provider = 'sharepoint';
    const plugin_id = selectedDataSource?.plugin?.id;
    const source_options = options;
    setAuthStatus('waiting_for_url');

    const scope = 'https://graph.microsoft.com/.default+offline_access';

    datasourceService
      .fetchOauth2BaseUrl(provider, plugin_id, source_options)
      .then((data) => {
        const authUrl = `${data.url}&scope=${scope}&state=12345&response_mode=query`;
        localStorage.setItem('sourceWaitingForOAuth', 'newSource');
        localStorage.setItem('currentAppEnvironmentIdForOauth', currentAppEnvironmentId);
        optionchanged('provider', provider).then(() => {
          optionchanged('oauth2', true);
          optionchanged('plugin_id', plugin_id);
        });
        setAuthStatus('waiting_for_token');
        openUrl(authUrl);
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

  function openUrl(url) {
    const width = window.innerWidth * 0.4;
    const height = window.innerHeight * 0.8;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;
    const windowFeatures = `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`;
    const authWindow = window.open(url, '_blank', windowFeatures);
    if (authWindow) {
      authWindow.focus();
    }
  }

  return (
    <div>
      <div>
        <label className="form-label mt-3">Client ID (App ID)</label>
        <Input
          type="text"
          className="form-control"
          onChange={(e) => optionchanged('sp_client_id', e.target.value)}
          value={options?.sp_client_id?.value ?? ''}
          placeholder="Enter client ID"
          workspaceConstants={workspaceConstants}
        />
      </div>
      <div>
        <label className="form-label mt-3">Client secret</label>
        <Input
          type="password"
          className="form-control dynamic-form-encrypted-field"
          onChange={(e) => optionchanged('sp_client_secret', e.target.value)}
          value={options?.sp_client_secret?.value || ''}
          placeholder="**************"
          workspaceConstants={workspaceConstants}
          encrypted={true}
        />
      </div>
      <div>
        <label className="form-label mt-3">Tenant ID</label>
        <Input
          type="text"
          className="form-control"
          onChange={(e) => optionchanged('sp_tenant_id', e.target.value)}
          value={options?.sp_tenant_id?.value ?? ''}
          placeholder="Enter tenant ID"
          workspaceConstants={workspaceConstants}
        />
      </div>
      <div>
        <label className="form-label mt-3">Redirect URI</label>
        <Input
          value={redirectUri}
          helpText="In Microsoft Entra admin center, use the URL above when prompted to enter an redirect URI"
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
                disabled={isSaving || isDisabled}
                onClick={() => saveDataSource()}
              >
                {isSaving ? t('globals.saving', 'Saving...') : t('globals.saveDatasource', 'Save data source')}
              </Button>
            </div>
          )}

          {(!authStatus || authStatus === 'waiting_for_url') && (
            <Button
              className={cx('m2', { 'btn-loading': authStatus === 'waiting_for_url' })}
              disabled={isSaving || isDisabled}
              onClick={() => authSharepoint()}
            >
              {t('globals.connect', 'Connect')} {t('sharepoint.toSharepoint', 'to Sharepoint')}
            </Button>
          )}
        </center>
      </div>
    </div>
  );
};
export default Sharepoint;
