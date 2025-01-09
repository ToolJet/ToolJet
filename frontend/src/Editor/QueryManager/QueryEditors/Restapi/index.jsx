// import 'codemirror/theme/duotone-light.css';

import React from 'react';
import { isEmpty, defaults } from 'lodash';
import Tabs from './Tabs';
import Select from '@/_ui/Select';
import { changeOption } from '../utils';
import { BaseUrl } from './BaseUrl';
import { queryManagerSelectComponentStyle } from '@/_ui/Select/styles';
import CodeHinter from '@/Editor/CodeEditor';

class Restapi extends React.Component {
  constructor(props) {
    super(props);
    const options = defaults(
      { ...props.options },
      {
        headers: [['', '']],
        url_params: [],
        body: [],
        json_body: null, // FIXME: Remove this once data migration to raw_body is complete
        raw_body: null,
        body_toggle: false,
        cookies: [['', '']],
      }
    );
    this.state = {
      options,
    };
  }

  componentDidMount() {
    try {
      if (isEmpty(this.state.options['headers'])) {
        this.addNewKeyValuePair('headers');
      }
      if (isEmpty(this.state.options['cookies'])) {
        this.addNewKeyValuePair('cookies');
      }
      if (isEmpty(this.state.options['method'])) {
        changeOption(this, 'method', 'get');
      }
      setTimeout(() => {
        if (isEmpty(this.state.options['url_params'])) {
          this.addNewKeyValuePair('url_params');
        }
      }, 1000);
      setTimeout(() => {
        if (isEmpty(this.state.options['body'])) {
          this.addNewKeyValuePair('body');
        }
      }, 1000);
      setTimeout(() => {
        this.initizalizeRetryNetworkErrorsToggle();
      }, 1000);
    } catch (error) {
      console.log(error);
    }
  }

  initizalizeRetryNetworkErrorsToggle = () => {
    const isRetryNetworkErrorToggleUnused = this.props.options.retry_network_errors === null;
    if (isRetryNetworkErrorToggleUnused) {
      console.log('this.props.selectedDataSourceid: ', this.props.selectedDataSource.id);
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
    const { options } = this.state;
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
    const { options } = this.state;
    options[option].splice(index, 1);

    this.setState({ options }, () => {
      this.props.optionsChanged({ ...options, arrayValuesChanged: true });
    });
  };

  keyValuePairValueChanged = (value, keyIndex, option, index) => {
    const { options } = this.state;
    const prevValue = options[option][index][keyIndex];
    options[option][index][keyIndex] = value;

    this.setState({ options }, () => {
      this.props.optionsChanged({ ...options, arrayValuesChanged: prevValue !== value });
    });
  };

  handleRawBodyChanged = (rawBody) => {
    const { options } = this.state;

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
    const lastPair = this.state.options[key][idx];
    if (this.state.options[key].length - 1 === idx && (lastPair[0] || lastPair[1])) {
      this.addNewKeyValuePair(key);
    }
    this.keyValuePairValueChanged(value, keyIndex, key, idx);
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
      <div className={`${this.props?.queryName !== 'workflowNode' && 'd-flex'}`}>
        {this.props?.queryName !== 'workflowNode' && <div className="form-label flex-shrink-0">Request</div>}
        <div className="flex-grow-1">
          <div className="rest-api-methods-select-element-container">
            <div className={`me-2`} style={{ width: '90px', height: '32px' }}>
              <label className="font-weight-bold color-slate12">Method</label>
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

            <div className={`field w-100 rest-methods-url`}>
              <div className="font-weight-bold color-slate12">URL</div>
              <div className="d-flex">
                {dataSourceURL && (
                  <BaseUrl theme={this.props.darkMode ? 'monokai' : 'default'} dataSourceURL={dataSourceURL} />
                )}
                <div
                  className={`flex-grow-1 rest-api-url-codehinter  ${dataSourceURL ? 'url-input-group' : ''}`}
                  style={{ width: '530px' }}
                >
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
            />
          </div>
        </div>
      </div>
    );
  }
}

export { Restapi };
