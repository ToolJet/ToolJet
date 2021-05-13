import React from 'react';
import 'codemirror/theme/duotone-light.css';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';

class Mongodb extends React.Component {
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
                  { name: 'List collections', value: 'list_collections' },
                  { name: 'Insert one document', value: 'insert_one' },
                  { name: 'Insert many documents', value: 'insert_many' },
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

            {this.state.options.operation === 'insert_one' && (
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
                  <label className="form-label">Document</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.document}
                    theme="duotone-light"
                    mode="javascript"
                    lineNumbers={true}
                    className="query-hinter"
                    onChange={(value) => this.changeOption('document', value)}
                  />
                </div>
              </div>
            )}

            {this.state.options.operation === 'insert_many' && (
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
                  <label className="form-label">Documents</label>
                  <CodeHinter
                    currentState={this.props.currentState}
                    initialValue={this.state.options.documents}
                    theme="duotone-light"
                    mode="javascript"
                    lineNumbers={true}
                    className="query-hinter"
                    onChange={(value) => this.changeOption('documents', value)}
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

export { Mongodb };
