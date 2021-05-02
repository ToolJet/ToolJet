import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/theme/duotone-light.css';

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
            <CodeMirror
              height="auto"
              fontSize="2"
              value={options.query}
              onChange={(instance) => this.changeOption('query', instance.getValue())}
              placeholder="SELECT * FROM customers;"
              options={{
                theme: 'duotone-light',
                mode: 'sql',
                lineWrapping: true,
                scrollbarStyle: null
              }}
            />
          </div>
        )}
      </div>
    );
  }
}

export { Mysql };
