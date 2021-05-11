import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';

class Firestore extends React.Component {
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
  }

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
                  { value: 'get_document', name: 'Get Document' },
                  { value: 'query_collection', name: 'Query collection' },
                  { value: 'add_document', name: 'Add Document to Collection'},
                  { value: 'update_document', name: 'Update Document' },
                  { value: 'set_document', name: 'Set Document' },
                  { value: 'bulk_update', name: 'Bulk update using document id' },
                  // { value: 'delete_document', name: 'Delete Document'},
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
            {this.state.options.operation === 'get_document' && (
              <div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Path</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.path}
                    onChange={(value) => this.changeOption('path', value)}
                  />
                </div>
              </div>
            )}
            {(this.state.options.operation === 'set_document'
              || this.state.options.operation === 'update_document' || this.state.options.operation === 'add_document') && (
              <div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Path</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.path}
                    onChange={(value) => this.changeOption('path', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Body</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={typeof this.state.options.body === 'string' ? this.state.options.body  : JSON.stringify(this.state.options.body )}
                    theme="duotone-light"
                    lineNumbers={true}
                    className="query-hinter"
                    onChange={(value) => this.changeOption('body', value)}
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
                    onChange={(value) => this.changeOption('collection', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Key for document Id</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.document_id_key}
                    onChange={(value) => this.changeOption('document_id_key', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label">Records</label>
                  <CodeMirror
                    height="100px"
                    fontSize="2"
                    value={this.state.options.records}
                    onChange={(instance) => this.changeOption('records', instance.getValue())}
                    placeholder="{ }"
                    options={{
                      theme: 'duotone-light',
                      mode: 'javascript',
                      lineWrapping: true,
                      scrollbarStyle: null
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
                    onChange={(value) => this.changeOption('path', value)}
                  />
                </div>
                <hr />
                <div className="row">
                  <h3 className="text-muted">Where condition</h3>
                  <div className="col">
                    <label className="form-label">Field</label>
                    <CodeHinter
                      currentState={this.props.currentState}
                      initialValue={this.state.options.where_field}
                      onChange={(value) => this.changeOption('where_field', value)}
                    />
                  </div>
                  <div className="col">
                    <label className="form-label">Operator</label>
                    <select
                      onChange={(e) => {
                        e.stopPropagation();
                        this.changeOption('where_operation', e.target.value);
                      }}
                      placeholder="Select a value"
                      value={this.state.options.where_operation}
                      className="form-select"
                    >
                      <option value="==">==</option>
                      <option value="<">{'<'}</option>
                      <option value="<">{'>'}</option>
                      <option value="<=">{'<='}</option>
                      <option value=">=">{'>='}</option>
                      <option value="array-contains">{'array-contains'}</option>
                      <option value="in">{'in'}</option>
                      <option value="array-contains-any">{'array-contains-any'}</option>
                    </select>
                  </div>
                  <div className="col">
                    <label className="form-label">Value</label>
                    <CodeHinter
                      currentState={this.props.currentState}
                      initialValue={this.state.options.where_value}
                      onChange={(value) => this.changeOption('where_value', value)}
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
