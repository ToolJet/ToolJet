import React from 'react';

class Postgresql extends React.Component {
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
                    <CodeMirror
                        height ="100px"
                        fontSize="2"
                        onChange={ (instance, change) => this.changeOption('query', instance.getValue()) }
                        placeholder="SELECT * FROM customers;"
                        options={{
                            theme: 'duotone-light',
                            mode: 'sql',
                            lineWrapping: true,
                            scrollbarStyle: null,
                            
                        }}
                    />
                </div>   
            </div>                    
        )
    }
}

export { Postgresql };
