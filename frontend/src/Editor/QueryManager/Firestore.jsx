import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/theme/duotone-light.css';
import { Transformation } from './Transformation';
import SelectSearch, { fuzzySearch } from 'react-select-search';

class Firestore extends React.Component {
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

    changeJsonOption( option, value) {
        this.setState({ options: { 
            ...this.state.options,
            [option]: JSON.parse(value)
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
                                    { value: 'get_document', name: 'Get Document'},
                                    { value: 'update_document', name: 'Update Document'},
                                    { value: 'set_document', name: 'Set Document'},
                                    { value: 'query_collection', name: 'Query collection'},
                                    { value: 'bulk_update', name: 'Bulk update using document id'},
                                    // { value: 'add_document', name: 'Add Document to Collection'},
                                    // { value: 'update_document', name: 'Update Document'},
                                    // { value: 'delete_document', name: 'Delete Document'},
                                ]}
                                value={this.state.options.operation}
                                search={true}
                                onChange={(value) => { this.changeOperation(value)}}
                                filterOptions={fuzzySearch}
                                placeholder="Select.." 
                            />
                        </div>
                        {this.state.options.operation === 'get_document' && 
                            <div>
                                <div class="mb-3 mt-2">
                                    <label className="form-label">Path</label>
                                    <input 
                                        type="text" 
                                        value={this.state.options.path}
                                        onChange={(e) => { this.changeOption('path', e.target.value)}}
                                        className="form-control"
                                    />
                                </div>
                            </div>
                        }
                        {(this.state.options.operation === 'set_document' || this.state.options.operation === 'update_document')&& 
                            <div>
                                <div class="mb-3 mt-2">
                                    <label className="form-label">Path</label>
                                    <input 
                                        type="text" 
                                        value={this.state.options.path}
                                        onChange={(e) => { this.changeOption('path', e.target.value)}}
                                        className="form-control"
                                    />
                                </div>
                                <div class="mb-3 mt-2">
                                    <label className="form-label">Body</label>
                                    <CodeMirror
                                        height ="100px"
                                        fontSize="2"
                                        value={JSON.stringify(this.state.options.body)}
                                        onChange={ (instance, change) => this.changeJsonOption('body', instance.getValue()) }
                                        placeholder="{ }"
                                        options={{
                                            theme: 'duotone-light',
                                            mode: 'json',
                                            lineWrapping: true,
                                            scrollbarStyle: null,
                                        }}
                                    />
                                </div>
                            </div>
                        }
                        {(this.state.options.operation === 'bulk_update')&& 
                            <div>
                                <div class="mb-3 mt-2">
                                    <label className="form-label">Collection</label>
                                    <input 
                                        type="text" 
                                        value={this.state.options.collection}
                                        onChange={(e) => { this.changeOption('collection', e.target.value)}}
                                        className="form-control"
                                    />
                                </div>
                                <div class="mb-3 mt-2">
                                    <label className="form-label">Key for document Id</label>
                                    <input 
                                        type="text" 
                                        value={this.state.options.document_id_key}
                                        onChange={(e) => { this.changeOption('document_id_key', e.target.value)}}
                                        className="form-control"
                                    />
                                </div>
                                <div class="mb-3 mt-2">
                                    <label className="form-label">Records</label>
                                    <CodeMirror
                                        height ="100px"
                                        fontSize="2"
                                        value={this.state.options.records}
                                        onChange={ (instance, change) => this.changeOption('records', instance.getValue()) }
                                        placeholder="{ }"
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
                        {this.state.options.operation === 'query_collection' && 
                            <div>
                                <div class="mb-3 mt-2">
                                    <label className="form-label">Path</label>
                                    <input 
                                        type="text" 
                                        value={this.state.options.path}
                                        onChange={(e) => { this.changeOption('path', e.target.value)}}
                                        className="form-control"
                                    />
                                </div>
                                <hr/>
                                <div className="row">
                                    <h3 className="text-muted">Where condition</h3>
                                    <div class="col">
                                        <label className="form-label">Field</label>
                                        <input 
                                            type="text" 
                                            value={this.state.options.where_field}
                                            onChange={(e) => { this.changeOption('where_field', e.target.value)}}
                                            className="form-control"
                                        />
                                    </div>
                                    <div className="col">
                                        <label className="form-label">Operator</label>
                                        <select 
                                            onChange={(e) => { e.stopPropagation(); this.changeOption('where_operation', e.target.value)}}
                                            placeholder="Select a value"
                                            value={this.state.options.where_operation}
                                            class="form-select">
                                                <option value="==">==</option>
                                                <option value="<">{'<'}</option>
                                                <option value="<">{'>'}</option>
                                                <option value="<=">{'<='}</option>
                                                <option value=">=">{'>='}</option>
                                                <option value="array-contains">{'array-contains'}</option>
                                                <option value="in">{'in'}</option>
                                                <option value="array-contains-any">{'array-contains-any'}</option>
                                        </select>
                                    </div>
                                    <div class="col">
                                        <label className="form-label">Value</label>
                                        <input 
                                            type="text" 
                                            value={this.state.options.where_value}
                                            onChange={(e) => { this.changeOption('where_value', e.target.value)}}
                                            className="form-control"
                                        />
                                    </div>
                               </div>
                                
                            </div>
                        }
                    </div>
                }
            </div>                    
        )
    }
}

export { Firestore };
