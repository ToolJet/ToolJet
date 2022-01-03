import React from 'react';
import { Header } from '@/_components';
import { LibraryApps } from './LibraryApps';

class Library extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {}

  render() {
    return (
      <div className="wrapper org-users-page">
        <Header switchDarkMode={this.props.switchDarkMode} darkMode={this.props.darkMode} />

        <div className="page-wrapper">
          <div className="page-body">
            <div className="container-xl">
              <LibraryApps />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export { Library };
