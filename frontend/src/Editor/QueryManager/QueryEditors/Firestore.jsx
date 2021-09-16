import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import { changeOption } from './utils';

class Firestore extends React.Component {
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

  changeJsonOption(option, value) {
    this.setState(
      {
        options: {
          ...this.state.options,
          [option]: JSON.parse(value),
        },
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
                  { value: 'get_document', name: 'Get Document' },
                  { value: 'query_collection', name: 'Query collection' },
                  { value: 'add_document', name: 'Add Document to Collection' },
                  { value: 'update_document', name: 'Update Document' },
                  { value: 'set_document', name: 'Set Document' },
                  { value: 'bulk_update', name: 'Bulk update using document id' },
                  { value: 'delete_document', name: 'Delete Document' },
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
            {(this.state.options.operation === 'get_document' ||
              this.state.options.operation === 'delete_document') && (
              <div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Path</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.path}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    onChange={(value) => changeOption(this, 'path', value)}
                  />
                </div>
              </div>
            )}
            {(this.state.options.operation === 'set_document' ||
              this.state.options.operation === 'update_document' ||
              this.state.options.operation === 'add_document') && (
              <div>
                <div className="mb-3 mt-2">
                  <label className="form-label">
                    {this.state.options.operation === 'add_document' ? 'Collection' : 'Path'}
                  </label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.path}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    onChange={(value) => changeOption(this, 'path', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Body</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={
                      typeof this.state.options.body === 'string'
                        ? this.state.options.body
                        : JSON.stringify(this.state.options.body)
                    }
                    // theme="duotone-light"
                    lineNumbers={true}
                    className="query-hinter"
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    onChange={(value) => changeOption(this, 'body', value)}
                  />
                </div>
              </div>
            )}
            {this.state.options.operation === 'bulk_update' && (
              <div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Collection</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.collection}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    onChange={(value) => changeOption(this, 'collection', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Key for document Id</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.document_id_key}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    onChange={(value) => changeOption(this, 'document_id_key', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Records</label>
                  <CodeMirror
                    height="100px"
                    fontSize="2"
                    value={this.state.options.records}
                    onChange={(instance) => changeOption(this, 'records', instance.getValue())}
                    placeholder="{ }"
                    options={{
                      theme: this.props.darkMode ? 'monokai' : 'default',
                      mode: 'javascript',
                      lineWrapping: true,
                      scrollbarStyle: null,
                    }}
                  />
                </div>
              </div>
            )}
            {this.state.options.operation === 'query_collection' && (
              <div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Path</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.path}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    className="codehinter-query-editor-input"
                    onChange={(value) => changeOption(this, 'path', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Order</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.order}
                    className="codehinter-query-editor-input"
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    onChange={(value) => changeOption(this, 'order', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Limit</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.limit}
                    className="codehinter-query-editor-input"
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    onChange={(value) => changeOption(this, 'limit', value)}
                  />
                </div>
                <div className="row">
                  <label className="form-label">Where condition</label>
                  <div className="col">
                    <h5 className="text-muted">Field</h5>
                    <CodeHinter
                      currentState={this.props.currentState}
                      className="codehinter-query-editor-input"
                      theme={this.props.darkMode ? 'monokai' : 'default'}
                      initialValue={this.state.options.where_field}
                      onChange={(value) => changeOption(this, 'where_field', value)}
                    />
                  </div>
                  <div className="col-auto">
                    <h5 className="text-muted">Operator</h5>
                    <SelectSearch
                      options={[
                        { value: '==', name: '==' },
                        { value: '<', name: '<' },
                        { value: '>', name: '>' },
                        { value: '<=', name: '<=' },
                        { value: '>=', name: '>=' },
                        { value: 'array-contains', name: 'array-contains' },
                        { value: 'in', name: 'in' },
                        { value: 'array-contains-any', name: 'array-contains-any' },
                      ]}
                      value={this.state.options.where_operation}
                      search={true}
                      onChange={(value) => {
                        changeOption(this, 'where_operation', value);
                      }}
                      filterOptions={fuzzySearch}
                      placeholder="Select.."
                    />
                  </div>
                  <div className="col">
                    <h5 className="text-muted">Value</h5>
                    <CodeHinter
                      currentState={this.props.currentState}
                      className="codehinter-query-editor-input"
                      theme={this.props.darkMode ? 'monokai' : 'default'}
                      initialValue={this.state.options.where_value}
                      onChange={(value) => changeOption(this, 'where_value', value)}
                    />
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

export { Firestore };
