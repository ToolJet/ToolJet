import React from 'react';
import BaseSSOAuthModule from './components/BaseSSOAuthModule/index.js';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';

const SSOAuthModule = (props) => {
  return (
    <>
      <BaseSSOAuthModule {...props} />
    </>
  );
};

export default withEditionSpecificComponent(SSOAuthModule, 'common');
