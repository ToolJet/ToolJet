import React from 'react';
import { changeOption } from './utils';
import { defaults } from 'lodash';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { QUERY_FIELD_LABEL_CLASS_NAME } from '@/AppBuilder/panelLayout';

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
      <div className="runps-editor mb-3 !tw-mb-0">
        <p
          className={`text-placeholder font-weight-medium tw-mb-2 tw-shrink-0 ${QUERY_FIELD_LABEL_CLASS_NAME}`}
          data-cy="query-code-label"
        >
          Code
        </p>
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
          // The query header opens the code in a new browser tab instead.
          usePortalEditor={false}
          delayOnChange={false}
        />
      </div>
    );
  }
}
