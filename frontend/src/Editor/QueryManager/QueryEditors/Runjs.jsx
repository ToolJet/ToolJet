import React from 'react';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import { changeOption } from './utils';
import { defaults } from 'lodash';

class Runjs extends React.Component {
  constructor(props) {
    super(props);
    const options = defaults({ ...props.options }, { code: '//Type your JavaScript code here', arguments: [] });
    this.state = {
      options,
    };
  }

  componentDidMount() {}

  handleAddArgument = () => {
    let newArgument = {
      name: '',
      type: '',
      default: '',
      mandatory: false,
    };
    let updatedOptions = { ...this.state.options };
    updatedOptions.arguments.push(newArgument);
    this.setState({ options: updatedOptions });
  };

  handleArgumentChange = (index, property, value) => {
    let updatedOptions = { ...this.state.options };
    updatedOptions.arguments[index][property] = value;
    this.setState({ options: updatedOptions });
  };

  render() {
    return (
      <div className="runjs-editor">
        <button onClick={this.handleAddArgument}>Add Argument</button>

        {this.state.options.arguments.map((argument, index) => {
          return (
            <div key={index}>
              <label>Argument {index + 1}:</label>
              <input
                type="text"
                value={argument.name}
                placeholder="Name"
                onChange={(e) => this.handleArgumentChange(index, 'name', e.target.value)}
              />
              <select value={argument.type} onChange={(e) => this.handleArgumentChange(index, 'type', e.target.value)}>
                <option value="">Select Type</option>
                <option value="Number">Number</option>
                <option value="String">String</option>
                <option value="Object">Object</option>
                <option value="Boolean">Boolean</option>
              </select>
              <input
                type="text"
                value={argument.default}
                placeholder="Default"
                onChange={(e) => this.handleArgumentChange(index, 'default', e.target.value)}
              />
              <label>
                <input
                  type="checkbox"
                  checked={argument.mandatory}
                  onChange={(e) => this.handleArgumentChange(index, 'mandatory', e.target.checked)}
                />
                Mandatory
              </label>
            </div>
          );
        })}

        <CodeHinter
          currentState={this.props.currentState}
          initialValue={this.props.options.code}
          mode="javascript"
          theme={this.props.darkMode ? 'monokai' : 'base16-light'}
          lineNumbers={true}
          height={400}
          className="query-hinter"
          ignoreBraces={true}
          onChange={(value) => changeOption(this, 'code', value)}
          isMultiLineJs={false}
          enablePreview={false}
          componentName="Runjs"
          cyLabel={`runjs`}
        />
      </div>
    );
  }
}

export { Runjs };
