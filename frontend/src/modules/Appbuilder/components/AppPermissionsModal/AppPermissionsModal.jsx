import React from 'react';
import EEAppPermissionsModal from '@ee/modules/Appbuilder/components/AppPermissionsModal';

const AppPermissionsModal = () => {
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? AppPermissionsModal : EEAppPermissionsModal;
