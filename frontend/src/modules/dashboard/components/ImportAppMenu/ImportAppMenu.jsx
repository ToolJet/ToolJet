import React from 'react';
import BaseImportAppMenu from '@/modules/common/components/BaseImportAppMenu';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
const ImportAppMenu = (props) => {
  return <BaseImportAppMenu {...props} />;
};
export default withEditionSpecificComponent(ImportAppMenu, 'Dashboard');
