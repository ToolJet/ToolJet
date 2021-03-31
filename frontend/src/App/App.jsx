import React from 'react';
import { Router, Route, Link } from 'react-router-dom';
import { history } from '@/_helpers';

class App extends React.Component {
    constructor(props) {
        super(props);

    }

    render() {

        return (
            <Router history={history}>
                <div>
                    
                </div>
            </Router>
        );
    }
}

export { App }; 