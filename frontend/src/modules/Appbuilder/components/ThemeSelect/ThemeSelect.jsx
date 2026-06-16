import React from 'react';
import EEThemeSelect from '@ee/modules/Appbuilder/components/ThemeSelect';
const ThemeSelect = () => {
  return <></>;
};
export default process.env.TOOLJET_EDITION === 'ce' ? ThemeSelect : EEThemeSelect;
