import React from 'react';
import BaseCreateVersionModal from '@/modules/common/components/BaseCreateVersionModal';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
const CreateVersionModal = (props) => {
  return <BaseCreateVersionModal {...props} />;
};
export default withEditionSpecificComponent(CreateVersionModal, 'Appbuilder');
