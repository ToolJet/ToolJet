import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/theme/duotone-light.css';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';

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
                  // { value: 'create', name: 'Create'},
                  // { value: 'update', name: 'Update'},
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

            {options.operation === 'index_document' && (
              <div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-muted">Index</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.index}
                    onChange={(value) => this.changeOption('index', value)}
                  />
                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-reset">Body</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={options.body}
                    mode="javascript"
                    placeholder={'{ "name": "The Hitchhikers Guide to the Galaxy" }'}
                    theme="duotone-light"
                    lineNumbers={true}
                    className="query-hinter"
                    onChange={(value) => this.changeOption('body', value)}
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
                    onChange={(value) => this.changeOption('index', value)}
                  />

                </div>
                <div className="mb-3 mt-2">
                  <label className="form-label text-reset">Query</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={options.query}
                    mode="sql"
                    placeholder={'{ "name": "" }'}
                    theme="duotone-light"
                    lineNumbers={true}
                    className="query-hinter"
                    onChange={(value) => this.changeOption('query', value)}
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
