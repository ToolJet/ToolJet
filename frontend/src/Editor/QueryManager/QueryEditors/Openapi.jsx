import React from 'react';
import Select from '@/_ui/Select';
import DOMPurify from 'dompurify';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import { withTranslation } from 'react-i18next';
import { queryManagerSelectComponentStyle } from '@/_ui/Select/styles';

const operationColorMapping = {
  get: 'azure',
  post: 'green',
  delete: 'red',
  put: 'yellow',
  patch: 'orange',
  head: 'blue',
};

class OpenapiComponent extends React.Component {
  constructor(props) {
    super(props);
    const { selectedDataSource, options } = props;
    this.state = {
      options: {
        params: {
          path: options?.params?.path || {},
          query: options?.params?.query || {},
          request: options?.params?.request || {},
          header: options?.params?.header || {},
        },
        host: options?.host,
        operation: options?.operation,
        path: options?.path,
      },
      spec: selectedDataSource.options?.spec?.value,
      selectedOperation: selectedDataSource.options?.spec?.value?.paths[options?.path]?.[options?.operation] || null,
    };
  }

  changeOperation = (value) => {
    const operation = value.split(',')[0];
    const path = value.split(',')[1];

    this.setState(
      {
        selectedOperation: this.state.spec.paths[path][operation],
        options: {
          ...this.state.options,
          path,
          operation,
        },
      },
      () => {
        this.props.optionsChanged(this.state.options);
      }
    );
  };

  changeHost = (host) => {
    this.setState(
      {
        options: {
          ...this.state.options,
          host,
        },
      },
      () => {
        this.props.optionsChanged(this.state.options);
      }
    );
  };

  renderOperationOption = (props) => {
    const optionName = props.value.split(',')[1];
    const operation = props.label;
    return (
      <div className="row">
        <div className="col-auto" style={{ width: '60px' }}>
          <span className={`badge bg-${operationColorMapping[operation]}`}>{operation}</span>
        </div>

        <div className="col">
          <span>{optionName}</span>
        </div>
      </div>
    );
  };

  renderHostOptions = (props) => {
    return (
      <div className="row">
        <div className="col">
          <span>{props.value}</span>
        </div>
      </div>
    );
  };

  computeOperationSelectionOptions = (paths) => {
    let options = [];

    for (const path of Object.keys(paths)) {
      for (const operation of Object.keys(paths[path])) {
        if (['get', 'post', 'delete', 'put', 'patch', 'head'].includes(operation, 0)) {
          options.push({
            value: `${operation},${path}`,
            name: path,
            operation: operation,
          });
        }
      }
    }

    return options;
  };

  changeParam = (paramType, paramName, value) => {
    const options = this.state.options;
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

    this.setState({
      options: newOptions,
    });

    this.props.optionsChanged(newOptions);
  };

  computeHostOptions = (urlArray) => {
    return urlArray.map((url) => {
      return {
        value: url,
        name: url,
      };
    });
  };

  resolveHosts() {
    const path = this.state.options.path;
    const operation = this.state.selectedOperation;
    if (operation?.servers && operation?.servers.length > 0) {
      const servers = this.state.selectedOperation.servers;
      return servers.map((url) => {
        return url.url;
      });
    } else if (
      path &&
      this.state.spec.paths[path]?.['servers'] &&
      this.state.spec.paths[path]?.['servers'].length > 0
    ) {
      const servers = this.state.spec.paths[path]['servers'];
      return servers.map((url) => {
        return url.url;
      });
    } else {
      const servers = this.state.spec.servers ?? [];
      return servers.map((url) => {
        return url.url;
      });
    }
  }

  resolveParameters(paramType) {
    const operation = this.state.selectedOperation;
    const path = this.state.options.path;

    if (operation.parameters) {
      if (this.state.spec.paths[path]?.['parameters']) {
        const generalParams = this.state.spec.paths[path]['parameters'].filter((param) => param.in === paramType);
        const operationParams = operation.parameters.filter((param) => param.in === paramType);
        const result = generalParams.concat(operationParams).filter(function (o) {
          return this[o.name] ? false : (this[o.name] = true);
        }, {});
        return result;
      }
      return operation.parameters.filter((param) => param.in === paramType);
    } else if (this.state.spec.paths[path]?.['parameters'])
      return this.state.spec.paths[path]['parameters'].filter((param) => param.in === paramType);
    else return [];
  }

  removeParam = (paramType, paramName) => {
    const newOptions = JSON.parse(JSON.stringify(this.state.options));
    newOptions['params'][paramType][paramName] = undefined;

    this.setState(
      {
        options: newOptions,
      },
      () => {
        this.props.optionsChanged(newOptions);
      }
    );
  };

  render() {
    const { options, spec, selectedOperation } = this.state;
    let baseUrls = spec ? this.resolveHosts() : [];
    let pathParams = [];
    let headerParams = [];
    let queryParams = [];
    let requestBody = [];

    if (selectedOperation) {
      pathParams = this.resolveParameters('path');
      queryParams = this.resolveParameters('query');
      headerParams = this.resolveParameters('header');

      if (selectedOperation.requestBody) {
        const requestType = Object.keys(selectedOperation.requestBody.content)[0];
        requestBody = selectedOperation.requestBody.content[requestType];
      }
    }

    return (
      <div>
        {!spec && (
          <div className="p-3">{this.props.t('openApi.noValidOpenApi', 'Valid OpenAPI Spec is not available!.')}</div>
        )}

        {options && spec && (
          <div>
            {baseUrls.length > 0 && (
              <div className="row">
                <div className="col-12">
                  <label className="form-label">{this.props.t('globals.host', 'Host')}</label>
                </div>
                <div className="col openapi-operation-options">
                  <Select
                    options={this.computeHostOptions(baseUrls)}
                    value={this.state.options.host}
                    onChange={this.changeHost}
                    width="100%"
                    customOption={this.renderHostOptions}
                    placeholder={this.props.t('openApi.selectHost', 'Select a host')}
                    styles={queryManagerSelectComponentStyle(this.props.darkMode, '100%')}
                    useCustomStyles={true}
                  />
                </div>
              </div>
            )}
            <div className="row" style={{ marginTop: '20px' }}>
              <div className="col-12">
                <label className="form-label">{this.props.t('globals.operation', 'Operation')}</label>
              </div>
              <div className="col openapi-operation-options">
                <Select
                  options={this.computeOperationSelectionOptions(spec.paths)}
                  value={[this.state.options.operation, this.state.options.path].join(',')}
                  onChange={this.changeOperation}
                  width="100%"
                  customOption={this.renderOperationOption}
                  placeholder={this.props.t('openApi.selectOperation', 'Select an operation')}
                  styles={queryManagerSelectComponentStyle(this.props.darkMode, '100%')}
                  useCustomStyles={true}
                />

                {selectedOperation && (
                  <small
                    className="openapi-operations-desc"
                    style={{ margintTop: '12px' }}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(selectedOperation.description ?? selectedOperation.summary),
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {selectedOperation && (
          <div className={`row openApi-fields-row ${this.props.darkMode && 'theme-dark'}`}>
            {headerParams.length > 0 && (
              <div className={`path-fields `}>
                <h5 className="text-heading">{this.props.t('globals.header', 'HEADER')}</h5>
                <div className="input-group-parent-container">
                  {headerParams.map((param) => (
                    <div className="input-group-wrapper" key={param.name}>
                      <div className="input-group">
                        <div className="col-auto field field-width-179">
                          <input type="text" value={param.name} className="form-control border-0" placeholder="key" />
                        </div>
                        <div className="col field overflow-hidden">
                          <CodeHinter
                            currentState={this.props.currentState}
                            initialValue={this.state.options.params.path[param.name]}
                            mode="text"
                            placeholder={'Value'}
                            theme={this.props.darkMode ? 'monokai' : 'duotone-light'}
                            lineNumbers={false}
                            onChange={(value) => this.changeParam('path', param.name, value)}
                            height={'32px'}
                          />
                        </div>
                        <span
                          className="col-auto field-width-28 d-flex"
                          role="button"
                          onClick={() => this.removeParam('path', param.name)}
                        >
                          <svg
                            width="auto"
                            height="auto"
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

            {pathParams.length > 0 && (
              <div className={`path-fields `}>
                <h5 className="text-heading">{this.props.t('globals.path', 'PATH')}</h5>
                <div className="input-group-parent-container">
                  {pathParams.map((param) => (
                    <div className="input-group-wrapper" key={param.name}>
                      <div className="input-group">
                        <div className="col-auto field field-width-179">
                          <input type="text" value={param.name} className="form-control border-0" placeholder="key" />
                        </div>
                        <div className="col field overflow-hidden">
                          <CodeHinter
                            currentState={this.props.currentState}
                            initialValue={this.state.options.params.path[param.name]}
                            mode="text"
                            placeholder={'Value'}
                            theme={this.props.darkMode ? 'monokai' : 'duotone-light'}
                            lineNumbers={false}
                            onChange={(value) => this.changeParam('path', param.name, value)}
                            height={'32px'}
                          />
                        </div>
                        <span
                          className="col-auto field-width-28 d-flex"
                          role="button"
                          onClick={() => this.removeParam('path', param.name)}
                        >
                          <svg
                            width="auto"
                            height="auto"
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

            {queryParams.length > 0 && (
              <div className={`query-fields `}>
                <h5 className="text-heading">{this.props.t('globals.query'.toUpperCase(), 'QUERY')}</h5>
                <div className="input-group-parent-container">
                  {queryParams.map((param) => (
                    <div className="input-group-wrapper" key={param.name}>
                      <div className="input-group">
                        <div className="col-auto field field-width-179">
                          <input type="text" value={param.name} className="form-control" placeholder="key" disabled />
                        </div>
                        <div className="col field overflow-hidden">
                          <CodeHinter
                            currentState={this.props.currentState}
                            initialValue={this.state.options.params?.query[param.name] ?? ''}
                            mode="text"
                            placeholder={'Value'}
                            theme={this.props.darkMode ? 'monokai' : 'duotone-light'}
                            lineNumbers={false}
                            onChange={(value) => this.changeParam('query', param.name, value)}
                            height={'32px'}
                          />
                        </div>
                        <span
                          className="col-auto field-width-28 d-flex"
                          role="button"
                          onClick={() => this.removeParam('query', param.name)}
                        >
                          <svg
                            width="auto"
                            height="auto"
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

            {requestBody?.schema?.properties && (
              <div className={`request-body-fields  `}>
                <h5 className="text-heading">{this.props.t('globals.requestBody', 'REQUEST BODY')}</h5>
                <div
                  className={`${
                    Object.keys(requestBody.schema.properties).length >= 1 && 'input-group-parent-container'
                  }`}
                >
                  {Object.keys(requestBody.schema.properties).map((param) => (
                    <div className="input-group-wrapper" key={param.name}>
                      <div className="input-group">
                        <div className="col-auto field field-width-179">
                          <input type="text" value={param} className="form-control" placeholder="key" disabled />
                        </div>
                        <div className="col field overflow-hiddel">
                          <CodeHinter
                            currentState={this.props.currentState}
                            initialValue={this.state.options.params?.request[param] ?? ''}
                            mode="text"
                            placeholder={'Value'}
                            theme={this.props.darkMode ? 'monokai' : 'duotone-light'}
                            lineNumbers={false}
                            onChange={(value) => this.changeParam('request', param, value)}
                            height={'32px'}
                          />
                        </div>
                        <span
                          className="col-auto field-width-28 d-flex"
                          role="button"
                          onClick={() => this.removeParam('request', param)}
                        >
                          <svg
                            width="auto"
                            height="auto"
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
    );
  }
}

export const Openapi = withTranslation()(OpenapiComponent);
