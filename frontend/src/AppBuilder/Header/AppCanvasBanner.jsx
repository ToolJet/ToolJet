import React, { useEffect } from 'react';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';

const AppCanvasBanner = () => {
  useEffect(() => {
    console.log('testing console log');
  }, []);
  return <></>;
};

export default withEditionSpecificComponent(AppCanvasBanner, 'Appbuilder');
