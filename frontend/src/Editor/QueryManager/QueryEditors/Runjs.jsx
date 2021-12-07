import React from 'react';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import { changeOption } from './utils';

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
          onChange={(value) => changeOption(this, 'code', value)}
          isMultiLineJs={false}
          enablePreview={false}
        />
      </div>
    );
  }
}

export { Runjs };
