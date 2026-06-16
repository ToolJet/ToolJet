import React from 'react';
import VersionActionButtonsBase from './VersionActionButtons';
import EEVersionActionButtons from '@ee/modules/Appbuilder/components/VersionActionButtons';

const VersionActionButtons = (props) => {
  return <VersionActionButtonsBase {...props} />;
};

export default process.env.TOOLJET_EDITION === 'ce' ? VersionActionButtons : EEVersionActionButtons;
