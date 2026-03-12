import React from 'react';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
import BaseCreateDraftVersionModal from '@/modules/common/components/BaseCreateDraftVersionModal';
const CreateDraftVersionModal = (props) => {
  return <BaseCreateDraftVersionModal {...props} />;
};
export default withEditionSpecificComponent(CreateDraftVersionModal, 'Appbuilder');
