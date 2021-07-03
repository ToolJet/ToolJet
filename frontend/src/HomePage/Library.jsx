import React from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { Header } from '@/_components';
import { SampleApps }  from './SampleApps';

class Library extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
  }


  render() {
    return (
      <div className="wrapper org-users-page">

        <Header
          switchDarkMode={this.props.switchDarkMode}
          darkMode={this.props.darkMode}
        />   

        <div className="page-wrapper">

          <div className="page-body">
              <div className="container-xl">
                <SampleApps/>
              </div>
          </div>
        </div>
      </div>
    );
  }
}

export { Library };
