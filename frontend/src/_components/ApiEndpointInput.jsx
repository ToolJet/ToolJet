import React, { useEffect, useState } from 'react';
import { openapiService } from '@/_services';
import Select from '@/_ui/Select';
import { queryManagerSelectComponentStyle } from '@/_ui/Select/styles';
import DOMPurify from 'dompurify';
import { ToolTip } from '@/_components';
import { CodeHinter } from '../Editor/CodeBuilder/CodeHinter';
import 'codemirror/theme/duotone-light.css';
import { withTranslation } from 'react-i18next';

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
  };

  const removeParam = (paramType, paramName) => {
    const newOptions = JSON.parse(JSON.stringify(options));
    newOptions['params'][paramType][paramName] = undefined;
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
    const pathGroups = [];
    const paths = specJson?.paths;
    if (paths) {
      for (const path of Object.keys(paths)) {
        for (const operation of Object.keys(paths[path])) {
          const pathGroupCategory = path.split('/')[2];
          const categoryIndex = pathGroups.findIndex((obj) => obj.label === pathGroupCategory);
          if (categoryIndex >= 0) {
            pathGroups[categoryIndex]['options'].push({
              value: `${operation}${path}`,
              label: `${path}`,
              name: path,
              operation: operation,
            });
          } else {
            pathGroups.push({
              label: pathGroupCategory,
              options: [
                {
                  value: `${operation}${path}`,
                  label: `${path}`,
                  name: path,
                  operation: operation,
                },
              ],
            });
          }
        }
      }
    }
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
              {options?.selectedOperation?.parameters?.filter((param) => param.in === 'path').length > 0 && (
                <div
                  className={`path-fields d-flex ${
                    options?.selectedOperation?.parameters?.filter((param) => param.in === 'path').length === 0 &&
                    'd-none'
                  }`}
                >
                  <h5 className="text-heading form-label">{props.t('globals.path', 'PATH')}</h5>
                  <div className="flex-grow-1  input-group-parent-container">
                    {options?.selectedOperation?.parameters
                      ?.filter((param) => param.in === 'path')
                      .map((param) => (
                        <div className="input-group-wrapper" key={param.name}>
                          <div className="input-group">
                            <div className="col-auto d-flex field field-width-179 align-items-center">
                              {param?.description ? (
                                <ToolTip message={param.description}>
                                  <u className="cursor-help">
                                    <input
                                      type="text"
                                      value={param.name}
                                      className="form-control"
                                      placeholder="key"
                                      disabled
                                    />
                                  </u>
                                </ToolTip>
                              ) : (
                                <input
                                  type="text"
                                  value={param.name}
                                  className="form-control"
                                  placeholder="key"
                                  disabled
                                />
                              )}
                              {param.required && <span className="text-danger fw-bold ">*</span>}
                              <div className="p-2 text-muted ">{param.schema?.type?.substring(0, 3).toUpperCase()}</div>
                            </div>
                            <div className="col field overflow-hidden">
                              <CodeHinter
                                initialValue={options.params.path[param.name]}
                                mode="text"
                                placeholder={'Value'}
                                theme={this.props.darkMode ? 'monokai' : 'duotone-light'}
                                lineNumbers={false}
                                onChange={(value) => changeParam('path', param.name, value)}
                                height={'32px'}
                              />
                            </div>
                            <span
                              className="col-auto field-width-28 d-flex"
                              role="button"
                              onClick={() => removeParam('path', param.name)}
                            >
                              <svg
                                width="100%"
                                height="100%"
                                viewBox="0 0 12 13"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  fillRule="evenodd"
                                  clipRule="evenodd"
                                  d="M5.99931 6.97508L11.0242 12.0014L12 11.027L6.9737 6.00069L12 0.975767L11.0256 0L5.99931 5.0263L0.974388 0L0 0.975767L5.02492 6.00069L0 11.0256L0.974388 12.0014L5.99931 6.97508Z"
                                  fill="#11181C"
                                />
                              </svg>
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {options?.selectedOperation?.parameters?.filter((param) => param.in === 'query').length > 0 && (
                <div
                  className={`query-fields d-flex ${
                    options?.selectedOperation?.parameters?.filter((param) => param.in === 'query').length === 0 &&
                    'd-none'
                  }`}
                >
                  <h5 className="text-heading form-label">{props.t('globals.query'.toUpperCase(), 'Query')}</h5>
                  <div className="flex-grow-1 input-group-parent-container">
                    {options?.selectedOperation?.parameters
                      ?.filter((param) => param.in === 'query')
                      .map((param) => (
                        <div className="input-group-wrapper" key={param.name}>
                          <div className="input-group">
                            <div className="col-auto d-flex field field-width-179 align-items-center">
                              {param?.description ? (
                                <ToolTip message={param.description}>
                                  <u className="cursor-help">
                                    <input
                                      type="text"
                                      value={param.name}
                                      className="form-control"
                                      placeholder="key"
                                      disabled
                                    />
                                  </u>
                                </ToolTip>
                              ) : (
                                <input
                                  type="text"
                                  value={param.name}
                                  className="form-control"
                                  placeholder="key"
                                  disabled
                                />
                              )}
                              {param.required && <span className="text-danger fw-bold">*</span>}
                              <div className="p-2 text-muted ">
                                {param?.schema?.anyOf
                                  ? param?.schema?.anyOf.map((type, i) =>
                                      i < param.schema?.anyOf.length - 1
                                        ? type.type.substring(0, 3).toUpperCase() + '|'
                                        : type.type.substring(0, 3).toUpperCase()
                                    )
                                  : param?.schema?.type?.substring(0, 3).toUpperCase()}
                              </div>
                            </div>
                            <div className="col field overflow-hidden">
                              <CodeHinter
                                initialValue={options.params?.query[param.name] ?? ''}
                                mode="text"
                                placeholder={'Value'}
                                theme={props.darkMode ? 'monokai' : 'duotone-light'}
                                lineNumbers={false}
                                onChange={(value) => changeParam('query', param.name, value)}
                                height={'32px'}
                              />
                            </div>
                            <span
                              className="col-auto field-width-28 d-flex"
                              role="button"
                              onClick={() => removeParam('query', param.name)}
                            >
                              <svg
                                width="100%"
                                height="100%"
                                viewBox="0 0 12 13"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  fillRule="evenodd"
                                  clipRule="evenodd"
                                  d="M5.99931 6.97508L11.0242 12.0014L12 11.027L6.9737 6.00069L12 0.975767L11.0256 0L5.99931 5.0263L0.974388 0L0 0.975767L5.02492 6.00069L0 11.0256L0.974388 12.0014L5.99931 6.97508Z"
                                  fill="#11181C"
                                />
                              </svg>
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {options?.selectedOperation?.requestBody?.content[
                Object.keys(options?.selectedOperation?.requestBody?.content)[0]
              ].schema.properties && (
                <div
                  className={`request-body-fields d-flex ${
                    Object.keys(
                      options?.selectedOperation?.requestBody?.content[
                        Object.keys(options?.selectedOperation?.requestBody?.content)[0]
                      ].schema.properties
                    ).length === 0 && 'd-none'
                  } `}
                >
                  <h5 className="text-heading form-label">{props.t('globals.requestBody', 'REQUEST BODY')}</h5>
                  <div
                    className={`flex-grow-1 ${
                      Object.keys(
                        options?.selectedOperation?.requestBody?.content[
                          Object.keys(options?.selectedOperation?.requestBody?.content)[0]
                        ].schema.properties
                      ).length >= 1 && 'input-group-parent-container'
                    }`}
                  >
                    {Object.keys(
                      options?.selectedOperation?.requestBody?.content[
                        Object.keys(options?.selectedOperation?.requestBody?.content)[0]
                      ].schema.properties
                    ).map((param) => (
                      <div className="input-group-wrapper" key={param.name}>
                        <div className="input-group">
                          <div className="col-auto d-flex field field-width-179 align-items-center">
                            {options?.selectedOperation?.requestBody?.content[
                              Object.keys(options?.selectedOperation?.requestBody?.content)[0]
                            ].schema.properties[param]?.['description'] ? (
                              <ToolTip
                                message={DOMPurify.sanitize(
                                  options?.selectedOperation?.requestBody?.content[
                                    Object.keys(options?.selectedOperation?.requestBody?.content)[0]
                                  ].schema.properties[param]['description']
                                )}
                              >
                                <u className="cursor-help">
                                  <input
                                    type="text"
                                    value={param}
                                    className="form-control"
                                    placeholder="key"
                                    disabled
                                  />
                                </u>
                              </ToolTip>
                            ) : (
                              <input type="text" value={param} className="form-control" placeholder="key" disabled />
                            )}
                            {param.required && <span className="text-danger fw-bold">*</span>}
                            <div className="p-2 text-muted ">
                              {options?.selectedOperation?.requestBody?.content[
                                Object.keys(options?.selectedOperation?.requestBody?.content)[0]
                              ]?.schema?.properties?.[param]?.['type']
                                ?.substring(0, 3)
                                .toUpperCase()}
                            </div>
                          </div>

                          <div className="col field overflow-hidden">
                            <CodeHinter
                              initialValue={options.params?.request[param] ?? ''}
                              mode="text"
                              placeholder={'Value'}
                              theme={props.darkMode ? 'monokai' : 'duotone-light'}
                              lineNumbers={false}
                              onChange={(value) => changeParam('request', param, value)}
                              height={'32px'}
                            />
                          </div>
                          <span
                            className="col-auto field-width-28 d-flex"
                            role="button"
                            onClick={() => removeParam('request', param)}
                          >
                            <svg
                              width="100%"
                              height="100%"
                              viewBox="0 0 12 13"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M5.99931 6.97508L11.0242 12.0014L12 11.027L6.9737 6.00069L12 0.975767L11.0256 0L5.99931 5.0263L0.974388 0L0 0.975767L5.02492 6.00069L0 11.0256L0.974388 12.0014L5.99931 6.97508Z"
                                fill="#11181C"
                              />
                            </svg>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default withTranslation()(ApiEndpointInput);
