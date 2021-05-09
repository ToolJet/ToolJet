import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/theme/duotone-light.css';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';

class Postgresql extends React.Component {
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
    const { options } = this.state;
    const newOptions = { ...options, [option]: value };
    this.setState({ options: newOptions });
    this.props.optionsChanged(newOptions);
  };

  render() {
    const { options } = this.state;

    return (
      <div>
        {options && (
          <div>
            <div className="mb-3 mt-2 col-md-2">
              <SelectSearch
                options={[
                  { name: 'SQL mode', value: 'sql' },
                  { name: 'GUI mode', value: 'gui' }
                ]}
                value={options.mode}
                search={true}
                onChange={(value) => {
                  this.changeOption('mode', value);
                }}
                filterOptions={fuzzySearch}
                placeholder="Select.."
              />
            </div>

            {options.mode === 'sql' && (
              <div className="mb-3 mt-2">
                <CodeMirror
                  height="auto"
                  style={{ minHeight: '100px' }}
                  fontSize="2"
                  value={options.query}
                  onChange={(instance) => this.changeOption('query', instance.getValue())}
                  placeholder="SELECT * FROM customers;"
                  options={{
                    theme: 'duotone-light',
                    mode: 'sql',
                    lineWrapping: true,
                    scrollbarStyle: null
                  }}
                />
              </div>
            )}
            {options.mode === 'gui' && (
              <div>
                <div className="row">
                  <div className="col">
                    <label className="form-label">Table</label>
                    <CodeHinter
                        currentState={this.props.currentState}
                        initialValue={this.state.options.table}
                        onChange={(value) => this.changeOption('table', value)}
                      />
                  </div>
                  <div className="col">
                    <label className="form-label">Operation</label>
                    <SelectSearch
                      options={[{ name: 'Bulk update using primary key', value: 'bulk_update_pkey' }]}
                      value={options.operation}
                      search={true}
                      onChange={(value) => {
                        this.changeOption('operation', value);
                      }}
                      filterOptions={fuzzySearch}
                      placeholder="Select.."
                    />
                  </div>
                </div>

                {options.operation === 'bulk_update_pkey' && (
                  <div>
                    <div className="mb-3 mt-2">
                      <label className="form-label">Primary key column</label>
                      <CodeHinter
                        currentState={this.props.currentState}
                        initialValue={options.primary_key_column}
                        onChange={(value) => this.changeOption('primary_key_column', value)}
                      />
                    </div>
                    <div className="mb-3 mt-2">
                      <label className="form-label">Records to update</label>
                      <CodeMirror
                        height="auto"
                        fontSize="2"
                        value={options.records}
                        onChange={(instance) => this.changeOption('records', instance.getValue())}
                        placeholder="{{ [ ] }}"
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
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

export { Postgresql };
