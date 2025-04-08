import React from 'react';
import BaseAppActionModal from '@/modules/common/components/BaseAppActionModal';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
const AppActionModal = (props) => {
  return <BaseAppActionModal {...props} />;
};
export default withEditionSpecificComponent(AppActionModal, 'Dashboard');
