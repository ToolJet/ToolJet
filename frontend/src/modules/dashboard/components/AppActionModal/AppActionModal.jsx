import React from 'react';
import BaseAppActionModal from '@/modules/common/components/BaseAppActionModal';
import EEAppActionModal from '@ee/modules/Dashboard/components/AppActionModal';
const AppActionModal = (props) => {
  return <BaseAppActionModal {...props} />;
};
export default process.env.TOOLJET_EDITION === 'ce' ? AppActionModal : EEAppActionModal;
