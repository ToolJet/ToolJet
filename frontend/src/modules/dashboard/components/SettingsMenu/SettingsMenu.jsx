// src/modules/Settings/components/SettingsMenu/SettingsMenu.jsx
import React from 'react';
import BaseSettingsMenu from '@/modules/common/components/BaseSettingsMenu';
import EESettingsMenu from '@ee/modules/Dashboard/components/SettingsMenu';

function SettingsMenu(props) {
  return <BaseSettingsMenu {...props} />;
}

export default process.env.TOOLJET_EDITION === 'ce' ? SettingsMenu : EESettingsMenu;
