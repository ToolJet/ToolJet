import React from 'react';
import 'codemirror/theme/duotone-light.css';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';

class Dynamodb extends React.Component {
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
    this.setState(
      {
        options: {
          ...this.state.options,
          [option]: value
        }
      },
      () => {
        this.props.optionsChanged(this.state.options);
      }
    );
  };

  changeOperation = (operation) => {
    this.setState(
      {
        options: {
          ...this.state.options,
          operation
        }
      },
      () => {
        this.props.optionsChanged(this.state.options);
      }
    );
  };

  render() {
    const { options } = this.state;

    return (
      <div>
        {options && (
          <div>
            <div className="mb-3 mt-2">
              <label className="form-label">Operation</label>
              <SelectSearch
                options={[
                  { value: 'list_tables', name: 'List Tables' },
                ]}
                value={this.state.options.operation}
                search={true}
                onChange={(value) => {
                  this.changeOperation(value);
                }}
                filterOptions={fuzzySearch}
                placeholder="Select.."
              />
            </div>
          </div>
        )}
      </div>
    );
  }
}

export { Dynamodb };
