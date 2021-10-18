import React from 'react';
import 'codemirror/theme/duotone-light.css';
import { changeOption } from './utils';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';

class Redis extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      options: this.props.options,
    };
  }

  componentDidMount() {
    this.setState({
      options: this.props.options,
    });
  }

  render() {
    const { options } = this.state;

    return (
      <div>
        {options && (
          <div>
            <div className="mb-3 mt-2">
              <CodeHinter
                height="auto"
                currentState={this.props.currentState}
                initialValue={options.query}
                mode="sql"
                placeholder={'PING'}
                theme={this.props.darkMode ? 'monokai' : 'duotone-light'}
                lineNumbers={true}
                className="query-hinter"
                onChange={(value) => changeOption(this, 'query', value)}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
}

export { Redis };
