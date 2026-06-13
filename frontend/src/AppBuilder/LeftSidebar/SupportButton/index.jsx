import React from 'react';
import EESupportButton from '@ee/modules/Appbuilder/components/SupportButton';

const SupportButton = () => {
  return null;
};

export default process.env.TOOLJET_EDITION === 'ce' ? SupportButton : EESupportButton;
