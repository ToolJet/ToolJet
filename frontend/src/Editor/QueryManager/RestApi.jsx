import React from 'react';
import { Transformation } from './Transformation';

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

  keyValuePairValueChanged = (e, keyIndex, option, index) => {
    const value = e.target.value;
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
              <div className="col-auto">
                <select
                  className="form-select"
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
              <div className="col">
                <input
                  type="text"
                  className="form-control"
                  value={options.url}
                  onChange={(e) => this.changeOption('url', e.target.value)}
                  placeholder="https://api.example.com/v2/endpoint.json"
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
                  {options[option].map((pair, index) => (
                    <div className="input-group" key={index}>
                      <input
                        type="text"
                        value={pair[0]}
                        className="form-control"
                        placeholder="key"
                        autoComplete="off"
                        onChange={(e) => this.keyValuePairValueChanged(e, 0, option, index)}
                      />
                      <input
                        type="text"
                        value={pair[1]}
                        className="form-control"
                        placeholder="value"
                        autoComplete="off"
                        onChange={(e) => this.keyValuePairValueChanged(e, 1, option, index)}
                      />
                      <span
                        className="input-group-text"
                        role="button"
                        onClick={() => {
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
