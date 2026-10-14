import React from 'react';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
import VersionActionButtonsBase from './VersionActionButtons';

const VersionActionButtons = (props) => {
  return <VersionActionButtonsBase {...props} />;
};

export default withEditionSpecificComponent(VersionActionButtons, 'Appbuilder');
