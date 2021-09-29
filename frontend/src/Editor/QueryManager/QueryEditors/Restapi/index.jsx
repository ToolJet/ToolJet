import 'codemirror/theme/duotone-light.css';

import React from 'react';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { isEmpty, defaults } from 'lodash';
import Tabs from './Tabs';

import { changeOption } from '../utils';
import { CodeHinter } from '../../../CodeBuilder/CodeHinter';

function getAllUrlParams(url) {
  var queryString = url.split('?')[1];
  var obj = {};
  if (queryString) {
    // queryString = queryString.split('#')[0];
    var arr = queryString.split('&');

    for (var i = 0; i < arr.length; i++) {
      var a = arr[i].split('=');

      var paramName = a[0];
      var paramValue = typeof a[1] === 'undefined' ? true : a[1];
      paramName = paramName.toLowerCase();
      if (typeof paramValue === 'string') paramValue = paramValue.toLowerCase();

      if (paramName.match(/\[(\d+)?\]$/)) {
        var key = paramName.replace(/\[(\d+)?\]/, '');
        if (!obj[key]) obj[key] = [];

        if (paramName.match(/\[\d+\]$/)) {
          var index = /\[(\d+)\]/.exec(paramName)[1];
          obj[key][index] = paramValue;
        } else {
          obj[key].push(paramValue);
        }
      } else {
        if (!obj[paramName]) {
          obj[paramName] = paramValue;
        } else if (obj[paramName] && typeof obj[paramName] === 'string') {
          obj[paramName] = [obj[paramName]];
          obj[paramName].push(paramValue);
        } else {
          obj[paramName].push(paramValue);
        }
      }
    }
  }

  return Object.keys(obj).map((key) => [key, obj[key]]);
}

class Restapi extends React.Component {
  constructor(props) {
    super(props);
    const options = defaults({ ...props.options }, { headers: [], url_params: [], body: [] });
    this.state = {
      options,
    };
  }

  componentDidMount() {
    console.log('component mounted 👀');
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

  // console.log(`handle change  RESTAPI 🥶 || key ${key} :: keyIndex ${keyIndex} :: idx ${idx} :: value ${value} }`);
  handleChange = (key, keyIndex, idx) => (value) => {
    if (this.state.options[key].length - 1 === idx && keyIndex === 1 && value.length > 0) this.addNewKeyValuePair(key);
    this.keyValuePairValueChanged(value, keyIndex, key, idx);
  };

  getParamsFromUrl = (url) => {
    const { options } = this.state;
    if (url.length === 0) {
      options['url_params'] = [];
      return this.setState({ options }, () => {
        this.props.optionsChanged(options);
      });
    } else {
      const params = getAllUrlParams(url);

      if (params.length > 0) {
        options['url_params'] = [];
      }
      params.map((option) => {
        options['url_params'].push(option);
      });

      options['url_params'].push([]);
      this.setState({ options }, () => {
        this.props.optionsChanged(options);
      });
    }
  };

  render() {
    const { options } = this.state;
    const dataSourceURL = this.props.selectedDataSource?.options?.url?.value;
    console.log('__OPTIONS__', JSON.stringify(options));
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
                  <span
                    htmlFor=""
                    style={{
                      padding: '7px',
                      border: '1px solid rgb(217 220 222)',
                      background: 'rgb(246 247 251)',
                      color: '#9ca1a6',
                      marginRight: '-3px',
                      borderTopLeftRadius: '3px',
                      borderBottomLeftRadius: '3px',
                      zIndex: 1,
                    }}
                  >
                    {dataSourceURL}
                  </span>
                )}
                <CodeHinter
                  currentState={this.props.currentState}
                  initialValue={options.url}
                  height="36px"
                  className="codehinter-query-editor-input"
                  theme={this.props.darkMode ? 'monokai' : 'default'}
                  onChange={(value) => {
                    changeOption(this, 'url', value);
                    this.getParamsFromUrl(value);
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
