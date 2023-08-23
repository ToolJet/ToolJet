import React from 'react';
import Input from '@/_ui/Input';
import Oauth from './Oauth';

const OpenapiAuth = ({
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
  auth_type,
  access_token_custom_headers,
}) => {
  const apiKeyChanges = (key, value) => {
    const apiKeys = api_keys ?? [];
    const updatedKeys = apiKeys.map((item) => {
      if (Array.isArray(authObject)) {
        if (item.parentKey === authObject[0].key) {
          item.fields.map((field) => {
            if (field.key === key) {
              field.value = value;
            }
            return field;
          });
        }
      } else {
        if (item.key === key) {
          item.value = value;
        }
      }
      return item;
    });
    optionchanged('api_keys', updatedKeys);
  };

  const getCurrentKey = (key) => {
    let currentValue;
    if (!api_keys) return '';
    api_keys.map((item) => {
      if (Array.isArray(authObject) && item.parentKey === authObject[0].key) {
        item.fields.map((field) => {
          if (field.key === key) {
            currentValue = field.value;
            return;
          }
        });
        if (currentValue) return;
      }
      if (item.key === key) {
        currentValue = item.value;
        return;
      }
    });
    return currentValue;
  };

  const renderApiKeyField = (auth, index) => {
    if (auth) {
      const value = getCurrentKey(auth.key);
      return (
        <div
          className="col-md-12"
          key={index ?? auth.key}
        >
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

  switch (auth_type) {
    case 'basic': {
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
    }
    case 'bearer': {
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
    }
    case 'apiKey': {
      if (Array.isArray(authObject)) {
        return (
          <div>
            {authObject.map((auth, index) => {
              return renderApiKeyField(auth, index);
            })}
          </div>
        );
      } else {
        return renderApiKeyField(authObject);
      }
    }
    case 'oauth2': {
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
          access_token_custom_headers={access_token_custom_headers}
          authObject={authObject}
        />
      );
    }
    default:
      return null;
  }
};

export default OpenapiAuth;
