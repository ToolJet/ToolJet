import OAuth from '@/_ui/OAuth';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { datasourceService } from '@/_services';
import { capitalize } from 'lodash';
import { toast } from 'react-hot-toast';
import Button from '@/_ui/Button';
import Input from '@/_ui/Input';
import cx from 'classnames';

const OAuthWrapper = ({
  optionchanged,
  createDataSource,
  options,
  isSaving,
  selectedDataSource,
  workspaceConstants,
  optionsChanged,
  isDisabled,
  multiple_auth_enabled,
  scopes,
  oauth_configs,
  currentAppEnvironmentId,
}) => {
  const [authStatus, setAuthStatus] = useState(null);
  const { t } = useTranslation();
  const needConnectionButton =
    options?.auth_type?.value === 'oauth2' &&
    options?.grant_type?.value === 'authorization_code' &&
    multiple_auth_enabled !== true;
  const dataSourceNameCapitalize = capitalize(selectedDataSource?.plugin?.name || selectedDataSource?.kind);

  const hostUrl = window.public_config?.TOOLJET_HOST;
  const subPathUrl = window.public_config?.SUB_PATH;
  const fullUrl = `${hostUrl}${subPathUrl ? subPathUrl : '/'}oauth2/authorize`;
  const redirectUri = fullUrl;

  function authorizeWithProvider() {
    const provider = selectedDataSource?.kind;
    const plugin_id = selectedDataSource?.plugin?.id;
    const source_options = options;
    setAuthStatus('waiting_for_url');

    const fetchArgs = plugin_id ? [provider, plugin_id, source_options] : [provider, null, source_options];

    datasourceService
      .fetchOauth2BaseUrl(...fetchArgs)
      .then((data) => {
        localStorage.setItem('sourceWaitingForOAuth', 'newSource');
        localStorage.setItem('currentAppEnvironmentIdForOauth', currentAppEnvironmentId);
        optionchanged('provider', provider).then(() => {
          optionchanged('oauth2', true);
          if (plugin_id) {
            optionchanged('plugin_id', plugin_id);
          }
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
    optionchanged('code', localStorage.getItem('OAuthCode')).then(() => {
      createDataSource();
    });
  }

  return (
    <div>
      <div>
        <label className="form-label">Connection type</label>
        <OAuth
          isGrpc={false}
          grant_type={options?.grant_type?.value}
          auth_type={options?.auth_type?.value}
          add_token_to={options?.add_token_to?.value}
          header_prefix={options?.header_prefix?.value}
          access_token_url={options?.access_token_url?.value}
          access_token_custom_headers={options?.access_token_custom_headers?.value}
          client_id={options?.client_id?.value}
          client_secret={options?.client_secret?.value}
          client_auth={options?.client_auth?.value}
          scopes={options?.scopes?.value}
          username={options?.username?.value}
          password={options?.password?.value}
          grpc_apiKey_key={options?.grpc_apikey_key?.value}
          grpc_apiKey_value={options?.grpc_apikey_value?.value}
          bearer_token={options?.bearer_token?.value}
          auth_url={options?.auth_url?.value}
          auth_key={options?.auth_key?.value}
          audience={options?.audience?.value}
          custom_auth_params={options?.custom_auth_params?.value}
          custom_query_params={options?.custom_query_params?.value}
          multiple_auth_enabled={options?.multiple_auth_enabled?.value}
          optionchanged={optionchanged}
          workspaceConstants={workspaceConstants}
          isDisabled={isDisabled}
          options={options}
          optionsChanged={optionsChanged}
          selectedDataSource={selectedDataSource}
          oauth_configs={oauth_configs}
        />
      </div>
      {oauth_configs.allowed_scope_field && (
        <div>
          <label className="form-label mt-3">Scope(s)</label>
          <Input
            type="text"
            className="form-control"
            onChange={(e) => optionchanged('scopes', e.target.value)}
            value={scopes}
            workspaceConstants={workspaceConstants}
          />
          {oauth_configs.scopeHelperText?.length > 0 && (
            <span className="text-muted" style={{ fontSize: '12px' }}>
              {oauth_configs.scopeHelperText}
            </span>
          )}
        </div>
      )}
      <div>
        <label className="form-label mt-3">Redirect URI</label>
        <Input
          value={redirectUri}
          helpText={`In ${dataSourceNameCapitalize}, use the URL above when prompted to enter an OAuth callback or redirect URL`}
          type="copyToClipboard"
          disabled="true"
          className="form-control"
        />
      </div>
      {options?.auth_type?.value === 'oauth2' && options?.grant_type?.value === 'authorization_code' && (
        <div>
          <label className="form-check form-switch mt-3">
            <input
              className="form-check-input"
              type="checkbox"
              checked={multiple_auth_enabled}
              onChange={() => optionchanged('multiple_auth_enabled', !multiple_auth_enabled)}
            />
            <div>
              <span className="form-check-label">Authentication required for all users</span>
              <span className="text-muted" style={{ fontSize: '12px' }}>
                User will be redirected to OAuth flow once first query of this data source is run in an app.
              </span>
            </div>
          </label>
        </div>
      )}
      {needConnectionButton && (
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
                className={cx('m2', { 'btn-loading': authStatus === 'waiting_for_url' })}
                disabled={isSaving}
                onClick={() => authorizeWithProvider()}
              >
                {t(
                  `${selectedDataSource.kind}.connect${dataSourceNameCapitalize}`,
                  `Connect to ${dataSourceNameCapitalize}`
                )}
              </Button>
            )}
          </center>
        </div>
      )}
    </div>
  );
};

export default OAuthWrapper;
