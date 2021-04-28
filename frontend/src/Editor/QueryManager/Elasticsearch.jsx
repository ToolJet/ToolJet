import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/theme/duotone-light.css';
import { Transformation } from './Transformation';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { CodeBuilder } from '../CodeBuilder/CodeBuilder';

class Elasticsearch extends React.Component {
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

    changeOption( option, value ) {
        this.setState({ options: { 
            ...this.state.options,
            [option]: value
        }}, () => {
            this.props.optionsChanged(this.state.options);
        });
    }

    changeOperation = (operation) => {
        this.setState({
            options: {
                ...this.state.options,
                operation
            }
        }, () => {
            this.props.optionsChanged(this.state.options);
        });
    }
   

    render() {
        const { options } = this.state;

        return (
            <div>
                {options &&
                    <div>
                        <div class="mb-3 mt-2">
                            <label className="form-label">Operation</label>
                            <SelectSearch 
                                options={[
                                    { value: 'search', name: 'Search'},
                                    // { value: 'index', name: 'Index'},
                                    // { value: 'create', name: 'Create'},
                                    // { value: 'update', name: 'Update'},
                                ]}
                                value={this.state.options.operation}
                                search={false}
                                onChange={(value) => { this.changeOperation(value)}}
                                filterOptions={fuzzySearch}
                                placeholder="Select.." 
                            />
                        </div>
                        {options.operation === 'search' && 
                            <div>
                                <div class="mb-3 mt-2">
                                    <label className="form-label text-muted">Index</label>
                                    <input 
                                        type="text" 
                                        value={this.state.options.index}
                                        onChange={(e) => { this.changeOption('index', e.target.value)}}
                                        className="form-control"
                                    />
                                </div>
                                <div class="mb-3 mt-2">
                                    <label className="form-label text-reset">Query</label>
                                    <CodeMirror
                                        height ="100px"
                                        fontSize="2"
                                        placeholder={`{ "name": "" }`}
                                        value={options.query}
                                        onChange={ (instance, change) => this.changeOption('query', instance.getValue()) }
                                        options={{
                                            theme: 'duotone-light',
                                            mode: 'javascript',
                                            lineWrapping: true,
                                            scrollbarStyle: null,
                                            
                                        }}
                                    />
                                </div>
                            </div>
                        }
                    </div>
                }
            </div>                    
        )
    }
}

export { Elasticsearch };
