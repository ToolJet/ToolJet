import React from 'react';
import cx from 'classnames';
import { HeaderSection } from '@/_ui/LeftSidebar';
import SlugInput from './SlugInput';
import CanvasSettings from './CanvasSettings';
import AppExport from './AppExport';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import AppModeToggle from './AppModeToggle';

const GlobalSettings = ({ darkMode, isModuleEditor }) => {
  const shouldFreeze = useStore((state) => state.getShouldFreeze());

  if (isModuleEditor) {
    return (
      <div>
        <div bsPrefix="global-settings-popover" className="global-settings-panel">
          <HeaderSection>
            <HeaderSection.PanelHeader title="Global settings" />
          </HeaderSection>
          <div style={{ padding: '12px 16px' }} className={cx({ disabled: shouldFreeze })}>
            <div className="tj-text-xsm color-slate12 ">
              <AppExport darkMode={darkMode} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        <div bsPrefix="global-settings-popover" className="global-settings-panel">
          <HeaderSection>
            <HeaderSection.PanelHeader title="Global settings" />
          </HeaderSection>
          <div className="card-body">
            <SlugInput />
          </div>
          <div style={{ padding: '12px 16px' }} className={cx({ disabled: shouldFreeze })}>
            <div className="tj-text-xsm color-slate12 ">
              <CanvasSettings darkMode={darkMode} />
              <AppModeToggle darkMode={darkMode} />
              <AppExport darkMode={darkMode} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GlobalSettings;
