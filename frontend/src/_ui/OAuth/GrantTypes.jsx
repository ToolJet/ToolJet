import React from 'react';
import Input from '@/_ui/Input';
import Select from '@/_ui/Select';
import Headers from '@/_ui/HttpHeaders';
import EncryptedFieldWrapper from '@/_components/EncyrptedFieldWrapper';

const CommonOAuthFields = ({ clientConfig, tokenConfig, authConfig, workspaceConfig, opt, handlers }) => {
  const { access_token_url, access_token_custom_headers } = tokenConfig;
  const { client_id, client_secret } = clientConfig;
  const { scopes } = authConfig;
  const { optionchanged, optionsChanged } = handlers;
  const { workspaceConstants } = workspaceConfig;
  const { selectedDataSource, options } = opt;
  return (
    <>
      <div className="col-md-12">
        <label className="form-label mt-3">Access token URL</label>
        <Input
          type="text"
          placeholder="https://api.example.com/oauth/token"
          className="form-control"
          onChange={(e) => optionchanged('access_token_url', e.target.value)}
          value={access_token_url}
          workspaceConstants={workspaceConstants}
        />
      </div>
      <div className="row mt-3">
        <div className="col">
          <label className="form-label pt-2">Access token URL custom headers</label>
        </div>
      </div>
      <Headers
        getter={'access_token_custom_headers'}
        options={access_token_custom_headers}
        optionchanged={optionchanged}
        workspaceConstants={workspaceConstants}
      />
      <div className="col-md-12">
        <label className="form-label mt-3">Client ID</label>
        <Input
          type="text"
          className="form-control"
          onChange={(e) => optionchanged('client_id', e.target.value)}
          value={client_id}
          workspaceConstants={workspaceConstants}
          placeholder="Enter client ID"
        />
      </div>
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
            type="password"
            className="form-control"
            onChange={(e) => optionchanged('client_secret', e.target.value)}
            value={client_secret}
            workspaceConstants={workspaceConstants}
          />
        </EncryptedFieldWrapper>
      </div>
      <div className="col-md-12">
        <label className="form-label mt-3">Scope(s)</label>
        <Input
          type="text"
          className="form-control"
          onChange={(e) => optionchanged('scopes', e.target.value)}
          value={scopes}
          workspaceConstants={workspaceConstants}
        />
      </div>
    </>
  );
};

const ClientCredentialsFields = ({ authConfig, workspaceConfig, handlers }) => {
  const { audience } = authConfig;
  const { optionchanged } = handlers;
  const { workspaceConstants } = workspaceConfig;

  return (
    <div className="col-md-12">
      <label className="form-label mt-3">Audience</label>
      <Input
        type="text"
        className="form-control"
        onChange={(e) => optionchanged('audience', e.target.value)}
        value={audience}
        workspaceConstants={workspaceConstants}
        placeholder="https://api.example.com/"
      />
    </div>
  );
};

const AuthorizationCode = ({ authConfig, clientConfig, tokenConfig, workspaceConfig, opt, handlers }) => {
  const { optionchanged } = handlers;
  const { workspaceConstants } = workspaceConfig;
  const { custom_query_params, add_token_to, header_prefix } = tokenConfig;
  const { client_auth } = clientConfig;
  const { auth_url, custom_auth_params, multiple_auth_enabled } = authConfig;
  return (
    <>
      <div className="col-md-12">
        <label className="form-label mt-3">Add access token to</label>
        <Select
          options={[{ name: 'Request header', value: 'header' }]}
          value={add_token_to}
          onChange={(value) => optionchanged('add_token_to', value)}
          width={'100%'}
          useMenuPortal={false}
        />
      </div>
      {add_token_to === 'header' && (
        <div className="col-md-12">
          <label className="form-label mt-3">Header prefix</label>
          <Input
            type="text"
            className="form-control"
            onChange={(e) => optionchanged('header_prefix', e.target.value)}
            value={header_prefix}
            workspaceConstants={workspaceConstants}
          />
        </div>
      )}
      <div className="col-md-12">
        <label className="form-label mt-3">Authorization URL</label>
        <Input
          type="text"
          placeholder="https://api.example.com/oauth/authorize"
          className="form-control"
          onChange={(e) => optionchanged('auth_url', e.target.value)}
          value={auth_url}
          workspaceConstants={workspaceConstants}
        />
      </div>
      <div className="row mt-3">
        <div className="col">
          <label className="form-label pt-2">Custom authentication parameters</label>
        </div>
      </div>
      <Headers
        getter={'custom_auth_params'}
        options={custom_auth_params}
        optionchanged={optionchanged}
        workspaceConstants={workspaceConstants}
      />
      <div className="col-md-12">
        <label className="form-label mt-3">Client authentication</label>
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
      <div>
        <label className="form-check form-switch my-4">
          <input
            className="form-check-input"
            type="checkbox"
            checked={multiple_auth_enabled}
            onChange={() => optionchanged('multiple_auth_enabled', !multiple_auth_enabled)}
          />
          <span className="form-check-label">Authentication required for all users</span>
        </label>
      </div>
      <div className="row mt-3">
        <div className="col">
          <label className="form-label pt-2">Custom query parameters</label>
        </div>
      </div>
      <Headers
        getter={'custom_query_params'}
        options={custom_query_params}
        optionchanged={optionchanged}
        workspaceConstants={workspaceConstants}
      />
    </>
  );
};

const OAuthConfiguration = ({ authConfig, clientConfig, tokenConfig, workspaceConfig, opt, handlers }) => {
  const { optionchanged } = handlers;
  const { grant_type } = authConfig;
  return (
    <div>
      <div className="row mt-3">
        <label className="form-label">Grant type</label>
        <Select
          options={[
            { name: 'Authorization code', value: 'authorization_code' },
            { name: 'Client credentials', value: 'client_credentials' },
          ]}
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
        />
        {grant_type === 'client_credentials' ? (
          <ClientCredentialsFields authConfig={authConfig} workspaceConfig={workspaceConfig} handlers={handlers} />
        ) : (
          <AuthorizationCode
            authConfig={authConfig}
            clientConfig={clientConfig}
            tokenConfig={tokenConfig}
            workspaceConfig={workspaceConfig}
            opt={opt}
            handlers={handlers}
          />
        )}
      </div>
    </div>
  );
};

export default OAuthConfiguration;
