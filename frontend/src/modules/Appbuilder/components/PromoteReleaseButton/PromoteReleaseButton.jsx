import React from 'react';
import BasePromoteReleaseButton from '@/modules/common/components/BasePromoteReleaseButton';
import EEPromoteReleaseButton from '@ee/modules/Appbuilder/components/PromoteReleaseButton';
const PromoteReleaseButton = (props) => {
  return <BasePromoteReleaseButton {...props} />;
};
export default process.env.TOOLJET_EDITION === 'ce' ? PromoteReleaseButton : EEPromoteReleaseButton;
