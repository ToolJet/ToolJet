import React from 'react';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';

class Runjs extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
  }

  render() {
    return (
      <div>
        <CodeHinter
          currentState={this.props.currentState}
          initialValue={this.props.options.code}
          mode="javascript"
          theme={this.props.darkMode ? 'monokai' : 'base16-light'}
          lineNumbers={true}
          height={400}
          className="query-hinter"
          ignoreBraces={true}
          onChange={(value) => this.props.optionsChanged({ code: value })}
          isMultiLineJs={false}
          enablePreview={false}
        />
      </div>
    );
  }
}

export { Runjs };
