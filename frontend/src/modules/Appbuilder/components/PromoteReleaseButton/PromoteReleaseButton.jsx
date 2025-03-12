import React from 'react';
import BasePromoteReleaseButton from '@/modules/common/components/BasePromoteReleaseButton';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
const PromoteReleaseButton = (props) => {
  return <BasePromoteReleaseButton {...props} />;
};
export default withEditionSpecificComponent(PromoteReleaseButton, 'Appbuilder');
