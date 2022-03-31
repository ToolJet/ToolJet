import React from 'react';
import { openapiService } from '@/_services';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import DOMPurify from 'dompurify';

const operationColorMapping = {
  get: 'azure',
  post: 'green',
  delete: 'red',
  put: 'yellow',
};

class Openapi extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loadingSpec: true,
      options: {
        params: {
          path: {},
          query: {},
          request: {},
        },
      },
    };
  }

  componentDidMount() {
    this.fetchOpenApiSpec();
  }

  fetchOpenApiSpec = () => {
    this.setState({ loadingSpec: true });
    const definition = this.props.selectedDataSource?.options?.definition?.value;
    const format = this.props.selectedDataSource?.options?.format?.value;
    if (definition) {
      openapiService
        .parseOpenapiSpec(definition, format)
        .then((result) => {
          this.setState({
            loadingSpec: false,
            spec: result,
          });
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  changeOperation = (value) => {
    const operation = value.split(',')[0];
    const path = value.split(',')[1];

    this.setState(
      {
        selectedOperation: this.state.spec.paths[path][operation],
        options: {
          ...this.state.options,
          path,
          operation,
        },
      },
      () => {
        this.props.optionsChanged(this.state.options);
      }
    );
  };

  renderOperationOption = (props, option, snapshot, className) => {
    return (
      <button {...props} className={className} type="button">
        <div className="row">
          <div className="col-md-1">
            <span className={`badge bg-${operationColorMapping[option.operation]}`}>{option.operation}</span>
          </div>

          <div className="col-md-8">
            <span className="text-muted mx-2">{option.name}</span>
          </div>
        </div>
      </button>
    );
  };

  computeOperationSelectionOptions = (paths) => {
    let options = [];

    for (const path of Object.keys(paths)) {
      for (const operation of Object.keys(paths[path])) {
        options.push({
          value: `${operation},${path}`,
          name: path,
          operation: operation,
        });
      }
    }

    return options;
  };

  render() {
    const { options, spec, loadingSpec, selectedOperation } = this.state;
    return (
      <div>
        {loadingSpec && (
          <div className="p-3">
            <div className="spinner-border spinner-border-sm text-azure mx-2" role="status"></div>
            Please wait while we load the OpenAPI specification.
          </div>
        )}

        {options && !loadingSpec && (
          <div className="mb-3 mt-2">
            <div className="row g-2">
              <div className="col-12">
                <label className="form-label pt-2">Operation</label>
              </div>
              <div className="col stripe-operation-options" style={{ width: '90px', marginTop: 0 }}>
                <SelectSearch
                  options={this.computeOperationSelectionOptions(spec.paths)}
                  value="sv"
                  search={true}
                  onChange={(value) => this.changeOperation(value)}
                  filterOptions={fuzzySearch}
                  renderOption={this.renderOperationOption}
                  placeholder="Select an operation"
                />

                {selectedOperation && (
                  <small
                    style={{ margintTop: '10px' }}
                    className="my-2"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedOperation.description) }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export { Openapi };
