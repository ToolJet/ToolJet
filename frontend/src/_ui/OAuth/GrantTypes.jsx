import React from 'react';
import Input from '@/_ui/Input';
import Select from '@/_ui/Select';
import Headers from '@/_ui/HttpHeaders';
import EncryptedFieldWrapper from '@/_components/EncyrptedFieldWrapper';
import { checkIfToolJetCloud, checkIfToolJetEE } from '@/_helpers/utils';
import { useAppDataStore } from '@/_stores/appDataStore';
import { shallow } from 'zustand/shallow';

const CommonOAuthFields = ({
  clientConfig,
  tokenConfig,
  authConfig,
  workspaceConfig,
  opt,
  handlers,
  grant_type,
  oauth_configs,
  isFieldAllowed,
}) => {
  const { access_token_url, access_token_custom_headers } = tokenConfig;
  const { client_id, client_secret } = clientConfig;
  const { scopes } = authConfig;
  const { optionchanged, optionsChanged } = handlers;
  const { workspaceConstants } = workspaceConfig;
  const { selectedDataSource, options } = opt;
  const { oauthTypes } = oauth_configs || {};
  const { tooljetVersion } = useAppDataStore(
    (state) => ({
      tooljetVersion: state?.metadata?.installed_version,
    }),
    shallow
  );

  React.useEffect(() => {
    if (oauthTypes?.default_value && !options?.oauth_type?.value) {
      optionchanged('oauth_type', oauthTypes.default_value);
    }
  }, []);

  const oauthTypeOptions = React.useMemo(() => {
    const isCloud = checkIfToolJetCloud(tooljetVersion);

    const allOptions = [
      {
        name: isCloud ? 'ToolJet app' : 'Use environment variables',
        value: 'tooljet_app',
      },
      { name: 'Custom app', value: 'custom_app' },
    ];

    if (oauthTypes?.editions) {
      const currentEdition = isCloud ? 'cloud' : checkIfToolJetEE(tooljetVersion) ? 'ee' : 'ce';

      const allowedValues = oauthTypes.editions[currentEdition] || [];
      return allOptions.filter((option) => allowedValues.includes(option.value));
    } else {
      return allOptions;
    }
  }, [tooljetVersion, oauthTypes]);

  const showClientFields = !oauthTypes || options?.oauth_type?.value === 'custom_app';

  return (
    <>
      {isFieldAllowed('access_token_url', grant_type, oauth_configs) && (
        <div className="col-md-12">
          <label className="form-label mt-3" data-cy="label-access-token-url">
            Access token URL
          </label>
          <Input
            data-cy="access-token-url-input-field"
            type="text"
            placeholder="https://api.example.com/oauth/token"
            className="form-control"
            onChange={(e) => optionchanged('access_token_url', e.target.value)}
            value={access_token_url}
            workspaceConstants={workspaceConstants}
          />
        </div>
      )}
      {isFieldAllowed('access_token_custom_headers', grant_type, oauth_configs) && (
        <>
          <div className="row mt-3">
            <div className="col">
              <label className="form-label pt-2" data-cy="label-access-token-url-custom-headers">
                Access token URL custom headers
              </label>
            </div>
          </div>
          <Headers
            getter={'access_token_custom_headers'}
            options={access_token_custom_headers}
            optionchanged={optionchanged}
            workspaceConstants={workspaceConstants}
            dataCy={'access-token-url-custom-headers'}
          />
        </>
      )}
      {oauthTypes?.required && (
        <div className="col-md-12">
          <label className="form-label mt-3">OAuth type</label>
          <Select
            options={oauthTypeOptions}
            value={options?.oauth_type?.value}
            onChange={(value) => optionchanged('oauth_type', value)}
            width={'100%'}
            useMenuPortal={false}
          />
        </div>
      )}
      {showClientFields && (
        <>
          {isFieldAllowed('client_id', grant_type, oauth_configs) && (
            <div className="col-md-12">
              <label className="form-label mt-3" data-cy="label-client-id">
                Client ID
              </label>
              <Input
                data-cy="client-id-input-field"
                type="text"
                className="form-control"
                onChange={(e) => optionchanged('client_id', e.target.value)}
                value={client_id}
                workspaceConstants={workspaceConstants}
                placeholder="Enter client ID"
              />
            </div>
          )}
          {isFieldAllowed('client_secret', grant_type, oauth_configs) && (
            <div className="col-md-12">
              <EncryptedFieldWrapper
                options={options}
                selectedDataSource={selectedDataSource}
                optionchanged={optionchanged}
                optionsChanged={optionsChanged}
                name="client_secret"
                label="Client secret"
              >
                <Input
                  data-cy="client-secret-input-field"
                  type="password"
                  className="form-control"
                  onChange={(e) => optionchanged('client_secret', e.target.value)}
                  value={client_secret}
                  workspaceConstants={workspaceConstants}
                />
              </EncryptedFieldWrapper>
            </div>
          )}
        </>
      )}
      {isFieldAllowed('scopes', grant_type, oauth_configs) && (
        <div className="col-md-12">
          <label className="form-label mt-3" data-cy="label-scope">
            Scope(s)
          </label>
          <Input
            data-cy="scope-input-field"
            type="text"
            className="form-control"
            onChange={(e) => optionchanged('scopes', e.target.value)}
            value={scopes}
            workspaceConstants={workspaceConstants}
          />
        </div>
      )}
    </>
  );
};

const ClientCredentialsFields = ({ authConfig, workspaceConfig, handlers, oauth_configs, isFieldAllowed }) => {
  const { audience } = authConfig;
  const { optionchanged } = handlers;
  const { workspaceConstants } = workspaceConfig;

  return (
    <>
      {isFieldAllowed('audience', 'client_credentials', oauth_configs) && (
        <div className="col-md-12">
          <label className="form-label mt-3" data-cy="label-audience">
            Audience
          </label>
          <Input
            data-cy="audience-input-field"
            type="text"
            className="form-control"
            onChange={(e) => optionchanged('audience', e.target.value)}
            value={audience}
            workspaceConstants={workspaceConstants}
            placeholder="https://api.example.com/"
          />
        </div>
      )}
    </>
  );
};

const AuthorizationCode = ({
  authConfig,
  clientConfig,
  tokenConfig,
  workspaceConfig,
  handlers,
  oauth_configs,
  isFieldAllowed,
}) => {
  const { optionchanged } = handlers;
  const { workspaceConstants } = workspaceConfig;
  const { custom_query_params, add_token_to, header_prefix } = tokenConfig;
  const { client_auth } = clientConfig;
  const { auth_url, custom_auth_params, multiple_auth_enabled } = authConfig;
  return (
    <>
      {isFieldAllowed('add_token_to', 'authorization_code', oauth_configs) && (
        <div className="col-md-12">
          <label className="form-label mt-3" data-cy="label-add-access-token-to">
            Add access token to
          </label>
          <Select
            options={[{ name: 'Request header', value: 'header' }]}
            value={add_token_to}
            onChange={(value) => optionchanged('add_token_to', value)}
            width={'100%'}
            useMenuPortal={false}
          />
        </div>
      )}
      {add_token_to === 'header' && isFieldAllowed('header_prefix', 'authorization_code', oauth_configs) && (
        <div className="col-md-12">
          <label className="form-label mt-3" data-cy="label-header-prefix">
            Header prefix
          </label>
          <Input
            data-cy="header-prefix-input-field"
            type="text"
            className="form-control"
            onChange={(e) => optionchanged('header_prefix', e.target.value)}
            value={header_prefix}
            workspaceConstants={workspaceConstants}
          />
        </div>
      )}
      {isFieldAllowed('auth_url', 'authorization_code', oauth_configs) && (
        <div className="col-md-12">
          <label className="form-label mt-3" data-cy="label-authorization-url">
            Authorization URL
          </label>
          <Input
            data-cy="authorization-url-input-field"
            type="text"
            placeholder="https://api.example.com/oauth/authorize"
            className="form-control"
            onChange={(e) => optionchanged('auth_url', e.target.value)}
            value={auth_url}
            workspaceConstants={workspaceConstants}
          />
        </div>
      )}
      {isFieldAllowed('custom_auth_params', 'authorization_code', oauth_configs) && (
        <>
          <div className="row mt-3">
            <div className="col">
              <label className="form-label pt-2" data-cy="label-custom-authentication-parameters">
                Custom authentication parameters
              </label>
            </div>
          </div>
          <Headers
            getter={'custom_auth_params'}
            options={custom_auth_params}
            optionchanged={optionchanged}
            workspaceConstants={workspaceConstants}
            dataCy={'custom-authentication-parameters'}
          />
        </>
      )}
      {isFieldAllowed('client_auth', 'authorization_code', oauth_configs) && (
        <div className="col-md-12">
          <label className="form-label mt-3" data-cy="label-client-authentication">
            Client authentication
          </label>
          <Select
            options={[
              { name: 'Send as basic auth header', value: 'header' },
              { name: 'Send client credentials in body ', value: 'body' },
            ]}
            value={client_auth}
            onChange={(value) => optionchanged('client_auth', value)}
            width={'100%'}
            useMenuPortal={false}
          />
        </div>
      )}
      {isFieldAllowed('multiple_auth_enabled', 'authorization_code', oauth_configs) && (
        <div>
          <label className="form-check form-switch my-4">
            <input
              data-cy="authentication-required-for-all-users-toggle-switch"
              className="form-check-input"
              type="checkbox"
              checked={multiple_auth_enabled}
              onChange={() => optionchanged('multiple_auth_enabled', !multiple_auth_enabled)}
            />
            <span className="form-check-label" data-cy="label-authentication-requrired-for-all-users">
              Authentication required for all users
            </span>
          </label>
        </div>
      )}
      {isFieldAllowed('custom_query_params', 'authorization_code', oauth_configs) && (
        <>
          <div className="row mt-3">
            <div className="col">
              <label className="form-label pt-2" data-cy="label-custom-query-parameters">
                Custom query parameters
              </label>
            </div>
          </div>
          <Headers
            getter={'custom_query_params'}
            options={custom_query_params}
            optionchanged={optionchanged}
            workspaceConstants={workspaceConstants}
            dataCy={'custom-query-parameters'}
          />
        </>
      )}
    </>
  );
};

const OAuthConfiguration = ({
  authConfig,
  clientConfig,
  tokenConfig,
  workspaceConfig,
  opt,
  handlers,
  oauth_configs,
  isFieldAllowed,
}) => {
  const { optionchanged } = handlers;
  const { grant_type } = authConfig;
  const { allowed_grant_types } = oauth_configs || {};

  const grantTypeOptions = () => {
    const options = [
      { name: 'Authorization code', value: 'authorization_code' },
      { name: 'Client credentials', value: 'client_credentials' },
    ];

    if (allowed_grant_types && allowed_grant_types.length > 0) {
      return options.filter((option) => allowed_grant_types.includes(option.value));
    }
    return options;
  };

  return (
    <div>
      <div className="row mt-3">
        <label className="form-label" data-cy="label-grant-type">
          Grant type
        </label>
        <Select
          options={grantTypeOptions()}
          value={grant_type}
          onChange={(value) => optionchanged('grant_type', value)}
          width={'100%'}
          useMenuPortal={false}
        />
        <CommonOAuthFields
          clientConfig={clientConfig}
          tokenConfig={tokenConfig}
          authConfig={authConfig}
          workspaceConfig={workspaceConfig}
          opt={opt}
          handlers={handlers}
          oauth_configs={oauth_configs}
          grant_type={grant_type}
          isFieldAllowed={isFieldAllowed}
        />
        {grant_type === 'client_credentials' ? (
          <ClientCredentialsFields
            authConfig={authConfig}
            workspaceConfig={workspaceConfig}
            handlers={handlers}
            oauth_configs={oauth_configs}
            isFieldAllowed={isFieldAllowed}
          />
        ) : (
          <AuthorizationCode
            authConfig={authConfig}
            clientConfig={clientConfig}
            tokenConfig={tokenConfig}
            workspaceConfig={workspaceConfig}
            opt={opt}
            handlers={handlers}
            oauth_configs={oauth_configs}
            isFieldAllowed={isFieldAllowed}
          />
        )}
      </div>
    </div>
  );
};

export default OAuthConfiguration;
