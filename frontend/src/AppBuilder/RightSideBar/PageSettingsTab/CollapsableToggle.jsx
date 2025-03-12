import React from 'react';
import ToggleGroup from '@/ToolJetUI/SwitchGroup/ToggleGroup';
import ToggleGroupItem from '@/ToolJetUI/SwitchGroup/ToggleGroupItem';
import { useCurrentStateStore } from '@/_stores/currentStateStore';

const MODES = [
  { label: 'True', value: 'true' },
  { label: 'False', value: 'false' },
];

const CollapsableToggle = ({ pageSettingChanged, settings }) => {
  const { definition: { properties = {} } = {} } = settings ?? {};
  const { collapsable } = properties ?? {};

  function stringToBoolean(str) {
    return str.toLowerCase() === 'true';
  }

  return (
    <div className="d-flex align-items-center mb-3">
      <span>Collapsable</span>
      <div className="ms-auto position-relative app-mode-switch" style={{ paddingLeft: '0px' }}>
        <ToggleGroup
          onValueChange={(value) => {
            useCurrentStateStore.getState().actions.setCurrentState({
              pageSettings: {
                ...settings,
                properties: {
                  ...settings.properties,
                  collapsable: stringToBoolean(value),
                },
              },
            });
            pageSettingChanged({ collapsable: stringToBoolean(value) }, 'properties');
          }}
          defaultValue={collapsable?.toString()}
        >
          {MODES.map((mode) => (
            <ToggleGroupItem key={mode.value} value={mode.value}>
              {mode.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
};

export default CollapsableToggle;
