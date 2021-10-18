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
    return (
      <div>
        <div className="mb-3 mt-2">
          <div className="mb-3">
            <div className="row g-2">
              <div className="col-auto" style={{ width: '120px' }}>
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

              <div className="col" style={{ display: 'flex' }}>
                {dataSourceURL && (
                  <BaseUrl theme={this.props.darkMode ? 'monokai' : 'default'} dataSourceURL={dataSourceURL} />
                )}
                <CodeHinter
                  currentState={this.props.currentState}
                  initialValue={options.url}
                  height="36px"
                  className="codehinter-query-editor-input"
                  theme={this.props.darkMode ? 'monokai' : 'default'}
                  onChange={(value) => {
                    changeOption(this, 'url', value);
                  }}
                  placeholder="Enter request URL"
                />
              </div>
            </div>
          </div>
          <Tabs
            theme={this.props.darkMode ? 'monokai' : 'default'}
            options={this.state.options}
            currentState={this.props.currentState}
            onChange={this.handleChange}
            removeKeyValuePair={this.removeKeyValuePair}
          />
        </div>
      </div>
    );
  }
}

export { Restapi };
