import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/theme/duotone-light.css';
import { Transformation } from './Transformation';

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
                            <select 
                                onChange={(e) => { e.stopPropagation(); this.changeOperation(e.target.value)}}
                                placeholder="Select a value"
                                class="form-select">
                                    <option value="get_document">Get Document</option>
                                    <option value="query_collection">Query collection</option>
                                    {/* <option value="set_document">Set Document</option>
                                    <option value="create_document">Create Document</option>
                                    <option value="add_document">Add Document to Collection</option>
                                    <option value="update_document">Update Document</option>
                                    <option value="delete_document">Delete Document</option> */}
                            </select>
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
                                <div class="mb-3 mt-2">
                                    <label className="form-label">Order By ( Array of field names )</label>
                                    <input 
                                        type="text" 
                                        value={this.state.options.order_by}
                                        onChange={(e) => { this.changeOption('order_by', e.target.value)}}
                                        className="form-control"
                                    />
                                </div>
                                <div class="mb-3 mt-2">
                                    <label className="form-label">Start After</label>
                                    <input 
                                        type="text" 
                                        value={this.state.options.start_after}
                                        onChange={(e) => { this.changeOption('start_after', e.target.value)}}
                                        className="form-control"
                                    />
                                </div>
                                <div class="mb-3 mt-2">
                                    <label className="form-label">End Before</label>
                                    <input 
                                        type="text" 
                                        value={this.state.options.end_before}
                                        onChange={(e) => { this.changeOption('end_before', e.target.value)}}
                                        className="form-control"
                                    />
                                </div>
                                <div class="mb-3 mt-2">
                                    <label className="form-label">Limit</label>
                                    <input 
                                        type="text" 
                                        value={this.state.options.limit}
                                        onChange={(e) => { this.changeOption('limit', e.target.value)}}
                                        className="form-control"
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

export { Firestore };
