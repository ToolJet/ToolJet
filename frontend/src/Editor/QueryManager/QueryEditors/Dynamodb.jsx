import React from 'react';
import 'codemirror/theme/duotone-light.css';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import { changeOption } from './utils';

class Dynamodb extends React.Component {
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

  changeOperation = (operation) => {
    this.setState(
      {
        options: {
          ...this.state.options,
          operation,
        },
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
                  { value: 'list_tables', name: 'List Tables' },
                  { value: 'get_item', name: 'Get Item' },
                  { value: 'query_table', name: 'Query Table' },
                  { value: 'scan_table', name: 'Scan Table' },
                  { value: 'delete_item', name: 'Delete Item' },
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

            {['query_table'].includes(this.state.options.operation) && (
              <div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Query condition</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={
                      typeof this.state.options.query_condition === 'string'
                        ? this.state.options.query_condition
                        : JSON.stringify(this.state.options.query_condition)
                    }
                    mode="javascript"
                    lineNumbers={true}
                    theme={this.props.darkMode ? 'monokai' : 'duotone-light'}
                    className="query-hinter"
                    onChange={(value) => changeOption(this, 'query_condition', value)}
                  />
                </div>
              </div>
            )}

            {['scan_table'].includes(this.state.options.operation) && (
              <div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Scan condition</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={
                      typeof this.state.options.scan_condition === 'string'
                        ? this.state.options.scan_condition
                        : JSON.stringify(this.state.options.scan_condition)
                    }
                    mode="javascript"
                    lineNumbers={true}
                    theme={this.props.darkMode ? 'monokai' : 'duotone-light'}
                    className="query-hinter"
                    onChange={(value) => changeOption(this, 'scan_condition', value)}
                  />
                </div>
              </div>
            )}

            {['get_item', 'delete_item'].includes(this.state.options.operation) && (
              <div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Table</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.table}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    className="codehinter-query-editor-input"
                    onChange={(value) => changeOption(this, 'table', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Key</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={
                      typeof this.state.options.key === 'string'
                        ? this.state.options.key
                        : JSON.stringify(this.state.options.key)
                    }
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    mode="javascript"
                    lineNumbers={true}
                    className="query-hinter"
                    onChange={(value) => changeOption(this, 'key', value)}
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

export { Dynamodb };
