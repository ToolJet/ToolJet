import React from 'react';
import { changeOption } from './utils';
import { defaults } from 'lodash';
import CodeHinter from '@/AppBuilder/CodeEditor';

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
      <div className="runps-editor mb-3">
        <CodeHinter
          renderCopilot={this.props.renderCopilot}
          type="multiline"
          initialValue={this.props.options.code}
          lang="python"
          height={400}
          className="query-hinter"
          onChange={(value) => changeOption(this, 'code', value)}
          componentName="Runpy"
          cyLabel={`runpy`}
          delayOnChange={false}
        />
      </div>
    );
  }
}
