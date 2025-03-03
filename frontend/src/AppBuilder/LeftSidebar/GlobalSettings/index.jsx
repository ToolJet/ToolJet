import React from 'react';
import cx from 'classnames';
import { HeaderSection } from '@/_ui/LeftSidebar';
import SlugInput from './SlugInput';
import CanvasSettings from './CanvasSettings';
import AppExport from './AppExport';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import AppModeToggle from './AppModeToggle';
import ThemeSelect from './ThemeSelect';

const GlobalSettings = ({ darkMode }) => {
  const shouldFreeze = useStore((state) => state.getShouldFreeze());

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
              <ThemeSelect darkMode={darkMode} />
              <AppExport darkMode={darkMode} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GlobalSettings;
