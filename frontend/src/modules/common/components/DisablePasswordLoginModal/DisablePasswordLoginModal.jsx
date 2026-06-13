import React from 'react';
import BaseDisablePasswordLoginModal from '@/modules/common/components/DisablePasswordLoginModal/BaseDisablePasswordLoginModal';
import EEDisablePasswordLoginModal from '@ee/modules/common/components/DisablePasswordLoginModal';

function DisablePasswordLoginModal(props) {
  return <BaseDisablePasswordLoginModal {...props} />;
}

export default process.env.TOOLJET_EDITION === 'ce' ? DisablePasswordLoginModal : EEDisablePasswordLoginModal;
