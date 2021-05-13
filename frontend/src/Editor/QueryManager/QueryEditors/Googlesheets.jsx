import React from 'react';
import 'codemirror/theme/duotone-light.css';
import SelectSearch, { fuzzySearch } from 'react-select-search';

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
              <SelectSearch
                options={[
                  { value: 'read', name: 'Read data from a spreadsheet' },
                  { value: 'append', name: 'Append data to a spreadsheet' },
                ]}
                value={this.state.options.operation}
                search={true}
                onChange={(value) => {
                  this.changeOperation(value);
                }}
                filterOptions={fuzzySearch}
                placeholder="Select.."
              />
            </div>
            {['read', 'append'].includes(this.state.options.operation) && (
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
          </div>
        )}
      </div>
    );
  }
}

export { Googlesheets };
