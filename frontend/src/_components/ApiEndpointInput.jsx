import React, { useEffect, useState } from 'react';
import { openapiService } from '@/_services';
import Select from '@/_ui/Select';
import { queryManagerSelectComponentStyle } from '@/_ui/Select/styles';
import DOMPurify from 'dompurify';
import { ToolTip } from '@/_components';
import { CodeHinter } from '../Editor/CodeBuilder/CodeHinter';
import 'codemirror/theme/duotone-light.css';
import { withTranslation } from 'react-i18next';
import { isEmpty } from 'lodash';
import PropTypes from 'prop-types';

const operationColorMapping = {
  get: 'azure',
  post: 'green',
  delete: 'red',
  put: 'yellow',
};

const ApiEndpointInput = (props) => {
  const [loadingSpec, setLoadingSpec] = useState(true);
  const [options, setOptions] = useState(props.options);
  const [specJson, setSpecJson] = useState(null);

  const fetchOpenApiSpec = () => {
    setLoadingSpec(true);
    openapiService
      .fetchSpecFromUrl(props.specUrl)
      .then((response) => response.text())
      .then((text) => {
        const data = JSON.parse(text);
        setSpecJson(data);
        setLoadingSpec(false);
      });
  };

  const changeOperation = (value) => {
    const operation = value.split('/', 2)[0];
    const path = value.substring(value.indexOf('/'));
    const newOptions = { ...options, path, operation, selectedOperation: specJson.paths[path][operation] };
    setOptions(newOptions);
    props.optionsChanged(newOptions);
  };

  const changeParam = (paramType, paramName, value) => {
    if (value === '') {
      removeParam(paramType, paramName);
    } else {
      const newOptions = {
        ...options,
        params: {
          ...options.params,
          [paramType]: {
            ...options.params[paramType],
            [paramName]: value,
          },
        },
      };
      setOptions(newOptions);
      props.optionsChanged(newOptions);
    }
  };

  const removeParam = (paramType, paramName) => {
    const newOptions = JSON.parse(JSON.stringify(options));
    delete newOptions['params'][paramType][paramName];
    setOptions(newOptions);
    props.optionsChanged(newOptions);
  };

  const renderOperationOption = (data) => {
    const path = data.value;
    const operation = data.operation;
    if (path && operation) {
      return (
        <div className="row">
          <div className="col-auto" style={{ width: '60px' }}>
            <span className={`badge bg-${operationColorMapping[operation]}`}>{operation}</span>
          </div>
          <div className="col">
            <span>{path}</span>
          </div>
        </div>
      );
    } else {
      return 'Select an operation';
    }
  };

  const computeOperationSelectionOptions = () => {
    const paths = specJson?.paths;
    if (isEmpty(paths)) return [];

    const pathGroups = Object.keys(paths).reduce((acc, path) => {
      const operations = Object.keys(paths[path]);
      const category = path.split('/')[2];
      operations.forEach((operation) => {
        const option = {
          value: `${operation}${path}`,
          label: `${path}`,
          name: path,
          operation: operation,
        };
        const existingCategory = acc.find((obj) => obj.label === category);
        if (existingCategory) {
          existingCategory.options.push(option);
        } else {
          acc.push({
            label: category,
            options: [option],
          });
        }
      });
      return acc;
    }, []);

    return pathGroups;
  };

  useEffect(() => {
    const queryParams = {
      path: props.options?.params?.path ?? {},
      query: props.options?.params?.query ?? {},
      request: props.options?.params?.request ?? {},
    };
    setLoadingSpec(true);
    setOptions({ ...props.options, params: queryParams });
    fetchOpenApiSpec();
  }, []);

  return (
    <div>
      {loadingSpec && (
        <div className="p-3">
          <div className="spinner-border spinner-border-sm text-azure mx-2" role="status"></div>
          {props.t('stripe', 'Please wait while we load the OpenAPI specification.')}
        </div>
      )}
      {options && !loadingSpec && (
        <div>
          <div className="d-flex g-2">
            <div className="col-12 form-label">
              <label className="form-label">{props.t('globals.operation', 'Operation')}</label>
            </div>
            <div className="col stripe-operation-options flex-grow-1" style={{ width: '90px', marginTop: 0 }}>
              <Select
                options={computeOperationSelectionOptions()}
                value={{
                  operation: options?.operation,
                  value: options?.path,
                }}
                onChange={(value) => changeOperation(value)}
                width={'100%'}
                useMenuPortal={true}
                customOption={renderOperationOption}
                styles={queryManagerSelectComponentStyle(props.darkMode, '100%')}
                useCustomStyles={true}
              />
              {options?.selectedOperation && (
                <small
                  style={{ margintTop: '10px' }}
                  className="my-2"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(options?.selectedOperation?.description) }}
                />
              )}
            </div>
          </div>
          {options?.selectedOperation && (
            <div className={`row stripe-fields-row ${props.darkMode && 'theme-dark'}`}>
              <RenderParameterFields
                parameters={options?.selectedOperation?.parameters}
                type="path"
                label={props.t('globals.path', 'PATH')}
                options={options}
                changeParam={changeParam}
                removeParam={removeParam}
                darkMode={props.darkMode}
              />
              <RenderParameterFields
                parameters={options?.selectedOperation?.parameters}
                type="query"
                label={props.t('globals.query'.toUpperCase(), 'Query')}
                options={options}
                changeParam={changeParam}
                removeParam={removeParam}
                darkMode={props.darkMode}
              />
              <RenderParameterFields
                parameters={
                  options?.selectedOperation?.requestBody?.content[
                    Object.keys(options?.selectedOperation?.requestBody?.content)[0]
                  ]?.schema?.properties ?? {}
                }
                type="request"
                label={props.t('globals.requestBody', 'REQUEST BODY')}
                options={options}
                changeParam={changeParam}
                removeParam={removeParam}
                darkMode={props.darkMode}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default withTranslation()(ApiEndpointInput);

ApiEndpointInput.propTypes = {
  options: PropTypes.object,
  specUrl: PropTypes.string,
  optionsChanged: PropTypes.func,
  darkMode: PropTypes.bool,
  t: PropTypes.func,
};

const RenderParameterFields = ({ parameters, type, label, options, changeParam, removeParam, darkMode }) => {
  let filteredParams;
  if (type === 'request') {
    filteredParams = Object.keys(parameters);
  } else {
    filteredParams = parameters?.filter((param) => param.in === type);
  }
  console.log('filteredParams', type, parameters, filteredParams);
  return (
    filteredParams?.length > 0 && (
      <div className={`${type === 'request' ? 'request-body' : type}-fields d-flex`}>
        <h5 className="text-heading form-label">{label}</h5>
        <div className="flex-grow-1 input-group-parent-container">
          {filteredParams.map((param) => (
            <div className="input-group-wrapper" key={type === 'request' ? param : param.name}>
              <div className="input-group">
                <div className="col-auto d-flex field field-width-179 align-items-center">
                  {(type === 'request' && parameters[param].description) || param?.description ? (
                    <ToolTip
                      message={
                        type === 'request' ? DOMPurify.sanitize(parameters[param].description) : param.description
                      }
                    >
                      <div className="cursor-help">
                        <input
                          type="text"
                          value={type === 'request' ? param : param.name}
                          className="form-control form-control-underline"
                          placeholder="key"
                          disabled
                        />
                      </div>
                    </ToolTip>
                  ) : (
                    <input
                      type="text"
                      value={type === 'request' ? param : param.name}
                      className="form-control"
                      placeholder="key"
                      disabled
                    />
                  )}
                  {param.required && <span className="text-danger fw-bold">*</span>}
                  <div className="p-2 text-muted">
                    {type === 'query' &&
                      param?.schema?.anyOf &&
                      param?.schema?.anyOf.map((type, i) =>
                        i < param.schema?.anyOf.length - 1
                          ? type.type.substring(0, 3).toUpperCase() + '|'
                          : type.type.substring(0, 3).toUpperCase()
                      )}
                    {(type === 'path' || (type === 'query' && !param?.schema?.anyOf)) &&
                      param?.schema?.type?.substring(0, 3).toUpperCase()}
                    {type === 'request' && parameters[param].type?.substring(0, 3).toUpperCase()}
                  </div>
                </div>
                <div className="col field overflow-hidden code-hinter-borderless">
                  <CodeHinter
                    initialValue={
                      (type === 'request' ? options?.params[type][param] : options?.params[type][param.name]) ?? ''
                    }
                    mode="text"
                    placeholder={'Value'}
                    theme={darkMode ? 'monokai' : 'duotone-light'}
                    lineNumbers={false}
                    onChange={(value) => {
                      if (type === 'request') {
                        changeParam(type, param, value);
                      } else {
                        changeParam(type, param.name, value);
                      }
                    }}
                    height={'32px'}
                  />
                </div>
                {((type === 'request' && options['params'][type][param]) || options['params'][type][param.name]) && (
                  <span
                    className="code-hinter-clear-btn"
                    role="button"
                    onClick={() => {
                      if (type === 'request') {
                        removeParam(type, param);
                      } else {
                        removeParam(type, param.name);
                      }
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M5 1.66675H15C16.8409 1.66675 18.3333 3.15913 18.3333 5.00008V15.0001C18.3333 16.841 16.8409 18.3334 15 18.3334H5C3.15905 18.3334 1.66666 16.841 1.66666 15.0001V5.00008C1.66666 3.15913 3.15905 1.66675 5 1.66675ZM12.799 7.20116C13.043 7.44524 13.043 7.84096 12.799 8.08504L10.8839 10.0001L12.799 11.9151C13.043 12.1592 13.043 12.5549 12.799 12.799C12.5549 13.0431 12.1592 13.0431 11.9151 12.799L10 10.884L8.08492 12.7991C7.84084 13.0432 7.44511 13.0432 7.20104 12.7991C6.95696 12.555 6.95696 12.1593 7.20104 11.9152L9.11617 10.0001L7.20104 8.08495C6.95697 7.84087 6.95697 7.44515 7.20104 7.20107C7.44512 6.95699 7.84085 6.95699 8.08493 7.20107L10 9.11619L11.9151 7.20116C12.1592 6.95708 12.5549 6.95708 12.799 7.20116Z"
                        fill="#ACB2B9"
                      />
                    </svg>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  );
};

RenderParameterFields.propTypes = {
  parameters: PropTypes.any,
  type: PropTypes.string,
  label: PropTypes.string,
  options: PropTypes.object,
  changeParam: PropTypes.func,
  removeParam: PropTypes.func,
  darkMode: PropTypes.bool,
};
