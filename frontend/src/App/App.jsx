import React from 'react';
import { Router, Route, Link } from 'react-router-dom';
import { history } from '@/_helpers';
import { authenticationService } from '@/_services';
import { PrivateRoute } from '@/_components';
import { HomePage } from '@/HomePage';
import { LoginPage } from '@/LoginPage';
import { Editor, Viewer } from '@/Editor';
import '@/_styles/theme.scss';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            currentUser: null
        };
    }

    componentDidMount() {
        authenticationService.currentUser.subscribe(x => this.setState({ currentUser: x }));
    }

    logout() {
        authenticationService.logout();
        history.push('/login');
    }

    render() {
        const { currentUser } = this.state;
        return (
            <Router history={history}>
                <div>
                    {currentUser &&
                        <div></div>
                    }

                    <ToastContainer/>
                    
                    <PrivateRoute exact path="/" component={HomePage} />
                    <Route path="/login" component={LoginPage} />
                    <PrivateRoute exact path="/apps/:id" component={Editor} />
                    <PrivateRoute exact path="/applications/:id" component={Viewer} />
                                
                </div>
            </Router>
        );
    }
}

export { App }; 