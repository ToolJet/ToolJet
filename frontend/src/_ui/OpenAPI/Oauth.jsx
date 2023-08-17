import React, { useEffect } from 'react';
import Input from '@/_ui/Input';
import Select from '@/_ui/Select';
import Headers from '@/_ui/HttpHeaders';

const Oauth = ({
  access_token_url,
  auth_url,
  client_id,
  client_secret,
  client_auth,
  custom_auth_params,
  custom_query_params,
  add_token_to,
  header_prefix,
  grant_type,
  scopes,
  authObject,
  optionchanged,
  access_token_custom_headers,
  workspaceConstants,
}) => {
  useEffect(() => {
    if (authObject && authObject?.flows['authorizationCode']) {
      const { flows, general_scopes } = authObject;
      const { authorizationUrl, tokenUrl } = flows['authorizationCode'];
      optionchanged('access_token_url', tokenUrl);
      setTimeout(() => {
        optionchanged('auth_url', authorizationUrl);
        optionchanged('scopes', convertScopesToString(general_scopes));
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authObject, grant_type]);

  const convertScopesToString = (scopes) => {
    let scopes_str = '';
    scopes.map((scope) => {
      scopes_str += scope + ' ';
    });
    return scopes_str;
  };

  if (authObject && !authObject?.flows['authorizationCode']) return null;

  return (
    <div>
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

      <div className="row mt-3">
        <div className="col">
          <label className="form-label pt-2">Access Token URL custom headers</label>
        </div>
      </div>
      <Headers
        getter={'access_token_custom_headers'}
        options={access_token_custom_headers}
        optionchanged={optionchanged}
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
        </div>
      )}
    </div>
  );
};

export default Oauth;
