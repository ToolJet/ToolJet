import React from 'react';
import { withTranslation } from 'react-i18next';
import RealTimeEditor from '@/AppBuilder/RealTimeEditor';

const RenderAppBuilder = React.memo((props) => {
  return <RealTimeEditor {...props} />;
});

export default withTranslation()(RenderAppBuilder);
