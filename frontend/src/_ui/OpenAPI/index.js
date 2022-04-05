import React from 'react';
import Select from '@/_ui/Select';
import Textarea from '@/_ui/Textarea';
import { openapiService } from '@/_services';

const OpenApi = ({ optionchanged, format, definition, auth_type }) => {
  const [securities, setSecurities] = React.useState([]);
  const [loadingSpec, setLoadingSpec] = React.useState(false);

  const validateDef = () => {
    if (definition) {
      setLoadingSpec(true);
      openapiService
        .parseOpenapiSpec(definition, format)
        .then((result) => {
          setSecurities(resolveSecurities(result));
          setLoadingSpec(false);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  const resolveSecurities = (spec) => {
    const authArray = [];
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
            }
          });
          authArray.push(authObject);
        } else {
          const auth = scheme[authNames[0]];
          if (auth) {
            auth['key'] = authNames[0];
            authArray.push(auth);
          }
        }
      });
    }
    return authArray;
  };

  const resolveAuthTypes = (auth) => {
    switch (auth.type) {
      case 'http':
        return { name: auth.scheme.charAt(0).toUpperCase() + auth.scheme.slice(1), value: auth.scheme, key: auth.key };
      case 'apiKey':
        return { name: 'API Key', value: auth.type, key: auth.key };
      case 'oauth2':
        return { name: 'Ouath2', value: auth.type, key: auth.key };
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
      <div className="col-auto text-right">
        <button type="button" className="mt-2 btn btn-success" onClick={() => validateDef()}>
          Validate
        </button>
      </div>

      {loadingSpec && (
        <div className="p-3">
          <div className="spinner-border spinner-border-sm text-azure mx-2" role="status"></div>
          Please wait while we are validating the OpenAPI specification.
        </div>
      )}

      {!loadingSpec && securities.length > 0 && (
        <div className="col-md-12">
          <label className="form-label text-muted mt-3">Authentication</label>
          <Select
            options={computeAuthOptions()}
            value={auth_type}
            onChange={(value) => optionchanged('auth_type', value)}
          />
        </div>
      )}
    </>
  );
};

export default OpenApi;
