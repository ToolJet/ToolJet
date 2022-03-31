import React from 'react';
import { openapiService } from '@/_services';

class Openapi extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loadingSpec: true,
      spec: {},
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

  render() {
    const { loadingSpec } = this.state;
    return (
      <div>
        {loadingSpec && (
          <div className="p-3">
            <div className="spinner-border spinner-border-sm text-azure mx-2" role="status"></div>
            Please wait while we load the OpenAPI specification.
          </div>
        )}
      </div>
    );
  }
}

export { Openapi };
