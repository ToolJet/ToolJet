import React, { useState } from 'react';
import ToggleGroup from '@/ToolJetUI/SwitchGroup/ToggleGroup';
import ToggleGroupItem from '@/ToolJetUI/SwitchGroup/ToggleGroupItem';
import { ProgramaticallyHandleProperties } from '../ProgramaticallyHandleProperties';
import { Icon as IconPicker } from '@/AppBuilder/CodeBuilder/Elements/Icon';
import AlignLeftinspector from '@/_ui/Icon/solidIcons/AlignLeftinspector';
import AlignRightinspector from '@/_ui/Icon/solidIcons/AlignRightinspector';

export const ButtonStylesTab = ({
  button,
  index,
  darkMode,
  currentState,
  onButtonPropertyChange,
  onButtonPropertiesChange,
  component,
}) => {
  const [buttonType, setButtonType] = useState(button?.buttonType || 'solid');
  const isSolid = buttonType === 'solid';

  // Label colors considered "default" that should be swapped on mode change
  const DEFAULT_LABEL = [
    '#FFFFFF',
    '#ffffff',
    'var(--cc-surface1-surface)',
    'var(--text-on-solid)',
    'var(--cc-primary-text)',
  ];

  const handleTypeChange = (value) => {
    setButtonType(value);

    // Batch buttonType + label color change in a single update to avoid stale closure
    const updates = { buttonType: value };
    if (!button?.buttonLabelColor || DEFAULT_LABEL.includes(button.buttonLabelColor)) {
      updates.buttonLabelColor = value === 'outline' ? 'var(--cc-primary-text)' : '#FFFFFF';
    }
    onButtonPropertiesChange(updates);
  };

  if (!button) return null;

  return (
    <div className="d-flex flex-column custom-gap-16">
      {/* Button type - Solid/Outline */}
      <div className="field d-flex align-items-center justify-content-between px-3">
        <label className="tj-text-xsm color-slate12">Button type</label>
        <ToggleGroup onValueChange={handleTypeChange} defaultValue={buttonType}>
          <ToggleGroupItem value="solid">Solid</ToggleGroupItem>
          <ToggleGroupItem value="outline">Outline</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Background color - only shown in Solid mode (matches Button widget behavior) */}
      {isSolid && (
        <div className="field px-3">
          <ProgramaticallyHandleProperties
            label="Background"
            currentState={currentState}
            index={index}
            darkMode={darkMode}
            callbackFunction={(_, prop, val) => onButtonPropertyChange(prop, val)}
            property="buttonBackgroundColor"
            props={button}
            component={component}
            paramMeta={{ type: 'colorSwatches', displayName: 'Background' }}
            paramType="properties"
          />
        </div>
      )}

      {/* Label color */}
      <div className="field px-3">
        <ProgramaticallyHandleProperties
          label="Label color"
          currentState={currentState}
          index={index}
          darkMode={darkMode}
          callbackFunction={(_, prop, val) => onButtonPropertyChange(prop, val)}
          property="buttonLabelColor"
          props={button}
          component={component}
          paramMeta={{ type: 'colorSwatches', displayName: 'Label color' }}
          paramType="properties"
        />
      </div>

      {/* Border color */}
      <div className="field px-3">
        <ProgramaticallyHandleProperties
          label="Border color"
          currentState={currentState}
          index={index}
          darkMode={darkMode}
          callbackFunction={(_, prop, val) => onButtonPropertyChange(prop, val)}
          property="buttonBorderColor"
          props={button}
          component={component}
          paramMeta={{ type: 'colorSwatches', displayName: 'Border color' }}
          paramType="properties"
        />
      </div>

      {/* Loader color */}
      <div className="field px-3">
        <ProgramaticallyHandleProperties
          label="Loader color"
          currentState={currentState}
          index={index}
          darkMode={darkMode}
          callbackFunction={(_, prop, val) => onButtonPropertyChange(prop, val)}
          property="buttonLoaderColor"
          props={button}
          component={component}
          paramMeta={{ type: 'colorSwatches', displayName: 'Loader color' }}
          paramType="properties"
        />
      </div>

      {/* Icon - picker with visibility toggle */}
      <div className="field d-flex align-items-center justify-content-between px-3">
        <label className="tj-text-xsm color-slate12">Icon</label>
        <IconPicker
          value={button?.buttonIconName || 'IconHome2'}
          onChange={(value) => onButtonPropertyChange('buttonIconName', value)}
          onVisibilityChange={(value) => onButtonPropertyChange('buttonIconVisibility', value)}
          styleDefinition={{ iconVisibility: { value: button?.buttonIconVisibility ?? false } }}
          component={component}
          isVisibilityEnabled={true}
        />
      </div>

      {/* Icon color */}
      <div className="field px-3">
        <ProgramaticallyHandleProperties
          label="Icon color"
          currentState={currentState}
          index={index}
          darkMode={darkMode}
          callbackFunction={(_, prop, val) => onButtonPropertyChange(prop, val)}
          property="buttonIconColor"
          props={button}
          component={component}
          paramMeta={{ type: 'colorSwatches', displayName: '', showLabel: false }}
          paramType="properties"
        />
      </div>

      {/* Icon alignment */}
      <div className="field d-flex align-items-center justify-content-between px-3">
        <label className="tj-text-xsm color-slate12"></label>
        <ToggleGroup
          onValueChange={(_value) => onButtonPropertyChange('buttonIconAlignment', _value)}
          defaultValue={button?.buttonIconAlignment || 'left'}
        >
          <ToggleGroupItem value="left">
            <AlignLeftinspector width={14} fill="#C1C8CD" />
          </ToggleGroupItem>
          <ToggleGroupItem value="right">
            <AlignRightinspector width={14} fill="#C1C8CD" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Border radius */}
      <div className="field px-3">
        <ProgramaticallyHandleProperties
          label="Border radius"
          currentState={currentState}
          index={index}
          darkMode={darkMode}
          callbackFunction={(_, prop, val) => onButtonPropertyChange(prop, val)}
          property="buttonBorderRadius"
          props={button}
          component={component}
          paramMeta={{ type: 'numberInput', displayName: 'Border radius' }}
          paramType="properties"
        />
      </div>
    </div>
  );
};
