import 'codemirror/theme/duotone-light.css';

import React from 'react';
import { isEmpty, defaults } from 'lodash';
import Tabs from './Tabs';
import Select from '@/_ui/Select';
import { changeOption } from '../utils';
import { CodeHinter } from '../../../CodeBuilder/CodeHinter';
import { BaseUrl } from './BaseUrl';
import defaultStyles from '@/_ui/Select/styles';

class Restapi extends React.Component {
  constructor(props) {
    super(props);
    const options = defaults(
      { ...props.options },
      { headers: [], url_params: [], body: [], json_body: null, body_toggle: false }
    );
    this.state = {
      options,
    };
  }

  componentDidMount() {
    try {
      if (isEmpty(this.state.options['headers'])) {
        this.addNewKeyValuePair('headers', false);
      }
      setTimeout(() => {
        if (isEmpty(this.state.options['url_params'])) {
          this.addNewKeyValuePair('url_params', false);
        }
      }, 1000);
      setTimeout(() => {
        if (isEmpty(this.state.options['body'])) {
          this.addNewKeyValuePair('body', false);
        }
      }, 1000);
    } catch (error) {
      console.log(error);
    }
  }

  onBodyToggleChanged = (value) => {
    const { options } = this.state;
    options['body_toggle'] = value;
    this.setState({ options }, () => {
      this.props.optionsChanged(options);
    });
  };

  addNewKeyValuePair = (option, optionsChanged = true) => {
    const { options } = this.state;
    const newOptions = { ...options, [option]: [...options[option], ['', '']] };

    this.setState({ options: newOptions }, () => {
      optionsChanged && this.props.optionsChanged(newOptions);
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
      prevValue !== value && this.props.optionsChanged({ ...options, arrayValuesChanged: prevValue !== value });
    });
  };

  handleJsonBodyChanged = (jsonBody) => {
    const { options } = this.state;
    options['json_body'] = jsonBody;

    this.setState({ options }, () => {
      this.props.optionsChanged(options);
    });
  };

  handleChange = (key, keyIndex, idx) => (value) => {
    const lastPair = this.state.options[key][idx];
    if (this.state.options[key].length - 1 === idx && (lastPair[0] || lastPair[1])) this.addNewKeyValuePair(key);
    this.keyValuePairValueChanged(value, keyIndex, key, idx);
  };

  selectElementStyles = (darkMode, width = 100) => {
    return {
      ...defaultStyles(darkMode, width),
      menu: (provided) => ({
        ...provided,
        backgroundColor: darkMode ? '#202425' : '##F1F3F5',
      }),
      option: (provided) => ({
        ...provided,
        backgroundColor: darkMode ? '#202425' : '#F1F3F5',
        color: darkMode ? '#ECEDEE' : '#11181C',
        ':hover': {
          backgroundColor: darkMode ? '#404d66' : '#F1F3F5',
        },
      }),
      placeholder: (provided) => ({
        ...provided,
        color: darkMode ? '#ECEDEE' : '#11181C',
      }),
      singleValue: (provided) => ({
        ...provided,
        color: darkMode ? '#ECEDEE' : '#11181C',
      }),
      menuPortal: (provided) => ({ ...provided, zIndex: 2000 }),
    };
  };

  render() {
    const { options } = this.state;
    const dataSourceURL = this.props.selectedDataSource?.options?.url?.value;
    const queryName = this.props.queryName;

    const currentValue = { label: options.method?.toUpperCase(), value: options.method };
    return (
      <div>
        <div className="row" style={{ height: 'fit-content' }}>
          <div className={`col-auto rest-methods-options ${this.props.darkMode && 'dark'}`} style={{ width: '90px' }}>
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
              styles={this.selectElementStyles(this.props.darkMode)}
            />
          </div>

          <div
            className={`col field w-100 rest-methods-url ${this.props.darkMode && 'dark'}`}
            style={{ display: 'flex' }}
          >
            {dataSourceURL && (
              <BaseUrl theme={this.props.darkMode ? 'monokai' : 'default'} dataSourceURL={dataSourceURL} />
            )}
            <div className="col">
              <CodeHinter
                currentState={this.props.currentState}
                initialValue={options.url}
                theme={this.props.darkMode ? 'monokai' : 'default'}
                onChange={(value) => {
                  changeOption(this, 'url', value);
                }}
                placeholder="Enter request URL"
                componentName={`${queryName}::url`}
                mode="javascript"
                lineNumbers={false}
                height={'32px'}
              />
            </div>
          </div>
        </div>

        <div className={`query-pane-restapi-tabs ${this.props.darkMode ? 'dark' : ''}`}>
          <Tabs
            theme={this.props.darkMode ? 'monokai' : 'default'}
            options={this.state.options}
            currentState={this.props.currentState}
            onChange={this.handleChange}
            onJsonBodyChange={this.handleJsonBodyChanged}
            removeKeyValuePair={this.removeKeyValuePair}
            addNewKeyValuePair={this.addNewKeyValuePair}
            darkMode={this.props.darkMode}
            componentName={queryName}
            bodyToggle={this.state.options.body_toggle}
            setBodyToggle={this.onBodyToggleChanged}
          />
        </div>
      </div>
    );
  }
}

export { Restapi };
