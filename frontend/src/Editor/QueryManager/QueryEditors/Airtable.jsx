import React from 'react';
import 'codemirror/theme/duotone-light.css';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import { changeOption } from './utils';

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
                  { value: 'update_record', name: 'Update record' },
                  { value: 'delete_record', name: 'Delete record' },
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

            {['list_records'].includes(this.state.options.operation) && (
              <div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Base ID</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.base_id}
                    className="codehinter-query-editor-input"
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    onChange={(value) => changeOption(this, 'base_id', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Table name</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.table_name}
                    className="codehinter-query-editor-input"
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    onChange={(value) => changeOption(this, 'table_name', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Page size</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.page_size}
                    className="codehinter-query-editor-input"
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    onChange={(value) => changeOption(this, 'page_size', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Offset</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.offset}
                    className="codehinter-query-editor-input"
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    onChange={(value) => changeOption(this, 'offset', value)}
                  />
                </div>
              </div>
            )}

            {['retrieve_record'].includes(this.state.options.operation) && (
              <div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Base ID</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.base_id}
                    className="codehinter-query-editor-input"
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    onChange={(value) => changeOption(this, 'base_id', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Table name</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.table_name}
                    className="codehinter-query-editor-input"
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    onChange={(value) => changeOption(this, 'table_name', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Record ID</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.record_id}
                    className="codehinter-query-editor-input"
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    onChange={(value) => changeOption(this, 'record_id', value)}
                  />
                </div>
              </div>
            )}

            {['update_record'].includes(this.state.options.operation) && (
              <div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Base ID</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.base_id}
                    className="codehinter-query-editor-input"
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    onChange={(value) => changeOption(this, 'base_id', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Table name</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.table_name}
                    className="codehinter-query-editor-input"
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    onChange={(value) => changeOption(this, 'table_name', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Record ID</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.record_id}
                    className="codehinter-query-editor-input"
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    onChange={(value) => changeOption(this, 'record_id', value)}
                  />
                </div>
                <div>
                  <div className="mb-3 mt-2">
                    <label className="form-label">Body</label>
                    <CodeHinter
                      currentState={this.props.currentState}
                      initialValue={'{}'}
                      lineNumbers={true}
                      className="query-hinter"
                      theme={'duotone-light'}
                      onChange={(value) => changeOption(this, 'body', value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {['delete_record'].includes(this.state.options.operation) && (
              <div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Base ID</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.base_id}
                    className="codehinter-query-editor-input"
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    onChange={(value) => changeOption(this, 'base_id', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Table name</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.table_name}
                    className="codehinter-query-editor-input"
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    onChange={(value) => changeOption(this, 'table_name', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Record ID</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.record_id}
                    className="codehinter-query-editor-input"
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    onChange={(value) => changeOption(this, 'record_id', value)}
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