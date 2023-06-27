import React from 'react';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import { changeOption } from './utils';
import { defaults } from 'lodash';
import { Badge, Button, ButtonGroup, Card, CloseButton } from 'react-bootstrap';
import CardHeader from 'react-bootstrap/esm/CardHeader';
import ArgumentFormPopup from './ArgumentFormPopup';
import Remove from '@/_ui/Icon/bulkIcons/Remove';

class Runjs extends React.Component {
  constructor(props) {
    super(props);
    const options = defaults({ ...props.options }, { code: '//Type your JavaScript code here', arguments: [] });
    this.state = {
      options,
    };
  }

  componentDidMount() {}

  handleAddArgument = (newArgument) => {
    let updatedOptions = { ...this.state.options };
    updatedOptions.arguments.push(newArgument);
    this.setState({ options: updatedOptions });
  };

  handleArgumentChange = (index, updatedArgument) => {
    let updatedOptions = { ...this.state.options };
    updatedOptions.arguments[index] = updatedArgument;
    this.setState({ options: updatedOptions });
  };

  handleArgumentRemove = (index) => {
    let updatedOptions = { ...this.state.options };
    const updatedArguments = updatedOptions.arguments.filter((arg, i) => index !== i);
    updatedOptions = { ...updatedOptions, arguments: updatedArguments };
    this.setState({ options: updatedOptions });
  };

  render() {
    return (
      <Card className="runjs-editor">
        <CardHeader>
          Parameters
          <ArgumentFormPopup onSubmit={this.handleAddArgument} currentState={this.props.currentState} />
          {this.state.options.arguments.map((argument, index) => (
            <ArgumentFormPopup
              isEdit
              key={index}
              onSubmit={(arg) => this.handleArgumentChange(index, arg)}
              onRemove={() => this.handleArgumentRemove(index)}
              name={argument.name}
              defaultValue={argument.defaultValue}
              currentState={this.props.currentState}
            />
          ))}
        </CardHeader>
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
      </Card>
    );
  }
}

export { Runjs };
