import React from 'react';
import cx from 'classnames';
import { HeaderSection } from '@/_ui/LeftSidebar';
import SlugInput from './SlugInput';
import CanvasSettings from './CanvasSettings';
import AppExport from './AppExport';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import AppModeToggle from './AppModeToggle';
import { ThemeSelect } from '@/modules/Appbuilder/components';
import MaintenanceMode from './MaintenanceMode';
import HideHeaderToggle from './HideHeaderToggle';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { Button as ButtonComponent } from '@/components/ui/Button/Button';
import './styles.scss'

const GlobalSettings = ({ darkMode, toggleLeftSidebar }) => {
  const shouldFreeze = useStore((state) => state.getShouldFreeze());

  return (
    <ModuleProvider moduleId={'canvas'}>
      <div className='w-full'>
        <div bsPrefix="global-settings-popover" className="global-settings-panel">
          <HeaderSection>
            <HeaderSection.PanelHeader title="Global settings">
              <div className="d-flex justify-content-end" style={{ gap: '2px' }}>
                <ButtonComponent
                  iconOnly
                  leadingIcon={'x'}
                  onClick={() => toggleLeftSidebar(false)}
                  variant="ghost"
                  fill="var(--icon-strong,#6A727C)"
                  size="medium"
                  data-cy="global-settings-close-button"
                  isLucid={true}
                />
              </div>
            </HeaderSection.PanelHeader>
          </HeaderSection>
          <div className="card-body" style={{ paddingBottom: '0px' }}>
            <SlugInput />
          </div>
          <div style={{ padding: '16px' }} className={cx({ disabled: shouldFreeze })}>
            <MaintenanceMode darkMode={darkMode} />
          </div>
          <div className="d-flex w-100" style={{ padding: '16px' }}>
            <AppExport darkMode={darkMode} />
          </div>
          <div className={cx({ 'dark-theme': darkMode })}>
            <span className="canvas-styles-header">Canvas Styles</span>
          </div>
          <div style={{ padding: '16px' }} className={cx({ disabled: shouldFreeze })}>
            <div className="tj-text-xsm color-slate12 ">
              <CanvasSettings darkMode={darkMode} />
              <AppModeToggle darkMode={darkMode} />
              <ThemeSelect darkMode={darkMode} />
            </div>
          </div>
        </div>
      </div>
    </ModuleProvider>
  );
};

export default GlobalSettings;
