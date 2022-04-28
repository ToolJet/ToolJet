import React from 'react';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import DOMPurify from 'dompurify';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';

const operationColorMapping = {
  get: 'azure',
  post: 'green',
  delete: 'red',
  put: 'yellow',
  patch: 'orange',
  head: 'blue',
};

class Openapi extends React.Component {
  constructor(props) {
    super(props);
    const { selectedDataSource } = props;
    this.state = {
      options: {
        params: {
          path: {},
          query: {},
          request: {},
          header: {},
        },
      },
      spec: selectedDataSource.options?.spec?.value,
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

  renderOperationOption = (props, option, snapshot, className) => {
    return (
      <button {...props} className={className} type="button">
        <div className="row">
          <div className="col-md-1">
            <span className={`badge bg-${operationColorMapping[option.operation]}`}>{option.operation}</span>
          </div>

          <div className="col-md-8">
            <span className="text-muted mx-2">{option.name}</span>
          </div>
        </div>
      </button>
    );
  };

  renderHostOptions = (props, option, snapshot, className) => {
    return (
      <button {...props} className={className} type="button">
        <div className="row">
          <span className="text-muted mx-2">{option.name}</span>
        </div>
      </button>
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
    } else if (path && this.state.spec.paths[path]['servers'] && this.state.spec?.paths[path]['servers'].length > 0) {
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
      if (this.state.spec.paths[path]['parameters']) {
        const generalParams = this.state.spec.paths[path]['parameters'].filter((param) => param.in === paramType);
        const operationParams = operation.parameters.filter((param) => param.in === paramType);
        const result = generalParams.concat(operationParams).filter(function (o) {
          return this[o.name] ? false : (this[o.name] = true);
        }, {});
        return result;
      }
      return operation.parameters.filter((param) => param.in === paramType);
    } else if (this.state.spec.paths[path]['parameters'])
      return this.state.spec.paths[path]['parameters'].filter((param) => param.in === paramType);
    else return [];
  }

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
        {!spec && <div className="p-3">Valid OpenAPI Spec is not available!.</div>}

        {options && spec && (
          <div className="mb-3 mt-2">
            {baseUrls.length > 0 && (
              <div className="row g-2">
                <div className="col-12">
                  <label className="form-label pt-2">Host</label>
                </div>
                <div className="col openapi-operation-options">
                  <SelectSearch
                    options={this.computeHostOptions(baseUrls)}
                    search={true}
                    value="sv"
                    onChange={(value) => this.changeHost(value)}
                    filterOptions={fuzzySearch}
                    renderOption={this.renderHostOptions}
                    placeholder="Select a host"
                  />
                </div>
              </div>
            )}
            <div className="row g-2">
              <div className="col-12">
                <label className="form-label pt-2">Operation</label>
              </div>
              <div className="col openapi-operation-options">
                <SelectSearch
                  options={this.computeOperationSelectionOptions(spec.paths)}
                  value="sv"
                  search={true}
                  onChange={(value) => this.changeOperation(value)}
                  filterOptions={fuzzySearch}
                  renderOption={this.renderOperationOption}
                  placeholder="Select an operation"
                />

                {selectedOperation && (
                  <small
                    className="openapi-operations-desc"
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
          <div className="row mt-2">
            {headerParams.length > 0 && (
              <div className="mt-2">
                <h5 className="text-muted">HEADER</h5>
                {headerParams.map((param) => (
                  <div className="row input-group my-1" key={param.name}>
                    <div className="col-4 field field-width-268">
                      <input type="text" value={param.name} className="form-control" placeholder="key" />
                    </div>
                    <div className="col-6 field" style={{ width: '300px' }}>
                      <CodeHinter
                        currentState={this.props.currentState}
                        initialValue={this.state.options.params.path[param.name]}
                        mode="text"
                        placeholder={'value'}
                        theme={this.props.darkMode ? 'monokai' : 'duotone-light'}
                        lineNumbers={false}
                        onChange={(value) => this.changeParam('path', param.name, value)}
                        height={'36px'}
                        width="268px"
                      />
                    </div>
                    <span className="btn-sm col-2 mt-2" role="button">
                      <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M5.99931 6.97508L11.0242 12.0014L12 11.027L6.9737 6.00069L12 0.975767L11.0256 0L5.99931 5.0263L0.974388 0L0 0.975767L5.02492 6.00069L0 11.0256L0.974388 12.0014L5.99931 6.97508Z"
                          fill="#8092AC"
                        />
                      </svg>
                    </span>
                  </div>
                ))}
              </div>
            )}

            {pathParams.length > 0 && (
              <div className="mt-2">
                <h5 className="text-muted">PATH</h5>
                {pathParams.map((param) => (
                  <div className="row input-group my-1" key={param.name}>
                    <div className="col-4 field field-width-268">
                      <input type="text" value={param.name} className="form-control" placeholder="key" />
                    </div>
                    <div className="col-6 field" style={{ width: '300px' }}>
                      <CodeHinter
                        currentState={this.props.currentState}
                        initialValue={this.state.options.params.path[param.name]}
                        mode="text"
                        placeholder={'value'}
                        theme={this.props.darkMode ? 'monokai' : 'duotone-light'}
                        lineNumbers={false}
                        onChange={(value) => this.changeParam('path', param.name, value)}
                        height={'36px'}
                        width="268px"
                      />
                    </div>
                    <span className="btn-sm col-2 mt-2" role="button">
                      <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M5.99931 6.97508L11.0242 12.0014L12 11.027L6.9737 6.00069L12 0.975767L11.0256 0L5.99931 5.0263L0.974388 0L0 0.975767L5.02492 6.00069L0 11.0256L0.974388 12.0014L5.99931 6.97508Z"
                          fill="#8092AC"
                        />
                      </svg>
                    </span>
                  </div>
                ))}
              </div>
            )}

            {queryParams.length > 0 && (
              <div className="mt-2">
                <h5 className="text-muted">QUERY</h5>
                {queryParams.map((param) => (
                  <div className="row input-group my-1" key={param.name}>
                    <div className="col-4 field field-width-268">
                      <input type="text" value={param.name} className="form-control" placeholder="key" disabled />
                    </div>
                    <div className="col-6 field" style={{ width: '300px' }}>
                      <CodeHinter
                        currentState={this.props.currentState}
                        initialValue={this.state.options.params.query[param.name]}
                        mode="text"
                        placeholder={'value'}
                        theme={this.props.darkMode ? 'monokai' : 'duotone-light'}
                        lineNumbers={false}
                        onChange={(value) => this.changeParam('query', param.name, value)}
                        height={'36px'}
                        width="268px"
                      />
                    </div>
                    <span className="btn-sm col-2 mt-2" role="button">
                      <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M5.99931 6.97508L11.0242 12.0014L12 11.027L6.9737 6.00069L12 0.975767L11.0256 0L5.99931 5.0263L0.974388 0L0 0.975767L5.02492 6.00069L0 11.0256L0.974388 12.0014L5.99931 6.97508Z"
                          fill="#8092AC"
                        />
                      </svg>
                    </span>
                  </div>
                ))}
              </div>
            )}

            {requestBody?.schema?.properties && (
              <div className="mt-2">
                <h5 className="text-muted">REQUEST BODY</h5>
                {Object.keys(requestBody.schema.properties).map((param) => (
                  <div className="row input-group my-1" key={param}>
                    <div className="col-4 field field-width-268">
                      <input type="text" value={param} className="form-control" placeholder="key" disabled />
                    </div>
                    <div className="col-6 field" style={{ width: '300px' }}>
                      <CodeHinter
                        currentState={this.props.currentState}
                        initialValue={this.state.options.params.request[param]}
                        mode="text"
                        placeholder={'value'}
                        theme={this.props.darkMode ? 'monokai' : 'duotone-light'}
                        lineNumbers={false}
                        onChange={(value) => this.changeParam('request', param, value)}
                        height={'36px'}
                        width="268px"
                      />
                    </div>
                    <span className="btn-sm col-2 mt-2" role="button">
                      <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M5.99931 6.97508L11.0242 12.0014L12 11.027L6.9737 6.00069L12 0.975767L11.0256 0L5.99931 5.0263L0.974388 0L0 0.975767L5.02492 6.00069L0 11.0256L0.974388 12.0014L5.99931 6.97508Z"
                          fill="#8092AC"
                        />
                      </svg>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

export { Openapi };
