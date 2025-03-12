import React from 'react';
import { withTranslation } from 'react-i18next';
import { RealtimeEditor } from '@/Editor/RealtimeEditor';

const RenderAppBuilder = React.memo((props) => {
  return <RealtimeEditor {...props} />;
});

export default withTranslation()(RenderAppBuilder);
