import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/theme/duotone-light.css';
import { changeOption } from './utils';

class Redis extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      options: this.props.options
    };
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
          <div>
            <div className="mb-3 mt-2">
              <CodeMirror
                height="auto"
                fontSize="2"
                value={options.query}
                onChange={(instance) => changeOption(this, 'query', instance.getValue())}
                placeholder="PING"
                options={{
                  theme: 'duotone-light',
                  mode: 'sql',
                  lineWrapping: true,
                  scrollbarStyle: null
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
}

export { Redis };
