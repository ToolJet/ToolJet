import React, { useEffect } from 'react';
import Input from '@/_ui/Input';
import OAuthWrapper from '@/_components/OAuthWrapper';

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
  multiple_auth_enabled,
  currentAppEnvironmentId,
  selectedDataSource,
  workspaceConstants,
  isDisabled,
  isSaving,
  optionsChanged,
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

  /* To populate the fields from the spec */
  useEffect(() => {
    if (authObject && authObject?.flows['authorizationCode']) {
      const { flows, general_scopes } = authObject;
      const { authorizationUrl, tokenUrl } = flows['authorizationCode'];
      optionchanged('access_token_url', tokenUrl);
      setTimeout(() => {
        optionchanged('auth_url', authorizationUrl);
        if (!scopes || scopes.trim === '') {
          optionchanged('scopes', convertScopesToString(general_scopes));
        }
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authObject, grant_type, scopes]);

  const convertScopesToString = (scopes) => {
    let scopes_str = '';
    scopes.map((scope) => {
      scopes_str += scope + ' ';
    });
    return scopes_str;
  };

  if (authObject && !authObject?.flows['authorizationCode']) return null;

  const renderApiKeyField = (auth, index) => {
    if (auth) {
      const value = getCurrentKey(auth.key);
      return (
        <div className="col-md-12" key={index ?? auth.key}>
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
    case 'oauth2':
    case 'bearer':
    case 'basic': {
      return (
        <>
          <OAuthWrapper
            optionchanged={optionchanged}
            options={{
              auth_type: { value: auth_type },
              grant_type: { value: grant_type },
              add_token_to: { value: add_token_to },
              header_prefix: { value: header_prefix },
              access_token_url: { value: access_token_url },
              access_token_custom_headers: { value: access_token_custom_headers },
              client_id: { value: client_id },
              client_secret: { value: client_secret },
              client_auth: { value: client_auth },
              username: { value: username },
              password: { value: password },
              bearer_token: { value: bearer_token },
              auth_url: { value: auth_url },
              custom_auth_params: { value: custom_auth_params },
              custom_query_params: { value: custom_query_params },
              scopes: { value: scopes },
            }}
            isSaving={isSaving}
            selectedDataSource={selectedDataSource}
            workspaceConstants={workspaceConstants}
            isDisabled={isDisabled}
            multiple_auth_enabled={multiple_auth_enabled}
            scopes={scopes}
            currentAppEnvironmentId={currentAppEnvironmentId}
            oauth_configs={{
              allowed_scope_field: true,
              allowed_auth_types: ['oauth2', 'basic', 'bearer'],
              allowed_grant_types: ['authorization_code', 'client_credentials'],
              allowed_field_groups: {
                authorization_code: [
                  'client_id',
                  'client_secret',
                  'auth_url',
                  'access_token_url',
                  'client_auth',
                  'access_token_custom_headers',
                  'custom_query_params',
                  'custom_auth_params',
                  'add_token_to',
                  'header_prefix',
                ],
                client_credentials: [
                  'client_id',
                  'client_secret',
                  'access_token_url',
                  'access_token_custom_headers',
                  'audience',
                ],
                basic: ['username', 'password'],
                bearer: ['bearer_token'],
              },
            }}
            optionsChanged={optionsChanged}
          />
        </>
      );
    }
    default:
      return null;
  }
};

export default OpenapiAuth;
