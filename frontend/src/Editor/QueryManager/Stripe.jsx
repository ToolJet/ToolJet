import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/theme/duotone-light.css';

class Stripe extends React.Component {
    constructor(props) {
        super(props);
        this.state = { };
    }

    componentDidMount() {
        this.setState ({
            options: this.props.options,
        });
    }

    changeOption = (option, value) => {
        const { options } = this.state;
        const newOptions = { ...options, [option]: value };
        this.setState({ options: newOptions });
        this.props.optionsChanged(newOptions);
    }
   

    render() {
        const { options } = this.state;

        return (
            <div>
                {options && 
                     <div class="mb-3 mt-2">
                        <div class="row g-2">
                            <div class="col-md-2">
                                <label class="form-label pt-2">Endpoint</label>
                            </div>
                            <div class="col-auto">
                            <select class="form-select" onChange={(e) => this.changeOption('endpoint', e.target.value)}>
                                <option value="1">{'/v1/customers/{customer}'}</option>
                                <option value="1">{'/v1/customers/{customer}/subscriptions'}</option>
                            </select>
                            </div>
                        </div>

                        <div className="row mt-2">
                            <div class="col-md-2">
                                <label class="form-label pt-2">customer</label>
                            </div>
                            <div class="col-auto">
                                <input type="text" class="form-control" onChange={(e) => changeOption('api_key', e.target.value)} value={options.api_key} />
                            </div>
                        </div>
                    </div>
                }
            </div>                    
        )
    }
}

export { Stripe };
