import React from 'react';
import 'codemirror/theme/duotone-light.css';
import DOMPurify from 'dompurify';
import Select from '@/_ui/Select';
import { openapiService } from '@/_services';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import { withTranslation } from 'react-i18next';
import defaultStyles from '@/_ui/Select/styles';

const operationColorMapping = {
  get: 'azure',
  post: 'green',
  delete: 'red',
  put: 'yellow',
};

class StripeComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loadingSpec: true,
    };
  }

  componentDidMount() {
    const queryParams = {
      path: this.props.options?.params?.path ?? {},
      query: this.props.options?.params?.query ?? {},
      request: this.props.options?.params?.request ?? {},
    };
    this.setState({
      loadingSpec: true,
      options: {
        ...this.props.options,
        params: queryParams,
      },
    });

    this.fetchOpenApiSpec();
  }

  fetchOpenApiSpec = () => {
    this.setState({ loadingSpec: true });

    openapiService
      .fetchSpecFromUrl('https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json')
      .then((response) => {
        response.text().then((text) => {
          const data = JSON.parse(text);
          this.setState({ specJson: data, loadingSpec: false });
        });
      });
  };

  changeOption(option, value) {
    this.setState({
      options: {
        ...this.state.options,
        [option]: value,
      },
    });
  }

  changeOperation = (value) => {
    const operation = value.split(',')[0];
    const path = value.split(',')[1];

    this.setState(
      {
        options: {
          ...this.state.options,
          path,
          operation,
          selectedOperation: this.state.specJson.paths[path][operation],
        },
      },
      () => {
        this.props.optionsChanged(this.state.options);
      }
    );
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

  renderOperationOption = (props) => {
    const path = props.value;
    const operation = props.label;
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

  computeOperationSelectionOptions = (operationOptions) => {
    let options = [];
    const paths = operationOptions?.paths;

    if (paths) {
      for (const path of Object.keys(paths)) {
        for (const operation of Object.keys(paths[path])) {
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

  selectElementStyles = (darkMode, width = '100%') => {
    return {
      ...defaultStyles(darkMode, width),
      menu: (provided) => ({
        ...provided,
        backgroundColor: darkMode ? '#121212' : '#ffffff',
      }),
      option: (provided) => ({
        ...provided,
        backgroundColor: darkMode ? '#121212' : '#ffffff',
        color: darkMode ? '#697177' : '#889096',
        ':hover': {
          backgroundColor: darkMode ? '#404d66' : '#F1F3F5',
        },
      }),
      placeholder: (provided) => ({
        ...provided,
        color: darkMode ? '#697177' : '#889096',
      }),
      singleValue: (provided) => ({
        ...provided,
        color: darkMode ? '#697177' : '#889096',
      }),
      menuPortal: (provided) => ({ ...provided, zIndex: 2000 }),
    };
  };

  render() {
    const { options, specJson, loadingSpec } = this.state;
    const selectedOperation = options?.selectedOperation;

    let pathParams = [];
    let queryParams = [];
    let requestBody = [];

    if (selectedOperation) {
      if (selectedOperation.parameters) {
        pathParams = selectedOperation.parameters.filter((param) => param.in === 'path');
        queryParams = selectedOperation.parameters.filter((param) => param.in === 'query');
      }

      if (selectedOperation.requestBody) {
        const requestType = Object.keys(selectedOperation.requestBody.content)[0];
        requestBody = selectedOperation.requestBody.content[requestType];
      }
    }

    const currentValue = this.state.options?.operation + ',' + this.props.options?.path ?? null;

    return (
      <div>
        {loadingSpec && (
          <div className="p-3">
            <div className="spinner-border spinner-border-sm text-azure mx-2" role="status"></div>
            {this.props.t('stripe', 'Please wait while we load the OpenAPI specification for Stripe.')}
          </div>
        )}

        {options && !loadingSpec && (
          <div className="mb-3 mt-2">
            <div className="row g-2">
              <div className="col-12">
                <label className="form-label pt-2">{this.props.t('globals.operation', 'Operation')}</label>
              </div>
              <div className="col stripe-operation-options" style={{ width: '90px', marginTop: 0 }}>
                <Select
                  options={this.computeOperationSelectionOptions(specJson)}
                  value={currentValue}
                  onChange={(value) => this.changeOperation(value)}
                  width={'100%'}
                  useMenuPortal={true}
                  customOption={this.renderOperationOption}
                  styles={this.selectElementStyles(this.props.darkMode)}
                />

                {selectedOperation && (
                  <small
                    style={{ margintTop: '10px' }}
                    className="my-2"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedOperation.description) }}
                  />
                )}
              </div>
            </div>

            {selectedOperation && (
              <div className="row mt-2">
                {pathParams.length > 0 && (
                  <div className="mt-2">
                    <h5 className="text-muted">{this.props.t('globals.path', 'PATH')}</h5>
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
                        <span
                          className="btn-sm col-2 mt-2"
                          role="button"
                          onClick={() => this.removeParam('path', param.name)}
                        >
                          <svg
                            width="12"
                            height="13"
                            viewBox="0 0 12 13"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
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
                    <h5 className="text-muted">{this.props.t('globals.query', 'QUERY')}</h5>
                    {queryParams.map((param) => (
                      <div className="row input-group my-1" key={param.name}>
                        <div className="col-4 field field-width-268">
                          <input type="text" value={param.name} className="form-control" placeholder="key" disabled />
                        </div>
                        <div className="col-6 field" style={{ width: '300px' }}>
                          <CodeHinter
                            currentState={this.props.currentState}
                            initialValue={this.state.options.params?.query[param.name] ?? ''}
                            mode="text"
                            placeholder={'value'}
                            theme={this.props.darkMode ? 'monokai' : 'duotone-light'}
                            lineNumbers={false}
                            onChange={(value) => this.changeParam('query', param.name, value)}
                            height={'36px'}
                            width="268px"
                          />
                        </div>
                        <span
                          className="btn-sm col-2 mt-2"
                          role="button"
                          onClick={() => this.removeParam('query', param.name)}
                        >
                          <svg
                            width="12"
                            height="13"
                            viewBox="0 0 12 13"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
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

                {requestBody.schema.properties && (
                  <div className="mt-2">
                    <h5 className="text-muted">{this.props.t('globals.requestBody', 'REQUEST BODY')}</h5>
                    {Object.keys(requestBody.schema.properties).map((param) => (
                      <div className="row input-group my-1" key={param.name}>
                        <div className="col-4 field field-width-268">
                          <input type="text" value={param} className="form-control" placeholder="key" disabled />
                        </div>
                        <div className="col-6 field" style={{ width: '300px' }}>
                          <CodeHinter
                            currentState={this.props.currentState}
                            initialValue={this.state.options.params?.request[param] ?? ''}
                            mode="text"
                            placeholder={'value'}
                            theme={this.props.darkMode ? 'monokai' : 'duotone-light'}
                            lineNumbers={false}
                            onChange={(value) => this.changeParam('request', param, value)}
                            height={'36px'}
                            width="268px"
                          />
                        </div>
                        <span
                          className="btn-sm col-2 mt-2"
                          role="button"
                          onClick={() => this.removeParam('request', param)}
                        >
                          <svg
                            width="12"
                            height="13"
                            viewBox="0 0 12 13"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
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
        )}
      </div>
    );
  }
}

export const Stripe = withTranslation()(StripeComponent);
