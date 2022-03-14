import 'codemirror/theme/duotone-light.css';

import React from 'react';
import Select from 'react-select';
import { isEmpty, defaults } from 'lodash';
import Tabs from './Tabs';

import { changeOption } from '../utils';
import { CodeHinter } from '../../../CodeBuilder/CodeHinter';
import { BaseUrl } from './BaseUrl';

class Restapi extends React.Component {
  constructor(props) {
    super(props);
    const options = defaults({ ...props.options }, { headers: [], url_params: [], body: [] });
    this.state = {
      options,
    };
  }

  componentDidMount() {
    try {
      if (isEmpty(this.state.options['headers'])) {
        this.addNewKeyValuePair('headers');
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
    } catch (error) {
      console.log(error);
    }
  }

  addNewKeyValuePair = (option) => {
    const { options } = this.state;
    const newOptions = { ...options, [option]: [...options[option], ['', '']] };

    this.setState({ options: newOptions }, () => {
      this.props.optionsChanged(newOptions);
    });
  };

  removeKeyValuePair = (option, index) => {
    const { options } = this.state;
    options[option].splice(index, 1);

    this.setState({ options }, () => {
      this.props.optionsChanged(options);
    });
  };

  keyValuePairValueChanged = (value, keyIndex, option, index) => {
    const { options } = this.state;

    options[option][index][keyIndex] = value;

    this.setState({ options }, () => {
      this.props.optionsChanged(options);
    });
  };

  handleChange = (key, keyIndex, idx) => (value) => {
    if (this.state.options[key].length - 1 === idx) this.addNewKeyValuePair(key);
    this.keyValuePairValueChanged(value, keyIndex, key, idx);
  };

  render() {
    const { options } = this.state;
    const dataSourceURL = this.props.selectedDataSource?.options?.url?.value;
    const queryName = this.props.queryName;

    const selectStyles = {
      container: (provided) => ({
        ...provided,
        width: 100,
        height: 32,
      }),
      control: (provided) => ({
        ...provided,
        borderColor: 'hsl(0, 0%, 80%)',
        boxShadow: 'none',
        '&:hover': {
          borderColor: 'hsl(0, 0%, 80%)',
        },
        backgroundColor: this.props.darkMode ? '#2b3547' : '#fff',
        height: '32px!important',
        minHeight: '32px!important',
      }),
      valueContainer: (provided, _state) => ({
        ...provided,
        height: 32,
        marginBottom: '4px',
      }),
      indicatorsContainer: (provided, _state) => ({
        ...provided,
        height: 32,
      }),
      indicatorSeparator: (_state) => ({
        display: 'none',
      }),
      input: (provided) => ({
        ...provided,
        color: this.props.darkMode ? '#fff' : '#232e3c',
      }),
      menu: (provided) => ({
        ...provided,
        zIndex: 2,
        backgroundColor: this.props.darkMode ? 'rgb(31,40,55)' : 'white',
      }),
      option: (provided) => ({
        ...provided,
        backgroundColor: this.props.darkMode ? '#2b3547' : '#fff',
        color: this.props.darkMode ? '#fff' : '#232e3c',
        ':hover': {
          backgroundColor: this.props.darkMode ? '#323C4B' : '#d8dce9',
        },
      }),
      placeholder: (provided) => ({
        ...provided,
        color: this.props.darkMode ? '#fff' : '#808080',
      }),
      singleValue: (provided) => ({
        ...provided,
        color: this.props.darkMode ? '#fff' : '#232e3c',
      }),
    };

    const currentValue = { label: options.method?.toUpperCase(), value: options.method };
    return (
      <div>
        <div className="row mt-2" style={{ height: 'fit-content' }}>
          <div className="col-auto rest-methods-options" style={{ width: '90px' }}>
            <Select
              options={[
                { label: 'GET', value: 'get' },
                { label: 'POST', value: 'post' },
                { label: 'PUT', value: 'put' },
                { label: 'PATCH', value: 'patch' },
                { label: 'DELETE', value: 'delete' },
              ]}
              onChange={(object) => {
                changeOption(this, 'method', object.value);
              }}
              value={currentValue}
              defaultValue={{ label: 'GET', value: 'get' }}
              placeholder="Method"
              styles={selectStyles}
              isSearchable={false}
            />
          </div>

          <div className="col field w-100" style={{ display: 'flex', marginLeft: 16 }}>
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

        <div className={`query-pane-restapi-tabs mt-3 ${this.props.darkMode ? 'dark' : ''}`}>
          <Tabs
            theme={this.props.darkMode ? 'monokai' : 'default'}
            options={this.state.options}
            currentState={this.props.currentState}
            onChange={this.handleChange}
            removeKeyValuePair={this.removeKeyValuePair}
            addNewKeyValuePair={this.addNewKeyValuePair}
            darkMode={this.props.darkMode}
            componentName={queryName}
          />
        </div>
      </div>
    );
  }
}

export { Restapi };
