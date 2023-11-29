import React from 'react';
import Input from '@/_ui/Input';
import Select from '@/_ui/Select';
import Headers from '@/_ui/HttpHeaders';

const Authentication = ({
  auth_type,
  access_token_url,
  access_token_custom_headers,
  client_id,
  client_secret,
  client_auth,
  custom_auth_params,
  custom_query_params,
  add_token_to,
  header_prefix,
  grant_type,
  scopes,
  username,
  bearer_token,
  password,
  auth_url,
  multiple_auth_enabled,
  optionchanged,
  workspaceConstants,
}) => {
  if (auth_type === 'oauth2') {
    return (
      <div>
        <hr />
        <h3 className="text-muted">Authentication</h3>
        <div className="row mt-3">
          <label className="form-label text-muted">Grant Type</label>
          <Select
            options={[{ name: 'Authorization Code', value: 'authorization_code' }]}
            value={grant_type}
            onChange={(value) => optionchanged('grant_type', value)}
            width={'100%'}
            useMenuPortal={false}
          />
          <label className="form-label text-muted mt-3">Add Access Token To</label>
          <Select
            options={[{ name: 'Request Header', value: 'header' }]}
            value={add_token_to}
            onChange={(value) => optionchanged('add_token_to', value)}
            width={'100%'}
            useMenuPortal={false}
          />

          {add_token_to === 'header' && (
            <div className="col-md-12">
              <label className="form-label text-muted mt-3">Header Prefix</label>
              <Input
                type="text"
                className="form-control"
                onChange={(e) => optionchanged('header_prefix', e.target.value)}
                value={header_prefix}
                workspaceConstants={workspaceConstants}
              />
            </div>
          )}
        </div>

        <div className="col-md-12">
          <label className="form-label text-muted mt-3">Access Token URL</label>
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
            <label className="form-label pt-2">Access Token URL custom headers</label>
          </div>
        </div>
        <Headers
          getter={'access_token_custom_headers'}
          options={access_token_custom_headers}
          optionchanged={optionchanged}
          workspaceConstants={workspaceConstants}
        />

        <div className="col-md-12">
          <label className="form-label text-muted mt-3">Client ID</label>
          <Input
            type="text"
            className="form-control"
            onChange={(e) => optionchanged('client_id', e.target.value)}
            value={client_id}
            workspaceConstants={workspaceConstants}
          />
        </div>

        <div className="col-md-12">
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
            value={client_secret}
            workspaceConstants={workspaceConstants}
          />
        </div>

        <div className="col-md-12">
          <label className="form-label text-muted mt-3">Scope(s)</label>
          <Input
            type="text"
            className="form-control"
            onChange={(e) => optionchanged('scopes', e.target.value)}
            value={scopes}
            workspaceConstants={workspaceConstants}
          />
        </div>

        <div className="row mt-3">
          <div className="col">
            <label className="form-label pt-2">Custom Query Parameters</label>
          </div>
        </div>
        <Headers
          getter={'custom_query_params'}
          options={custom_query_params}
          optionchanged={optionchanged}
          workspaceConstants={workspaceConstants}
        />

        {grant_type === 'authorization_code' && (
          <div>
            <div className="col-md-12">
              <label className="form-label text-muted mt-3">Authorization URL</label>
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
                <label className="form-label pt-2">Custom Authentication Parameters</label>
              </div>
            </div>
            <Headers
              getter={'custom_auth_params'}
              options={custom_auth_params}
              optionchanged={optionchanged}
              workspaceConstants={workspaceConstants}
            />
            <label className="form-label text-muted mt-3">Client Authentication</label>
            <Select
              options={[
                { name: 'Send as Basic Auth header', value: 'header' },
                { name: 'Send client credentials in body ', value: 'body' },
              ]}
              value={client_auth}
              onChange={(value) => optionchanged('client_auth', value)}
              width={'100%'}
              useMenuPortal={false}
            />
            <label className="form-check form-switch my-4 ">
              <input
                className="form-check-input"
                type="checkbox"
                checked={multiple_auth_enabled}
                onChange={() => optionchanged('multiple_auth_enabled', !multiple_auth_enabled)}
              />
              <span className="form-check-label">Authentication Required for All Users</span>
            </label>
          </div>
        )}
      </div>
    );
  } else if (auth_type === 'basic') {
    return (
      <div>
        <div className="col-md-12">
          <label className="form-label text-muted mt-3">Username</label>
          <Input
            type="text"
            className="form-control"
            onChange={(e) => optionchanged('username', e.target.value)}
            value={username}
            workspaceConstants={workspaceConstants}
          />
        </div>
        <div className="col-md-12">
          <label className="form-label text-muted mt-3">
            Password
            <small className="text-green mx-2">
              <img className="mx-2 encrypted-icon" src="assets/images/icons/padlock.svg" width="12" height="12" />
              Encrypted
            </small>
          </label>
          <Input
            type="password"
            className="form-control"
            onChange={(e) => optionchanged('password', e.target.value)}
            value={password}
            workspaceConstants={workspaceConstants}
          />
        </div>
      </div>
    );
  } else if (auth_type === 'bearer') {
    return (
      <div>
        <div className="col-md-12">
          <label className="form-label text-muted mt-3">
            Token
            <small className="text-green mx-2">
              <img className="mx-2 encrypted-icon" src="assets/images/icons/padlock.svg" width="12" height="12" />
              Encrypted
            </small>
          </label>
          <Input
            type="password"
            className="form-control"
            onChange={(e) => optionchanged('bearer_token', e.target.value)}
            value={bearer_token}
            workspaceConstants={workspaceConstants}
          />
        </div>
      </div>
    );
  } else {
    return null;
  }
};

export default Authentication;
