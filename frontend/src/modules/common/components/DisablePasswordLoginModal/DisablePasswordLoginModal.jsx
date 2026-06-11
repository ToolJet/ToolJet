import React from 'react';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
import BaseDisablePasswordLoginModal from '@/modules/common/components/DisablePasswordLoginModal/BaseDisablePasswordLoginModal';

function DisablePasswordLoginModal(props) {
  return <BaseDisablePasswordLoginModal {...props} />;
}

export default withEditionSpecificComponent(DisablePasswordLoginModal, 'common');
