import React from 'react';
import BaseCreateVersionModal from '@/modules/common/components/BaseCreateVersionModal';
import EECreateVersionModal from '@ee/modules/Appbuilder/components/CreateVersionModal';
const CreateVersionModal = (props) => {
  return <BaseCreateVersionModal {...props} />;
};
export default process.env.TOOLJET_EDITION === 'ce' ? CreateVersionModal : EECreateVersionModal;
