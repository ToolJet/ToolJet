import React from 'react';
import 'codemirror/theme/duotone-light.css';
import { Transformation } from './Transformation';

class Googlesheets extends React.Component {
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
    this.setState(
      {
        options: {
          ...this.state.options,
          [option]: value
        }
      },
      () => {
        this.props.optionsChanged(this.state.options);
      }
    );
  };

  changeJsonOption(option, value) {
    this.setState(
      {
        options: {
          ...this.state.options,
          [option]: JSON.parse(value)
        }
      },
      () => {
        this.props.optionsChanged(this.state.options);
      }
    );
  }

  changeOperation = (operation) => {
    this.setState(
      {
        options: {
          ...this.state.options,
          operation
        }
      },
      () => {
        this.props.optionsChanged(this.state.options);
      }
    );
  };

  render() {
    const { options } = this.state;

    return (
      <div>
        {options && (
          <div>
            <div className="mb-3 mt-2">
              <label className="form-label">Operation</label>
              <select
                onChange={(e) => {
                  e.stopPropagation();
                  this.changeOperation(e.target.value);
                }}
                placeholder="Select a value"
                value={this.state.options.operation}
                className="form-select"
              >
                <option value="read">Read from a spreadsheet</option>
                <option value="list">List all spreadsheets</option>
              </select>
            </div>
            {this.state.options.operation === 'read' && (
              <div>
                <div className="mb-3 mt-2 row">
                  <div className="col">
                    <label className="form-label">Spreadsheet ID</label>
                    {/* <SelectSearch
                                            options={[]}
                                            value={null}
                                            search={true}
                                            onChange={(value) => { onComponentOptionChanged(component, 'value', value)}}
                                            filterOptions={fuzzySearch}
                                            placeholder="Select.."
                                        /> */}
                    <input
                      type="text"
                      value={this.state.options.spreadsheet_id}
                      onChange={(e) => {
                        this.changeOption('spreadsheet_id', e.target.value);
                      }}
                      className="form-control"
                    />
                  </div>
                  <div className="col-auto">
                    <label className="form-label">Sheet</label>
                    <input
                      type="text"
                      value={this.state.options.sheet}
                      onChange={(e) => {
                        this.changeOption('sheet', e.target.value);
                      }}
                      className="form-control"
                    />
                    <small className="text-muted">Leave blank to use first sheet</small>
                  </div>
                </div>
              </div>
            )}

            <hr></hr>
            <div className="mb-3 mt-2">
              <Transformation changeOption={this.changeOption} options={options} />
            </div>
          </div>
        )}
      </div>
    );
  }
}

export { Googlesheets };
