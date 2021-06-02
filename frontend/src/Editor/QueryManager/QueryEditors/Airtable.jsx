import React from 'react';
import 'codemirror/theme/duotone-light.css';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';

class Airtable extends React.Component {
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
                  { value: 'list_records', name: 'List records' },
                  { value: 'retrieve_record', name: 'Retrieve record' },
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

            {(['list_records'].includes(this.state.options.operation)) && (
              <div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Base ID</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.base_id}
                    onChange={(value) => this.changeOption('base_id', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Table name</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.table_name}
                    onChange={(value) => this.changeOption('table_name', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Page size</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.page_size}
                    onChange={(value) => this.changeOption('page_size', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Offset</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.offset}
                    onChange={(value) => this.changeOption('offset', value)}
                  />
                </div>
              </div>
            )}

            {(['retrieve_record'].includes(this.state.options.operation)) && (
              <div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Base ID</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.base_id}
                    onChange={(value) => this.changeOption('base_id', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Table name</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.table_name}
                    onChange={(value) => this.changeOption('table_name', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Record ID</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.record_id}
                    onChange={(value) => this.changeOption('record_id', value)}
                  />
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    );
  }
}

export { Airtable };
