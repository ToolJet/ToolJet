// src/modules/Settings/components/SettingsMenu/SettingsMenu.jsx
import React from 'react';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
import BaseSettingsMenu from '@/modules/common/components/BaseSettingsMenu';

function SettingsMenu(props) {
  return <BaseSettingsMenu {...props} />;
}

export default withEditionSpecificComponent(SettingsMenu, 'Dashboard');
