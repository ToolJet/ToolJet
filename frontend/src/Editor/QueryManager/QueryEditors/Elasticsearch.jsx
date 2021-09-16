import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/theme/duotone-light.css';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import { changeOption } from './utils';

class Elasticsearch extends React.Component {
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
                  { value: 'search', name: 'Search' },
                  { value: 'index_document', name: 'Index a document'},
                  { value: 'get', name: 'Get a document'},
                  { value: 'update', name: 'Update a document'},
                ]}
                value={this.state.options.operation}
                search={false}
                onChange={(value) => {
                  this.changeOperation(value);
                }}
                filterOptions={fuzzySearch}
                placeholder="Select.."
              />
            </div>

            {options.operation === 'update' && (
              <div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Index</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.index}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    onChange={(value) => changeOption(this, 'index', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Id</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.id}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    onChange={(value) => changeOption(this, 'id', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-reset">Body</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={options.body}
                    mode="javascript"
                    placeholder={'{ doc: { page_count: 225 } }'}
                    theme={this.props.darkMode ? 'monokai' : 'duotone-light'}
                    lineNumbers={true}
                    className="query-hinter"
                    onChange={(value) => changeOption(this, 'body', value)}
                  />
                </div>
              </div>
            )}

            {options.operation === 'get' && (
              <div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Index</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.index}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    onChange={(value) => changeOption(this, 'index', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Id</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.id}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    onChange={(value) => changeOption(this, 'id', value)}
                  />
                </div>
              </div>
            )}

            {options.operation === 'index_document' && (
              <div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Index</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.index}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    onChange={(value) => changeOption(this, 'index', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-reset">Body</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={options.body}
                    mode="javascript"
                    placeholder={'{ "name": "The Hitchhikers Guide to the Galaxy" }'}
                    theme={this.props.darkMode ? 'monokai' : 'duotone-light'}
                    lineNumbers={true}
                    className="query-hinter"
                    onChange={(value) => changeOption(this, 'body', value)}
                  />
                </div>
              </div>
            )}
            {options.operation === 'search' && (
              <div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Index</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.index}
                    theme={this.props.darkMode ? 'monokai' : 'default'}
                    onChange={(value) => changeOption(this, 'index', value)}
                  />

                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-reset">Query</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={options.query}
                    mode="sql"
                    placeholder={'{ "name": "" }'}
                    theme={this.props.darkMode ? 'monokai' : 'duotone-light'}
                    lineNumbers={true}
                    className="query-hinter"
                    onChange={(value) => changeOption(this, 'query', value)}
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

export { Elasticsearch };
