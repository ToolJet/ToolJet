import React from 'react';
import 'codemirror/theme/duotone-light.css';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import { changeOption } from './utils';

class Slack extends React.Component {
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
                  { name: 'List members', value: 'list_users' },
                  { name: 'Send message', value: 'send_message' }
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

            {this.state.options.operation === 'send_message'
              && <div>
                <div className="mb-3 mt-2 row">
                  <div className="col">
                    <label className="form-label">Channel</label>
                      <CodeHinter
                        currentState={this.props.currentState}
                        initialValue={this.state.options.channel}
                        className="codehinter-query-editor-input"
                        onChange={(value) => changeOption(this, 'channel', value)}
                      />
                  </div>
                </div>
                <div className="mb-3 mt-2 row">
                  <div className="col">
                    <label className="form-label">Message</label>
                      <CodeHinter
                        currentState={this.props.currentState}
                        initialValue={options.message}
                        className="codehinter-query-editor-input"
                        onChange={(value) => changeOption(this, 'message', value)}
                      />
                  </div>
                </div>
                {/* <div className="mb-3 mt-2 mx-1 row">
                  <label className="form-check form-switch my-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      onClick={() => changeOption(this, 'sendAsUser', !options.sendAsUser)}
                      checked={options.sendAsUser}
                    />
                    <span className="form-check-label">Send as user</span>
                  </label>
                </div> */}
              </div>
            }
          </div>
        )}
      </div>
    );
  }
}

export { Slack };
