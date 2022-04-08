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

  const validateDef = () => {
    if (definition) {
      setLoadingSpec(true);
      setValidationError(null);
      openapiService
        .parseOpenapiSpec(definition, format)
        .then((result) => {
          optionchanged('spec', result);
          setSecurities(resolveSecurities(result));
          setLoadingSpec(false);
        })
        .catch((err) => {
          setValidationError(err?.message ?? 'Enter valid definition');
          console.log(err);
        });
    }
  };

  const getCurrentKey = (key) => {
    let currentValue;
    if (!api_keys) return '';
    Object.entries(api_keys).map((item) => {
      if (item[1].key === key) {
        currentValue = item[1].value;
        return;
      }
    });
    return currentValue;
  };

  const resolveSecurities = (spec) => {
    const authArray = [];
    const ApiKeys = {};
    const securities = spec['security'];
    if (securities) {
      const scheme = spec?.components?.securitySchemes;
      securities.map((security) => {
        const authNames = Object.keys(security);
        if (authNames.length > 1) {
          const authObject = [];
          authNames.map((authName) => {
            const auth = scheme[authName];
            if (auth) {
              auth['key'] = authName;
              authObject.push(auth);
              if (auth.type === 'apiKey') {
                const apiKeyObj = { ...auth, value: getCurrentKey(auth.key) };
                ApiKeys[authName] = apiKeyObj;
              }
            }
          });
          authArray.push(authObject);
        } else {
          const authName = authNames[0];
          const auth = scheme[authName];
          if (auth) {
            auth['key'] = authName;
            if (auth.type === 'apiKey') {
              const apiKeyObj = { ...auth, value: getCurrentKey(auth.key) };
              ApiKeys[authName] = apiKeyObj;
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
          name: `${auth.key} (${auth.scheme.charAt(0).toUpperCase() + auth.scheme.slice(1)})`,
          value: auth.key,
        };
      case 'apiKey':
        return { name: `${auth.key} (API Key)`, value: auth.key };
      case 'oauth2':
        return { name: `${auth.key} (Ouath2)`, value: auth.key };
    }
  };

  const computeAuthOptions = () => {
    const options = [];
    securities.map((auth) => {
      if (Array.isArray(auth)) {
        options.push(resolveAuthTypes(auth[0]));
      } else {
        options.push(resolveAuthTypes(auth));
      }
    });
    return options;
  };

  const getSelectedAuth = () => {
    securities.map((security) => {
      if (Array.isArray(security)) {
        if (security[0].key === auth_key || security[0].key === auth_key) {
          optionchanged('auth_type', security[0].scheme ?? security[0].type);
          setSelectedAuth(security);
        }
      } else {
        if (security.key === auth_key || security.key === auth_key) {
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
      />
      <div className="col-md-12">
        <label className="form-label text-muted mt-3">Definition</label>
        <Textarea
          placehlder="Enter spec definition"
          className="form-control"
          rows="14"
          value={definition}
          onChange={(e) => optionchanged('definition', e.target.value)}
        />
      </div>
      {/* <div className="col-auto text-right">
        <button type="button" className="mt-2 btn btn-success" onClick={() => validateDef()}>
          Validate
        </button>
      </div> */}

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

      {!loadingSpec && securities.length > 0 && (
        <>
          <div className="col-md-12">
            <label className="form-label text-muted mt-3">Authentication</label>
            <Select
              options={computeAuthOptions()}
              value={auth_key}
              onChange={(value) => optionchanged('auth_key', value)}
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
