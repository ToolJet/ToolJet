import React from 'react';
import Input from '@/_ui/Input';
import Select from '@/_ui/Select';
import Headers from '@/_ui/HttpHeaders';

const Authentication = ({
  auth_type,
  access_token_url,
  client_id,
  client_secret,
  client_auth,
  custom_auth_params,
  add_token_to,
  header_prefix,
  grant_type,
  scopes,
  auth_url,
  optionchanged,
}) => {
  if (auth_type !== 'oauth2') return null;

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
        />
        <label className="form-label text-muted mt-3">Add Access Token To</label>
        <Select
          options={[{ name: 'Request Header', value: 'header' }]}
          value={add_token_to}
          onChange={(value) => optionchanged('add_token_to', value)}
        />

        {add_token_to === 'header' && (
          <div className="col-md-12">
            <label className="form-label text-muted mt-3">Header Prefix</label>
            <Input
              type="text"
              className="form-control"
              onChange={(e) => optionchanged('header_prefix', e.target.value)}
              value={header_prefix}
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
        />
      </div>

      <div className="col-md-12">
        <label className="form-label text-muted mt-3">Client ID</label>
        <Input
          type="text"
          className="form-control"
          onChange={(e) => optionchanged('client_id', e.target.value)}
          value={client_id}
        />
      </div>

      <div className="col-md-12">
        <label className="form-label text-muted mt-3">Client Secret</label>
        <Input
          type="text"
          className="form-control"
          onChange={(e) => optionchanged('client_secret', e.target.value)}
          value={client_secret}
        />
      </div>

      <div className="col-md-12">
        <label className="form-label text-muted mt-3">Scope(s)</label>
        <Input
          type="text"
          className="form-control"
          onChange={(e) => optionchanged('scopes', e.target.value)}
          value={scopes}
        />
      </div>

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
            />
          </div>

          <div className="row mt-3">
            <div className="col">
              <label className="form-label pt-2">Custom Authentication Parameters</label>
            </div>
          </div>
          <Headers getter={'custom_auth_params'} options={custom_auth_params} optionchanged={optionchanged} />
          <label className="form-label text-muted mt-3">Client Authentication</label>
          <Select
            options={[
              { name: 'Send as Basic Auth header', value: 'header' },
              { name: 'Send client credentials in body ', value: 'body' },
            ]}
            value={client_auth}
            onChange={(value) => optionchanged('client_auth', value)}
          />
        </div>
      )}
    </div>
  );
};

export default Authentication;
