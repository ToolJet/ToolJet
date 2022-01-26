import 'codemirror/theme/duotone-light.css';

import React from 'react';
import SelectSearch, { fuzzySearch } from 'react-select-search';
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
    console.log('addNewKeyValuePair', option);
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

    return (
      <div>
        <div className="row mt-2" style={{ height: 'fit-content' }}>
          <div className="col-auto rest-methods-options" style={{ width: '90px' }}>
            <SelectSearch
              options={[
                { name: 'GET', value: 'get' },
                { name: 'POST', value: 'post' },
                { name: 'PUT', value: 'put' },
                { name: 'PATCH', value: 'patch' },
                { name: 'DELETE', value: 'delete' },
              ]}
              value={options.method === '' ? 'get' : options.method}
              search={false}
              closeOnSelect={true}
              onChange={(value) => {
                changeOption(this, 'method', value);
              }}
              filterOptions={fuzzySearch}
              placeholder="Method"
            />
          </div>

          <div className="col field mx-3" style={{ display: 'flex' }}>
            {dataSourceURL && (
              <BaseUrl theme={this.props.darkMode ? 'monokai' : 'default'} dataSourceURL={dataSourceURL} />
            )}
            <div className="col-6 rest-methods-field">
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
                height={'28px'}
              />
            </div>
          </div>
        </div>

        <div className={`query-pane-restapi-tabs mt-3 px-2 ${this.props.darkMode ? 'dark' : ''}`}>
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
