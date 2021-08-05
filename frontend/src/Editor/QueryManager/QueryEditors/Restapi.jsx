import React from 'react';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import 'codemirror/theme/duotone-light.css';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { changeOption } from './utils';

class Restapi extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      options: this.props.options,
    };
  }

  componentDidMount() {
    this.setState({
      options: this.props.options,
    });
  }

  addNewKeyValuePair = (option) => {
    const { options } = this.state;
    const newOptions = { ...options, [option]: [...options[option], ['', '']] };

    this.setState({
      options: newOptions,
    });
    this.props.optionsChanged(newOptions);
  };

  removeKeyValuePair = (option, index) => {
    const { options } = this.state;
    options[option].splice(index, 1);

    this.setState({ options });
    this.props.optionsChanged(options);
  };

  keyValuePairValueChanged = (value, keyIndex, option, index) => {
    const { options } = this.state;

    options[option][index][keyIndex] = value;

    this.setState({ options });
    this.props.optionsChanged(options);
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
                  value={options.method}
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
                  className="codehinter-query-editor-input"
                  theme={this.props.darkMode ? 'monokai' : 'default'}
                  onChange={(value) => {
                    changeOption(this, 'url', value);
                  }}
                />
              </div>
            </div>
          </div>

          {[
            { name: 'URL parameters', value: 'url_params' },
            { name: 'Headers', value: 'headers' },
            { name: 'Body', value: 'body' },
          ].map((option) => (
            <div className="mb-3" key={option}>
              <div className="row g-2">
                <div className="col-md-2">
                  <label className="form-label pt-2">{option.name}</label>
                </div>
                <div className="col-md-10">
                  {(options[option.value] || []).map((pair, index) => (
                    <div className="input-group" key={index}>
                      <CodeHinter
                        currentState={this.props.currentState}
                        initialValue={pair[0]}
                        theme={this.props.darkMode ? 'monokai' : 'default'}
                        className="form-control codehinter-query-editor-input"
                        onChange={(value) => this.keyValuePairValueChanged(value, 0, option.value, index)}
                      />
                      <CodeHinter
                        currentState={this.props.currentState}
                        className="form-control codehinter-query-editor-input"
                        initialValue={pair[1]}
                        theme={this.props.darkMode ? 'monokai' : 'default'}
                        onChange={(value) => this.keyValuePairValueChanged(value, 1, option.value, index)}
                      />
                      <span
                        className="input-group-text btn-sm"
                        role="button"
                        onClick={() => {
                          this.removeKeyValuePair(option.value, index);
                        }}
                      >
                        x
                      </span>
                    </div>
                  ))}
                  <button
                    className="btn btn-sm btn-outline-azure"
                    onClick={() => this.addNewKeyValuePair(option.value)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export { Restapi };
