import React from 'react';
import { Transformation } from './Transformation';

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

  keyValuePairValueChanged = (e, key_index, option, index) => {
    const value = e.target.value;
    const { options } = this.state;

    options[option][index][key_index] = value;

    this.setState({ options });
    this.props.optionsChanged(options);
  };

  render() {
    const { options } = this.state;

    return (
      <div>
        <div class="mb-3 mt-2">
          <div class="mb-3">
            <div class="row g-2">
              <div class="col-auto">
                <select
                  class="form-select"
                  value={options.method}
                  onChange={(e) => this.changeOption('method', e.target.value)}
                >
                  <option value="get">GET</option>
                  <option value="post">POST</option>
                  <option value="put">PUT</option>
                  <option value="patch">PATCH</option>
                  <option value="delete">DELETE</option>
                </select>
              </div>
              <div class="col">
                <input
                  type="text"
                  class="form-control"
                  value={options.url}
                  onChange={(e) => this.changeOption('url', e.target.value)}
                  placeholder="https://api.example.com/v2/endpoint.json"
                />
              </div>
            </div>
          </div>

          {['url_params', 'headers', 'body'].map((option) => (
            <div class="mb-3">
              <div class="row g-2">
                <div class="col-md-2">
                  <label class="form-label pt-2">{option}</label>
                </div>
                <div className="col-md-10">
                  {options[option].map((pair, index) => (
                    <div class="input-group">
                      <input
                        type="text"
                        value={pair[0]}
                        class="form-control"
                        placeholder="key"
                        autocomplete="off"
                        onChange={(e) => this.keyValuePairValueChanged(e, 0, option, index)}
                      />
                      <input
                        type="text"
                        value={pair[1]}
                        class="form-control"
                        placeholder="value"
                        autocomplete="off"
                        onChange={(e) => this.keyValuePairValueChanged(e, 1, option, index)}
                      />
                      <span
                        class="input-group-text"
                        role="button"
                        onClick={(e) => {
                          this.removeKeyValuePair(option, index);
                        }}
                      >
                        x
                      </span>
                    </div>
                  ))}
                  <button className="btn btn-outline-primary btn-sm" onClick={() => this.addNewKeyValuePair(option)}>
                    + Add new
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <hr></hr>
        <div className="mb-3 mt-2">
          <Transformation changeOption={this.changeOption} options={options} />
        </div>
      </div>
    );
  }
}

export { Restapi };
