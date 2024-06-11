import React from 'react';
import ToggleGroup from '@/ToolJetUI/SwitchGroup/ToggleGroup';
import ToggleGroupItem from '@/ToolJetUI/SwitchGroup/ToggleGroupItem';
import { useCurrentStateStore } from '@/_stores/currentStateStore';

const MODES = [
  { label: 'Text only', value: 'text' },
  { label: 'Text + icon', value: 'texticon' },
  { label: 'Icon only', value: 'icon' },
];

const LabelStyleToggle = ({ pageSettingsChanged, settings }) => {
  const {
    definition: { properties },
  } = settings;
  const { style } = properties;
  return (
    <div className="d-flex align-items-center mb-3">
      <span>Style</span>
      <div className="ms-auto position-relative app-mode-switch" style={{ paddingLeft: '0px', width: '158px' }}>
        <ToggleGroup
          className="label-style"
          onValueChange={(value) => {
            useCurrentStateStore.getState().actions.setCurrentState({
              pageSettings: {
                ...settings,
                properties: {
                  ...settings.properties,
                  style: value,
                },
              },
            });
            pageSettingsChanged({ style: value }, 'properties');
          }}
          defaultValue={style}
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

export default LabelStyleToggle;
