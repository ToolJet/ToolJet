import React from 'react';
// import { resolveWidgetFieldValue } from '@/_helpers/utils';
import { CodeHinter } from '../CodeBuilder/CodeHinter';
import { changeOption } from '../QueryManager/QueryEditors/utils';
class CodeEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      options: this.props.options,
    };
  }
  render() {
    return (
      <div className="py-1">
        <CodeHinter
          currentState={this.props.currentState}
          height="100"
          initialValue={''}
          theme={this.props.darkMode ? 'monokai' : 'duotone-light'}
          lineNumbers={true}
          className="query-hinter"
          onChange={(value) => changeOption(this, 'codeWidget', value)}
        />
      </div>
    );
  }
}

export { CodeEditor };
