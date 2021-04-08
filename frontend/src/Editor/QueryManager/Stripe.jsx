import React from 'react';
import 'codemirror/theme/duotone-light.css';
import specJson from './spec3.json';
import DOMPurify from 'dompurify';

class Stripe extends React.Component {
    constructor(props) {
        super(props);
        this.state = { };
    }

    componentDidMount() {
        this.setState ({
            options: {
                params: {
                    path: {},
                    query: {},
                    request: {}
                }
            },
        });
    }

    changeOption( option, value ) {
        this.setState({ options: { 
            ...this.state.options,
            [option]: value
        }});
    }

    changeOperation = (value) => {
        const operation = value.split(',')[0];
        const path = value.split(',')[1];

        this.setState({
            selectedOperation: specJson.paths[path][operation],
            options: {
                ...this.state.options,
                path,
                operation
            }
        }, () => {
            this.props.optionsChanged(this.state.options);
        });
    }

    changeParam = (paramType, paramName, value) => {

        const options = this.state.options;
        const newOptions = {
            ...options,
            params: {
                ...options.params,
                [paramType]: {
                    ...options.params[paramType],
                    [paramName]: value
                }
            }
        }

        this.setState({ 
            options: newOptions
        });

        this.props.optionsChanged(newOptions);
    }
   
    render() {
        const { options, selectedOperation } = this.state;
        let pathParams = [];
        let queryParams = [];
        let requestBody = []

        if (selectedOperation) {
            if(selectedOperation.parameters) {
                pathParams = selectedOperation.parameters.filter(param => param.in === "path");
                queryParams = selectedOperation.parameters.filter(param => param.in === "query");
            }

            if(selectedOperation.requestBody) {
                const requestType = Object.keys(selectedOperation.requestBody.content)[0];
                requestBody = selectedOperation.requestBody.content[requestType];
            }
        }

        debugger

        return (
            <div>
                {options && 
                     <div class="mb-3 mt-2">
                        <div class="row g-2">
                            <div class="col-md-2">
                                <label class="form-label pt-2">Endpoint</label>
                            </div>
                            <div class="col-md-10">
                            <select class="form-select" onChange={(e) => this.changeOperation(e.target.value)}>
                                <option>Select an operation</option>
                                {Object.keys(specJson.paths).map((path) => 
                                    <>
                                        {Object.keys(specJson.paths[path]).map((operation) =>  
                                            <option value={[operation, path]}>{operation}{path}</option>
                                        )}
                                    </>                                   
                                )}

                            </select>
                            {selectedOperation &&
                                <small
                                    className="mt-2"
                                    dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(selectedOperation.description)}}
                                />
                            }
                            </div>
                        </div>

                        {selectedOperation &&
                            <div className="row mt-2">
                                {pathParams.length > 0 &&
                                    <div>
                                        <h5 className="text-muted">
                                            PATH
                                        </h5>
                                        {pathParams.map((param) => 
                                            <div class="input-group">
                                            <input 
                                                type="text" 
                                                value={param.name} 
                                                class="form-control form-control-sm"  
                                                placeholder="key"  
                                            />
                                            <input 
                                                type="text" 
                                                value={this.state.options.params['path'][param.name]} 
                                                class="form-control form-control-sm"  
                                                placeholder="value"  
                                                onChange={(e) => this.changeParam('path', param.name, e.target.value)}
                                            />
                                            <span 
                                                class="input-group-text"
                                                role="button"
                                            >
                                                x
                                            </span>
                                        </div>
                                        )}
                                        
                                    </div>
                                }

                                {queryParams.length > 0 &&
                                    <div>
                                        <h5 className="text-muted">
                                            QUERY
                                        </h5>
                                        {queryParams.map((param) => 
                                            <div class="input-group">
                                            <input 
                                                type="text" 
                                                value={param.name} 
                                                class="form-control form-control-sm"  
                                                placeholder="key"
                                                disabled
                                            />
                                            <input 
                                                type="text" 
                                                value={this.state.options.params['query'][param.name]} 
                                                class="form-control form-control-sm"  
                                                placeholder="value"  
                                                onChange={(e) => this.changeParam('query', param.name, e.target.value)}
                                            />
                                            <span 
                                                class="input-group-text"
                                                role="button"
                                            >
                                                x
                                            </span>
                                        </div>
                                        )}
                                        
                                    </div>
                                }

                                {requestBody.schema.properties &&
                                    <div>
                                        <h5 className="text-muted">
                                            REQUEST BODY
                                        </h5>
                                        {Object.keys(requestBody.schema.properties).map((param) => 
                                            <div class="input-group">
                                                <input 
                                                    type="text" 
                                                    value={param} 
                                                    class="form-control form-control-sm"  
                                                    placeholder="key"
                                                    disabled
                                                />
                                                <input 
                                                    type="text" 
                                                    value={this.state.options.params['request'][param.name]} 
                                                    class="form-control form-control-sm"  
                                                    placeholder="value"  
                                                    onChange={(e) => this.changeParam('request', param.name, e.target.value)}
                                                />
                                                <span 
                                                    class="input-group-text"
                                                    role="button"
                                                >
                                                    x
                                                </span>
                                            </div>
                                        )}
                                        
                                    </div>
                                }
                            </div>
                        }
                    </div>
                }
            </div>                    
        )
    }
}

export { Stripe };
