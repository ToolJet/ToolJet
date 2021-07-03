import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/theme/duotone-light.css';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import { changeOption } from './utils';

class Mysql extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    this.setState({
      options: this.props.options
    });
  }

  render() {
    const { options } = this.state;

    return (
      <div>
        {options && (
          <div className="mb-3 mt-2">
            <CodeHinter
              currentState={this.props.currentState}
              initialValue={options.query}
              mode="sql"
              theme={this.props.darkMode ? 'monokai' : 'duotone-light'}
              lineNumbers={true}
              className="query-hinter"
              onChange={(value) => changeOption(this, 'query', value)}
            />
          </div>
        )}
      </div>
    );
  }
}

export { Mysql };
