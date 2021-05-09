import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/theme/duotone-light.css';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';

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

  changeOption = (option, value) => {
    const { options } = this.state;
    const newOptions = { ...options, [option]: value };
    this.setState({ options: newOptions });
    this.props.optionsChanged(newOptions);
  };

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
              theme="duotone-light"
              lineNumbers={true}
              className="query-hinter"
              onChange={(value) => this.changeOption('query', value)}
            />
          </div>
        )}
      </div>
    );
  }
}

export { Mysql };
