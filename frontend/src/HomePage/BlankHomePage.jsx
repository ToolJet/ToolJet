import React from 'react';
import Layout from '@/_ui/Layout';
import GetStartedHome from '../GetStarted/GetStartedHome';
import { withTranslation } from 'react-i18next';
import { withRouter } from '@/_hoc/withRouter';
import { useLicenseStore } from '@/_stores/licenseStore';
import { shallow } from 'zustand/shallow';
import './styles/get-started.scss';

class HomePageComponent extends React.Component {
  render() {
    const { isToolJetCloud } = this.props;
    return (
      <Layout
        showNewHeader
        shouldWrapContentBody={false}
        darkMode={this.props.darkMode}
        switchDarkMode={this.props.switchDarkMode}
      >
        <main className="wrapper get-started-page">
          <GetStartedHome isToolJetCloud={isToolJetCloud} />
        </main>
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
