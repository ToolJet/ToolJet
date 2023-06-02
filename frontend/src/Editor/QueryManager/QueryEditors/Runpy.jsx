import React from 'react';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import { changeOption } from './utils';
import { defaults } from 'lodash';

export class Runpy extends React.Component {
  constructor(props) {
    super(props);
    const options = defaults({ ...props.options }, { code: '//Type your Python code here' });
    this.state = {
      options,
    };
  }

  componentDidMount() {}

  render() {
    return (
      <div>
        <CodeHinter
          currentState={this.props.currentState}
          initialValue={this.props.options.code}
          mode="python"
          theme={this.props.darkMode ? 'monokai' : 'base16-light'}
          lineNumbers={true}
          height={400}
          className="query-hinter"
          ignoreBraces={true}
          onChange={(value) => changeOption(this, 'code', value)}
          isMultiLineJs={false}
          enablePreview={false}
          componentName="Runpy"
          cyLabel={`runpy`}
        />
      </div>
    );
  }
}
