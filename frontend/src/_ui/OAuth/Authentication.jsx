import React from 'react';
import Input from '@/_ui/Input';
import Select from '@/_ui/Select';
import Toggle from '@/_ui/Toggle';
import EncryptedFieldWrapper from '@/_components/EncyrptedFieldWrapper';
import OAuthConfiguration from './GrantTypes';

const AWS_REGIONS = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-northeast-3',
  'ca-central-1',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
  'sa-east-1',
  'me-south-1',
  'af-south-1',
].map((r) => ({ name: r, value: r }));

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
  isDisabled,
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
          <div className="col-md-12" data-cy="username-section">
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
          <div className="col-md-12" data-cy="password-section">
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
        <div className="col-md-12" data-cy="token-section">
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
  } else if (auth_type === 'aws_v4') {
    const useCredentialProviderChain = options?.use_credential_provider_chain?.value ?? false;

    return (
      <div>
        {/* Credential Provider Chain Toggle */}
        <div className="col-md-12 my-3">
          <Toggle
            checked={useCredentialProviderChain}
            onChange={(e) => optionchanged('use_credential_provider_chain', e.target.checked)}
            text="Connect using credential provider chain"
            disabled={isDisabled}
          />
        </div>

        {/* Manual credentials — hidden when chain is enabled */}
        {!useCredentialProviderChain && (
          <>
            <div className="col-md-12 my-2" data-cy="aws-access-key-id-section">
              <EncryptedFieldWrapper
                options={options}
                selectedDataSource={selectedDataSource}
                optionchanged={optionchanged}
                optionsChanged={optionsChanged}
                name="aws_access_key_id"
                label="Access key ID"
              >
                <Input
                  type="text"
                  className="form-control"
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  value={options?.aws_access_key_id?.value || ''}
                  onChange={(e) => optionchanged('aws_access_key_id', e.target.value)}
                  workspaceConstants={workspaceConstants}
                  disabled={isDisabled}
                />
              </EncryptedFieldWrapper>
            </div>

            <div className="col-md-12 my-2" data-cy="aws-secret-access-key-section">
              <EncryptedFieldWrapper
                options={options}
                selectedDataSource={selectedDataSource}
                optionchanged={optionchanged}
                optionsChanged={optionsChanged}
                name="aws_secret_access_key"
                label="Secret access key"
              >
                <Input
                  type="password"
                  className="form-control"
                  value={options?.aws_secret_access_key?.value || ''}
                  onChange={(e) => optionchanged('aws_secret_access_key', e.target.value)}
                  workspaceConstants={workspaceConstants}
                  disabled={isDisabled}
                />
              </EncryptedFieldWrapper>
            </div>
          </>
        )}

        {/* Region — always shown */}
        <div className="col-md-12 my-2" data-cy="aws-region-section">
          <label className="form-label">Region</label>
          <Select
            options={AWS_REGIONS}
            value={options?.aws_region?.value || ''}
            onChange={(value) => optionchanged('aws_region', value)}
            width="100%"
            useMenuPortal={false}
            placeholder="Select region"
            isDisabled={isDisabled}
          />
        </div>

        {/* Service — always shown */}
        <div className="col-md-12 my-2" data-cy="aws-service-section">
          <label className="form-label">Service</label>
          <Input
            type="text"
            className="form-control"
            placeholder="e.g. execute-api, s3, lambda, bedrock"
            value={options?.aws_service?.value || ''}
            onChange={(e) => optionchanged('aws_service', e.target.value)}
            workspaceConstants={workspaceConstants}
            disabled={isDisabled}
          />
        </div>
      </div>
    );
  } else {
    return null;
  }
};

export default Authentication;
