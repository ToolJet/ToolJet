import React, { useEffect, useState } from 'react';
import Select from '@/_ui/Select';
import Textarea from '@/_ui/Textarea';
import { openapiService } from '@/_services';
import OpenapiAuth from './OpenapiAuth';

const OpenApi = ({
  optionchanged,
  format,
  definition,
  auth_type,
  auth_key,
  bearer_token,
  username,
  password,
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
  access_token_custom_headers,
  spec,
  workspaceConstants,
}) => {
  const [securities, setSecurities] = useState([]);
  const [loadingSpec, setLoadingSpec] = useState(false);
  const [selectedAuth, setSelectedAuth] = useState();
  const [validationError, setValidationError] = useState();

  useEffect(() => {
    validateDef();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition, format]);

  useEffect(() => {
    auth_key && getSelectedAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth_key, securities]);

  useEffect(() => {
    spec && setSecurities(resolveSecurities(spec));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec]);

  const validateDef = () => {
    if (definition) {
      setLoadingSpec(true);
      setValidationError(null);
      openapiService
        .parseOpenapiSpec(definition, format)
        .then((result) => {
          optionchanged('spec', result);
          setLoadingSpec(false);
        })
        .catch((err) => {
          setValidationError(err?.message ?? 'Enter valid definition');
          setLoadingSpec(false);
          console.log(err);
        });
    }
  };

  const getCurrentKey = (key, parentKey) => {
    let currentValue;
    if (!api_keys) return '';
    api_keys.map((item) => {
      const itemKey = item['parent_key'] ?? item.parentKey;
      if (parentKey && itemKey === parentKey) {
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

  const resolveSecurities = (spec) => {
    const authArray = [];
    const ApiKeys = [];
    const securities = spec['security'];
    if (securities) {
      const scheme = spec?.components?.securitySchemes;
      securities.map((security) => {
        const authNames = Object.keys(security);
        if (authNames.length > 1) {
          const authObject = [];
          const multipleKeys = { parentKey: authNames[0], fields: [] };
          authNames.map((authName, index) => {
            const auth = scheme[authName];
            if (auth) {
              auth['key'] = authName;
              authObject.push(auth);
              if (auth.type === 'apiKey') {
                multipleKeys.fields.push({ ...auth, value: getCurrentKey(auth.key, authNames[0]) });
                if (authNames.length == index + 1) ApiKeys.push(multipleKeys);
              }
            }
          });
          authObject.length > 0 && authArray.push(authObject);
        } else {
          const authName = authNames[0];
          const auth = scheme[authName];
          if (auth) {
            auth['key'] = authName;
            if (auth.type === 'apiKey') {
              const apiKeyObj = { ...auth, value: getCurrentKey(auth.key) };
              ApiKeys.push(apiKeyObj);
            } else if (auth.type === 'oauth2') {
              const scopes = security[authName];
              auth['general_scopes'] = scopes;
            }
            authArray.push(auth);
          }
        }
      });
    }
    optionchanged('api_keys', ApiKeys);
    return authArray;
  };

  const resolveAuthTypes = (auth) => {
    switch (auth.type) {
      case 'http':
        return {
          name: `${auth.key} (${auth?.scheme?.charAt(0).toUpperCase() + auth?.scheme?.slice(1)})`,
          value: auth.key,
        };
      case 'apiKey':
        return { name: `${auth.key} (API Key)`, value: auth.key };
      case 'oauth2':
        return { name: `${auth.key} (Oauth2)`, value: auth.key };
    }
  };

  const computeAuthOptions = () => {
    const options = [];
    securities.map((auth) => {
      if (Array.isArray(auth)) {
        const resolved = resolveAuthTypes(auth[0]);
        resolved && options.push(resolved);
      } else {
        const resolved = resolveAuthTypes(auth);
        resolved && options.push(resolved);
      }
    });
    return options;
  };

  const getSelectedAuth = () => {
    securities.map((security) => {
      if (Array.isArray(security)) {
        if (security[0].key === auth_key) {
          optionchanged('auth_type', security[0].scheme ?? security[0].type);
          setSelectedAuth(security);
        }
      } else {
        if (security.key === auth_key) {
          setSelectedAuth(security);
          optionchanged('auth_type', security.scheme ?? security.type);
        }
      }
    });
  };

  return (
    <>
      <Select
        options={[
          { name: 'JSON', value: 'json' },
          { name: 'YAML', value: 'yaml' },
        ]}
        value={format}
        onChange={(value) => optionchanged('format', value)}
        width={'100%'}
        useMenuPortal={false}
      />
      <div className="col-md-12">
        <label className="form-label text-muted mt-3">Definition</label>
        <Textarea
          placehlder="Enter spec definition"
          className="form-control"
          rows="14"
          value={definition}
          onChange={(e) => optionchanged('definition', e.target.value)}
          workspaceConstants={workspaceConstants}
        />
      </div>

      {loadingSpec && (
        <div className="p-3">
          {!validationError ? (
            <>
              <div className="spinner-border spinner-border-sm text-azure mx-2" role="status"></div>
              Please wait while we are validating the OpenAPI specification.
            </>
          ) : (
            <span style={{ color: 'red' }}>{validationError}</span>
          )}
        </div>
      )}

      {!loadingSpec && Array.isArray(securities) && securities.length > 0 && (
        <>
          <div className="col-md-12">
            <label className="form-label text-muted mt-3">Authentication</label>
            <Select
              options={computeAuthOptions()}
              value={auth_key}
              onChange={(value) => optionchanged('auth_key', value)}
              width={'100%'}
              useMenuPortal={false}
            />
          </div>

          <OpenapiAuth
            username={username}
            password={password}
            optionchanged={optionchanged}
            bearer_token={bearer_token}
            authObject={selectedAuth}
            api_keys={api_keys}
            add_token_to={add_token_to}
            header_prefix={header_prefix}
            access_token_url={access_token_url}
            grant_type={grant_type}
            custom_auth_params={custom_auth_params}
            custom_query_params={custom_query_params}
            access_token_custom_headers={access_token_custom_headers}
            client_id={client_id}
            client_secret={client_secret}
            client_auth={client_auth}
            scopes={scopes}
            auth_url={auth_url}
            auth_type={auth_type}
          />
        </>
      )}
    </>
  );
};

export default OpenApi;
