import React from 'react';
import Input from '@/_ui/Input';
import Oauth from './Oauth';

const OpenapiAuth = ({
  auth_type,
  username,
  password,
  bearer_token,
  optionchanged,
  authObject,
  api_keys,
  access_token_url,
  client_id,
  client_secret,
  client_auth,
  custom_auth_params,
  custom_query_params,
  add_token_to,
  header_prefix,
  grant_type,
  scopes,
  auth_url,
}) => {
  const apiKeyChanges = (key, value) => {
    const obj = api_keys ?? {};
    obj[key].value = value;
    optionchanged('api_keys', obj);
  };

  const renderApiKeyField = (auth) => {
    if (auth) {
      const value = api_keys[auth.key]?.value ?? '';
      return (
        <div className="col-md-12">
          <label className="form-label text-muted mt-3">{auth.key}</label>
          <Input
            type="text"
            className="form-control"
            onChange={(e) => apiKeyChanges(auth.key, e.target.value)}
            value={value}
          />
        </div>
      );
    } else return null;
  };

  if (auth_type === 'basic') {
    return (
      <div>
        <div className="col-md-12">
          <label className="form-label text-muted mt-3">Username</label>
          <Input
            type="text"
            className="form-control"
            onChange={(e) => optionchanged('username', e.target.value)}
            value={username}
          />
        </div>
        <div className="col-md-12">
          <label className="form-label text-muted mt-3">Password</label>
          <Input
            type="text"
            className="form-control"
            onChange={(e) => optionchanged('password', e.target.value)}
            value={password}
          />
        </div>
      </div>
    );
  } else if (auth_type === 'bearer') {
    return (
      <div>
        <div className="col-md-12">
          <label className="form-label text-muted mt-3">Token</label>
          <Input
            type="text"
            className="form-control"
            onChange={(e) => optionchanged('bearer_token', e.target.value)}
            value={bearer_token}
          />
        </div>
      </div>
    );
  } else if (auth_type === 'apiKey') {
    if (Array.isArray(authObject)) {
      return (
        <div>
          {authObject.map((auth) => {
            return renderApiKeyField(auth);
          })}
        </div>
      );
    } else {
      return renderApiKeyField(authObject);
    }
  } else if (auth_type === 'oauth2') {
    return (
      <Oauth
        add_token_to={add_token_to}
        header_prefix={header_prefix}
        access_token_url={access_token_url}
        grant_type={grant_type}
        optionchanged={optionchanged}
        custom_auth_params={custom_auth_params}
        custom_query_params={custom_query_params}
        client_id={client_id}
        client_secret={client_secret}
        client_auth={client_auth}
        scopes={scopes}
        auth_url={auth_url}
        authObject={authObject}
      />
    );
  } else {
    return null;
  }
};

export default OpenapiAuth;
