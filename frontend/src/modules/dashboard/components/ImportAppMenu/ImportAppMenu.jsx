import React from 'react';
import BaseImportAppMenu from '@/modules/common/components/BaseImportAppMenu';
import EEImportAppMenu from '@ee/modules/Dashboard/components/ImportAppMenu';
const ImportAppMenu = (props) => {
  return <BaseImportAppMenu {...props} />;
};
export default process.env.TOOLJET_EDITION === 'ce' ? ImportAppMenu : EEImportAppMenu;
