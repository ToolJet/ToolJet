import React from 'react';
import SwitchComponent from '@/components/ui/Switch/Index';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
const HideHeaderToggle = () => {
  const { globalSettings, globalSettingsChanged } = useStore(
    (state) => ({
      globalSettings: state.globalSettings,
      globalSettingsChanged: state.globalSettingsChanged,
    }),
    shallow
  );

  const { hideHeader } = globalSettings || {};

  return (
    <div className="tw-flex tw-mb-3">
      <SwitchComponent
        align="right"
        label="Hide header for launched apps"
        size="default"
        checked={hideHeader}
        onCheckedChange={(e) => globalSettingsChanged({ hideHeader: e })}
        data-cy={`toggle-hide-header-for-launched-apps`}
        className="tw-w-full"
      />
    </div>
  );
};

export default HideHeaderToggle;
