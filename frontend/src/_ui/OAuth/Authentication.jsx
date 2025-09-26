import React from 'react';
import Input from '@/_ui/Input';
import EncryptedFieldWrapper from '@/_components/EncyrptedFieldWrapper';
import OAuthConfiguration from './GrantTypes';

const Authentication = ({
  auth_type,
  access_token_url,
  access_token_custom_headers,
  client_id,
  client_secret,
  client_auth,
  audience,
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
  optionsChanged,
  selectedDataSource,
  options,
  oauth_configs,
}) => {
  const isFieldAllowed = (fieldName, key, oauth_configs) => {
    if (!oauth_configs) return true;

    const allowedFields = oauth_configs?.allowed_field_groups?.[key];
    if (!allowedFields || !Array.isArray(allowedFields)) return false;
    return allowedFields.includes(fieldName);
  };

  if (auth_type === 'oauth2') {
    return (
      <div>
        <OAuthConfiguration
          authConfig={{
            auth_url,
            custom_auth_params,
            multiple_auth_enabled,
            scopes,
            audience,
            grant_type,
          }}
          clientConfig={{
            client_id,
            client_secret,
            client_auth,
          }}
          tokenConfig={{
            access_token_url,
            access_token_custom_headers,
            header_prefix,
            add_token_to,
            custom_query_params,
          }}
          workspaceConfig={{
            workspaceConstants,
          }}
          opt={{
            selectedDataSource,
            options,
          }}
          handlers={{
            optionchanged,
            optionsChanged,
          }}
          oauth_configs={oauth_configs}
          isFieldAllowed={isFieldAllowed}
        />
      </div>
    );
  } else if (auth_type === 'basic') {
    return (
      <div>
        {isFieldAllowed('username', auth_type, oauth_configs) && (
          <div className="col-md-12">
            <label className="form-label mt-3" data-cy="label-username">
              Username
            </label>
            <Input
              data-cy="username-input-field"
              type="text"
              className="form-control"
              onChange={(e) => optionchanged('username', e.target.value)}
              value={username}
              workspaceConstants={workspaceConstants}
              placeholder="Username"
            />
          </div>
        )}
        {isFieldAllowed('password', auth_type, oauth_configs) && (
          <div className="col-md-12">
            <EncryptedFieldWrapper
              options={options}
              selectedDataSource={selectedDataSource}
              optionchanged={optionchanged}
              optionsChanged={optionsChanged}
              name="password"
              label="Password"
            >
              <Input
                data-cy="password-input-field"
                type="password"
                className="form-control"
                onChange={(e) => optionchanged('password', e.target.value)}
                value={password}
                workspaceConstants={workspaceConstants}
              />
            </EncryptedFieldWrapper>
          </div>
        )}
      </div>
    );
  } else if (auth_type === 'bearer') {
    return (
      <div>
        <div className="col-md-12">
          <EncryptedFieldWrapper
            options={options}
            selectedDataSource={selectedDataSource}
            optionchanged={optionchanged}
            optionsChanged={optionsChanged}
            name="bearer_token"
            label="Token"
          >
            <Input
              data-cy="token-input-field"
              type="password"
              className="form-control"
              onChange={(e) => optionchanged('bearer_token', e.target.value)}
              value={bearer_token}
              workspaceConstants={workspaceConstants}
            />
          </EncryptedFieldWrapper>
        </div>
      </div>
    );
  } else {
    return null;
  }
};

export default Authentication;
