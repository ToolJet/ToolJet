import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/theme/duotone-light.css';
import { Transformation } from './Transformation';

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
          <div>
            <div className="mb-3 mt-2">
              <CodeMirror
                height="100px"
                fontSize="2"
                value={options.query}
                onChange={(instance) => this.changeOption('query', instance.getValue())}
                placeholder="PING"
                options={{
                  theme: 'duotone-light',
                  mode: 'sql',
                  lineWrapping: true,
                  scrollbarStyle: null
                }}
              />
            </div>
            <hr></hr>
            <div className="mb-3 mt-2">
              <Transformation changeOption={this.changeOption} options={options} />
            </div>
          </div>
        )}
      </div>
    );
  }
}

export { Redis };
