import React from 'react';
import BaseSSOAuthModule from './components/BaseSSOAuthModule/index.js';
import EESSOAuthModule from '@ee/modules/common/components/SSOAuthModule';

const SSOAuthModule = (props) => {
  return (
    <>
      <BaseSSOAuthModule {...props} />
    </>
  );
};

export default process.env.TOOLJET_EDITION === 'ce' ? SSOAuthModule : EESSOAuthModule;
