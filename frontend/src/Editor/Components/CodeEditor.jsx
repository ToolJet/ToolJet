import React from 'react';
// import { resolveWidgetFieldValue } from '@/_helpers/utils';
import { CodeHinter } from '../CodeBuilder/CodeHinter';
import { changeOption } from '../QueryManager/QueryEditors/utils';
export class CodeEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      options: this.props.options,
    };
  }
  render() {
    const { component, currentState, darkMode } = this.props;
    // const { width, height, component, currentState, onComponentOptionChanged, onEvent, darkMode } = this.props;
    console.log('component', JSON.stringify(component));
    return (
      <div className="py-1">
        <CodeHinter
          currentState={currentState}
          height="100"
          initialValue={''}
          theme={darkMode ? 'monokai' : 'duotone-light'}
          lineNumbers={true}
          className="query-hinter"
          onChange={(value) => changeOption(this, 'codeWidget', value)}
        />
      </div>
    );
  }
}
