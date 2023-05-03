import React from 'react';
import Select from '@/_ui/Select';
import Authentication from '@/_ui/OAuth/Authentication';
import GrpcAuthComponent from './GrpcAuthentication';

const OAuth = ({
  isGrpc = false,
  auth_type,
  grant_type,
  access_token_url,
  access_token_custom_headers,
  client_id,
  client_secret,
  client_auth,
  custom_auth_params,
  custom_query_params,
  scopes,
  username,
  password,
  grpc_apiKey_key,
  grpc_apiKey_value,
  bearer_token,
  auth_url,
  header_prefix,
  add_token_to,
  multiple_auth_enabled,
  optionchanged,
}) => {
  const authOptions = (isGrpc = false) => {
    const options = [
      { name: 'None', value: 'none' },
      { name: 'Basic', value: 'basic' },
      { name: 'Bearer', value: 'bearer' },
    ];

    if (!isGrpc) {
      options.push({ name: 'OAuth 2.0', value: 'oauth2' });
    }

    if (isGrpc) {
      options.push({ name: 'API Key', value: 'api_key' });
    }

    return options;
  };

  const ElementToRender = isGrpc ? GrpcAuthComponent : Authentication;

  return (
    <>
      <Select
        options={authOptions(isGrpc)}
        value={auth_type}
        onChange={(value) => optionchanged('auth_type', value)}
        width={'100%'}
        useMenuPortal={false}
      />
      <ElementToRender
        add_token_to={add_token_to}
        header_prefix={header_prefix}
        access_token_url={access_token_url}
        access_token_custom_headers={access_token_custom_headers}
        auth_type={auth_type}
        grant_type={grant_type}
        optionchanged={optionchanged}
        custom_auth_params={custom_auth_params}
        custom_query_params={custom_query_params}
        client_id={client_id}
        client_secret={client_secret}
        client_auth={client_auth}
        multiple_auth_enabled={multiple_auth_enabled}
        scopes={scopes}
        username={username}
        password={password}
        grpc_apiKey_key={grpc_apiKey_key}
        grpc_apiKey_value={grpc_apiKey_value}
        bearer_token={bearer_token}
        auth_url={auth_url}
      />
    </>
  );
};

export default OAuth;
