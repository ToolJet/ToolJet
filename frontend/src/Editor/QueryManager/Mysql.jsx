import React from 'react';

class Mysql extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            options: this.props.options,
         };
    }

    componentDidMount() {
        this.state = {
            options: this.props.options,
        };
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
                <div class="mb-3 mt-2">
                    <label class="form-label">SQL Query</label>
                    <textarea onChange={(e) => this.changeOption('query', e.target.value)} class="form-control" placeholder="SELECT * FROM"></textarea>
                </div>   
            </div>                    
        )
    }
}

export { Mysql };
