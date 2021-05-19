import React from 'react';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import 'codemirror/theme/duotone-light.css';
import SelectSearch, { fuzzySearch } from 'react-select-search';

class Restapi extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      options: this.props.options
    };
  }

  componentDidMount() {
    this.setState({
      options: this.props.options
    });
  }

  changeOption = (option, value) => {
    const { options } = this.state;
    const newOptions = { ...options, [option]: value };
    this.setState({ options: newOptions });
    this.props.optionsChanged(newOptions);
  };

  addNewKeyValuePair = (option) => {
    const { options } = this.state;
    const newOptions = { ...options, [option]: [...options[option], ['', '']] };

    this.setState({
      options: newOptions
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

    return (
      <div>
        <div className="mb-3 mt-2">
          <div className="mb-3">
            <div className="row g-2">
              <div className="col-auto" style={{ width: '120px' }} >
                <SelectSearch
                  options={[
                    { name: 'GET', value: 'get' },
                    { name: 'POST', value: 'post' },
                    { name: 'PUT', value: 'put' },
                    { name: 'PATCH', value: 'patch' },
                    { name: 'DELETE', value: 'delete' }
                  ]}
                  value={options.method}
                  search={false}
                  closeOnSelect={true}
                  onChange={(value) => {
                    this.changeOption('method', value);
                  }}
                  filterOptions={fuzzySearch}
                  placeholder="Method"
                />
              </div>

              <div className="col">
                <CodeHinter
                  currentState={this.props.currentState}
                  initialValue={options.url}
                  className="codehinter-query-editor-input"
                  onChange={(value) => { this.changeOption('url', value); }}
                />
              </div>
            </div>
          </div>

          {['url_params', 'headers', 'body'].map((option) => (
            <div className="mb-3" key={option}>
              <div className="row g-2">
                <div className="col-md-2">
                  <label className="form-label pt-2">{option}</label>
                </div>
                <div className="col-md-10">
                  {(options[option] || []).map((pair, index) => (
                    <div className="input-group" key={index}>
                      <CodeHinter
                        currentState={this.props.currentState}
                        initialValue={pair[0]}
                        className="form-control codehinter-query-editor-input"
                        onChange={(value) => this.keyValuePairValueChanged(value, 0, option, index)}
                      />
                      <CodeHinter
                        currentState={this.props.currentState}
                        className="form-control codehinter-query-editor-input"
                        initialValue={pair[1]}
                        onChange={(value) => this.keyValuePairValueChanged(value, 1, option, index)}
                      />
                      <span
                        className="input-group-text btn-sm"
                        role="button"
                        onClick={() => {
                          this.removeKeyValuePair(option, index);
                        }}
                      >
                        x
                      </span>
                    </div>
                  ))}
                  <button className="btn btn-outline-azure btn-sm" onClick={() => this.addNewKeyValuePair(option)}>
                    + Add new
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
