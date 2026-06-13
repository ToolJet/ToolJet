import React from 'react';
import BaseCreateDraftVersionModal from '@/modules/common/components/BaseCreateDraftVersionModal';
import EECreateDraftVersionModal from '@ee/modules/Appbuilder/components/CreateDraftVersionModal';
const CreateDraftVersionModal = (props) => {
  return <BaseCreateDraftVersionModal {...props} />;
};
export default process.env.TOOLJET_EDITION === 'ce' ? CreateDraftVersionModal : EECreateDraftVersionModal;
