// import 'codemirror/theme/duotone-light.css';

import React from 'react';
import { isEmpty, defaults } from 'lodash';
import Tabs from './Tabs';
import Select from '@/_ui/Select';
import { changeOption } from '../utils';
import { BaseUrl } from './BaseUrl';
import { queryManagerSelectComponentStyle } from '@/_ui/Select/styles';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { deepClone } from '@/_helpers/utilities/utils.helpers';

class Restapi extends React.Component {
  constructor(props) {
    super(props);
    const options = defaults(
      { ...props.options },
      {
        headers: [],
        url_params: [],
        body: [],
        json_body: null, // FIXME: Remove this once data migration to raw_body is complete
        raw_body: null,
        body_toggle: false,
        cookies: [],
      }
    );

    this.state = {
      options,
      codeHinterHeight: 32, // Default height
    };
    this.codeHinterRef = React.createRef();
    this.resizeObserver = null;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.options.parameters !== this.props.options.parameters) {
      this.setState({
        options: {
          ...this.state.options,
          parameters: this.props.options.parameters,
        },
      });
    }
    // Setup resize observer if it's not already set up
    if (this.codeHinterRef.current && !this.resizeObserver) {
      this.setupResizeObserver();
    }
  }

  componentDidMount() {
    try {
      if (isEmpty(this.state.options['method'])) {
        changeOption(this, 'method', 'get');
      }
      setTimeout(() => {
        this.initizalizeRetryNetworkErrorsToggle();
      }, 1000);

      this.setupResizeObserver();
    } catch (error) {
      console.log(error);
    }
  }

  componentWillUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  setupResizeObserver() {
    if (!this.codeHinterRef.current) return;

    // Try to find the editor element, checking multiple possible selectors
    const findEditorElement = () => {
      const element =
        this.codeHinterRef.current.querySelector('.cm-editor') ||
        this.codeHinterRef.current.querySelector('.codehinter-input') ||
        this.codeHinterRef.current.querySelector('.code-hinter-wrapper');
      return element;
    };

    // Initial attempt to find editor
    let editorElement = findEditorElement();

    // If not found immediately, try again after a short delay
    if (!editorElement) {
      setTimeout(() => {
        editorElement = findEditorElement();
        if (editorElement) {
          this.setupObserverForElement(editorElement);
        }
      }, 100);
      return;
    }

    this.setupObserverForElement(editorElement);
  }

  setupObserverForElement(element) {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    this.resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const height = Math.max(32, Math.min(entry.contentRect.height, 220));
        if (height !== this.state.codeHinterHeight) {
          this.setState({ codeHinterHeight: height });
        }
      }
    });

    this.resizeObserver.observe(element);
  }

  initizalizeRetryNetworkErrorsToggle = () => {
    const isRetryNetworkErrorToggleUnused = this.props.options.retry_network_errors === null;
    if (isRetryNetworkErrorToggleUnused) {
      const isStaticRestapi = this.props.selectedDataSource.id == 'null';
      if (!isStaticRestapi) {
        console.log('ToggleValue', this.props.selectedDataSource.options.retry_network_errors.value);
      }
      const retryNetworkErrors = isStaticRestapi
        ? true
        : this.props.selectedDataSource.options.retry_network_errors.value;

      changeOption(this, 'retry_network_errors', retryNetworkErrors);
    }
  };

  onBodyToggleChanged = (value) => {
    const { options } = deepClone(this.state);
    options['body_toggle'] = value;
    this.setState({ options }, () => {
      this.props.optionsChanged(options);
    });
  };

  addNewKeyValuePair = (option) => {
    const { options } = this.state;
    const newOptions = { ...options, [option]: [...options[option], ['', '']] };

    this.setState({ options: newOptions }, () => {
      //these values are set to empty array so that user can type in directly without adding new entry, hence no need to pass to parent state
      if (!['headers', 'url_params', 'body', 'cookies'].includes(option)) {
        this.props.optionsChanged(newOptions);
      }
    });
  };

  removeKeyValuePair = (option, index) => {
    const { options } = deepClone(this.state);
    options[option].splice(index, 1);

    this.setState({ options }, () => {
      this.props.optionsChanged({ ...options, arrayValuesChanged: true });
    });
  };

  keyValuePairValueChanged = (value, keyIndex, option, index) => {
    const { options } = deepClone(this.state);
    const prevValue = options[option][index][keyIndex];
    options[option][index][keyIndex] = value;

    this.setState({ options }, () => {
      this.props.optionsChanged({ ...options, arrayValuesChanged: prevValue !== value });
    });
  };

  handleRawBodyChanged = (rawBody) => {
    const { options } = deepClone(this.state);

    // If this is the first time raw_body is set, nullify json_body for data migration
    // FIXME: Remove this if condition once data migration to raw_body is complete
    if (!options['raw_body'] && options['json_body']) {
      options['json_body'] = null;
    }

    options['raw_body'] = rawBody;

    this.setState({ options }, () => {
      this.props.optionsChanged(options);
    });
  };

  handleChange = (key, keyIndex, idx) => (value) => {
    this.keyValuePairValueChanged(value, keyIndex, key, idx);
  };

  handleInputChange = (key, idx) => (value) => {
    if (this.state.options[key].length - 1 === idx && value) {
      this.addNewKeyValuePair(key);
    }
  };

  customSelectStyles = (darkMode, width) => {
    return {
      ...queryManagerSelectComponentStyle(darkMode, width),
      control: (provided) => ({
        ...provided,
        boxShadow: 'none',
        ...(darkMode && { backgroundColor: '#2b3547' }),
        borderRadius: '6px',
        height: 32,
        minHeight: 32,
        borderColor: 'var(--slate7)',
        borderWidth: '1px',
        '&:hover': {
          backgroundColor: darkMode ? '' : '#F8F9FA',
        },
        '&:active': {
          backgroundColor: darkMode ? '' : '#F8FAFF',
          borderColor: '#3E63DD',
          boxShadow: '0px 0px 0px 2px #C6D4F9 ',
        },
        cursor: 'pointer',
      }),
      singleValue: (provided) => ({
        ...provided,
        marginBottom: '3px',
        color: darkMode ? '#fff' : '#11181C',
      }),
      dropdownIndicator: (provided) => ({
        ...provided,
        paddingTop: '4px',
      }),
    };
  };

  render() {
    const { options } = this.state;
    const dataSourceURL = this.props.selectedDataSource?.options?.url?.value;
    const queryName = this.props.queryName;

    const currentValue = { label: options.method?.toUpperCase(), value: options.method };
    return (
      <div className={`${this.props?.queryName !== 'workflowNode' && 'd-flex'} flex-column`}>
        {this.props.selectedDataSource?.scope == 'global' && <div className="form-label flex-shrink-0"></div>}{' '}
        <div className="flex-grow-1 overflow-hidden">
          <div className="rest-api-methods-select-element-container">
            <div className="d-flex">
              <p
                className="text-placeholder font-weight-medium"
                style={{ width: '100px', marginRight: '16px', marginBottom: '0px' }}
              >
                Request
              </p>
            </div>
            <div className="d-flex flex-column w-100">
              <div className="d-flex flex-row">
                <div className={`me-2`} style={{ width: '90px', height: '32px' }}>
                  <label className="font-weight-medium color-slate12">Method</label>
                  <Select
                    options={[
                      { label: 'GET', value: 'get' },
                      { label: 'POST', value: 'post' },
                      { label: 'PUT', value: 'put' },
                      { label: 'PATCH', value: 'patch' },
                      { label: 'DELETE', value: 'delete' },
                    ]}
                    onChange={(value) => {
                      changeOption(this, 'method', value);
                    }}
                    value={currentValue}
                    defaultValue={{ label: 'GET', value: 'get' }}
                    placeholder="Method"
                    width={100}
                    height={32}
                    styles={this.customSelectStyles(this.props.darkMode, 91)}
                    useCustomStyles={true}
                  />
                </div>
<<<<<<< HEAD
                <div className={`field w-100 rest-methods-url`}>
                  <div className="font-weight-medium color-slate12">URL</div>
                  <div className="d-flex">
                    {dataSourceURL && (
                      <BaseUrl theme={this.props.darkMode ? 'monokai' : 'default'} dataSourceURL={dataSourceURL} />
                    )}
                    <div className={`flex-grow-1 rest-api-url-codehinter  ${dataSourceURL ? 'url-input-group' : ''}`}>
=======
                <div
                  className={`field rest-methods-url ${dataSourceURL && 'data-source-exists'}`}
                  style={{ width: 'calc(100% - 214px)' }}
                >
                  <div className="font-weight-medium color-slate12">URL</div>
                  <div className="d-flex h-100 w-100">
                    {dataSourceURL && (
                      <BaseUrl
                        theme={this.props.darkMode ? 'monokai' : 'default'}
                        dataSourceURL={dataSourceURL}
                        style={{
                          overflowWrap: 'anywhere',
                          maxWidth: '40%',
                          width: 'fit-content',
                          height: `${this.state.codeHinterHeight}px`,
                          minHeight: '32px',
                          maxHeight: '220px',
                        }}
                      />
                    )}
                    <div
                      ref={this.codeHinterRef}
                      className={` flex-grow-1 rest-api-url-codehinter ${dataSourceURL ? 'url-input-group' : ''}`}
                    >
>>>>>>> main
                      <CodeHinter
                        type="basic"
                        initialValue={options.url}
                        onChange={(value) => {
                          changeOption(this, 'url', value);
                        }}
                        placeholder={dataSourceURL ? 'Enter request endpoint' : 'Enter request URL'}
                        componentName={`${queryName}::url`}
                        lang="javascript"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className={`query-pane-restapi-tabs`}>
                <Tabs
                  theme={this.props.darkMode ? 'monokai' : 'default'}
                  options={this.state.options}
                  onChange={this.handleChange}
                  onRawBodyChange={this.handleRawBodyChanged}
                  removeKeyValuePair={this.removeKeyValuePair}
                  addNewKeyValuePair={this.addNewKeyValuePair}
                  darkMode={this.props.darkMode}
                  componentName={queryName}
                  bodyToggle={this.state.options.body_toggle}
                  setBodyToggle={this.onBodyToggleChanged}
                  onInputChange={this.handleInputChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export { Restapi };
