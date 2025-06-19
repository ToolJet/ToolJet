import React from 'react';
import cx from 'classnames';
import Layout from '@/_ui/Layout';
import { OrganizationList } from '@/modules/dashboard/components';
import GetStartedHome from '../GetStarted/GetStartedHome';
import { withTranslation } from 'react-i18next';
import { withRouter } from '@/_hoc/withRouter';
import { useLicenseStore } from '@/_stores/licenseStore';
import { shallow } from 'zustand/shallow';
import './styles/get-started.scss';

class HomePageComponent extends React.Component {
  render() {
    return (
      <Layout switchDarkMode={this.props.switchDarkMode} darkMode={this.props.darkMode} collapseSidebar={true}>
        <div className="wrapper get-started-page">
          <GetStartedHome />
          <div className="get-started-footer">
            <OrganizationList />
          </div>
        </div>
      </Layout>
    );
  }
}

const withStore = (Component) => (props) => {
  const { featureAccess, featuresLoaded } = useLicenseStore(
    (state) => ({
      featureAccess: state.featureAccess,
      featuresLoaded: state.featuresLoaded,
    }),
    shallow
  );
  return <Component {...props} featureAccess={featureAccess} featuresLoaded={featuresLoaded} />;
};

const BlankHomePage = withTranslation()(withStore(withRouter(HomePageComponent)));

export default BlankHomePage;
