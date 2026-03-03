import React from 'react';
import cx from 'classnames';
import SlugInput from './SlugInput';
import CanvasSettings from './CanvasSettings';
import AppExport from './AppExport';
import useStore from '@/AppBuilder/_stores/store';
import AppModeToggle from './AppModeToggle';
import ThemeSelect from '@/modules/Appbuilder/components/ThemeSelect';
import MaintenanceMode from './MaintenanceMode';
import GlobalSettingsHeader from './GlobalSettingsHeader';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import Accordion from '@/_ui/Accordion';
import JSLibraries from './JSLibraries';
import './styles.scss';

const GlobalSettings = ({ darkMode, onClose }) => {
  const shouldFreeze = useStore((state) => state.getShouldFreeze());

  const canvasStylesContent = (
    <>
      <CanvasSettings darkMode={darkMode} />
      <AppModeToggle darkMode={darkMode} />
      <ThemeSelect darkMode={darkMode} />
    </>
  );

  const accordionItems = [
    {
      title: 'Canvas styles',
      isOpen: true,
      children: canvasStylesContent,
    },
    {
      title: 'JS Libraries',
      isOpen: false,
      children: <JSLibraries darkMode={darkMode} />,
    },
  ];

  return (
    <ModuleProvider moduleId={'canvas'}>
      <div className={cx('global-settings-panel', { 'dark-theme': darkMode })}>
        {/* Header */}
        <GlobalSettingsHeader darkMode={darkMode} onClose={onClose} />

        {/* Main Content Section */}
        <div className="global-settings-main-content">
          <SlugInput />
          <div className={cx({ disabled: shouldFreeze })}>
            <MaintenanceMode darkMode={darkMode} />
          </div>
          <AppExport darkMode={darkMode} />
        </div>

        {/* Canvas Styles Accordion */}
        <div className={cx('global-settings-accordion', { disabled: shouldFreeze })}>
          <Accordion items={accordionItems} />
        </div>
      </div>
    </ModuleProvider>
  );
};

export default GlobalSettings;
