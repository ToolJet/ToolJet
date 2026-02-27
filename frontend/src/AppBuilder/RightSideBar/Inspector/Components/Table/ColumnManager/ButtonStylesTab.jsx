import React from 'react';
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
  component,
}) => {
  if (!button) return null;

  return (
    <div className="d-flex flex-column custom-gap-16">
      {/* Button type - Solid/Outline */}
      <div className="field d-flex custom-gap-12 align-items-center align-self-stretch justify-content-between px-3">
        <label className="d-flex align-items-center" style={{ flex: '1 1 0' }}>
          Button type
        </label>
        <ToggleGroup
          onValueChange={(_value) => onButtonPropertyChange('buttonType', _value)}
          defaultValue={button?.buttonType || 'solid'}
          style={{ flex: '1 1 0' }}
        >
          <ToggleGroupItem value="solid">Solid</ToggleGroupItem>
          <ToggleGroupItem value="outline">Outline</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Background color */}
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

      {/* Icon - picker with visibility toggle */}
      <div className="field d-flex custom-gap-12 align-items-center align-self-stretch justify-content-between px-3">
        <label className="d-flex align-items-center" style={{ flex: '1 1 0' }}>
          Icon
        </label>
        <div style={{ flex: '1 1 0' }}>
          <IconPicker
            value={button?.buttonIconName || 'IconHome2'}
            onChange={(value) => onButtonPropertyChange('buttonIconName', value)}
            onVisibilityChange={(value) => onButtonPropertyChange('buttonIconVisibility', value)}
            styleDefinition={{ iconVisibility: { value: button?.buttonIconVisibility ?? false } }}
            component={component}
            isVisibilityEnabled={true}
          />
        </div>
      </div>

      {/* Icon color */}
      <div className="field d-flex justify-content-end px-3">
        <div style={{ flex: '1 1 0' }} />
        <div style={{ flex: '1 1 0' }}>
          <ProgramaticallyHandleProperties
            label="Icon color"
            currentState={currentState}
            index={index}
            darkMode={darkMode}
            callbackFunction={(_, prop, val) => onButtonPropertyChange(prop, val)}
            property="buttonIconColor"
            props={button}
            component={component}
            paramMeta={{ type: 'colorSwatches', displayName: ' ', showLabel: false }}
            paramType="properties"
          />
        </div>
      </div>

      {/* Icon alignment */}
      <div className="field d-flex custom-gap-12 align-items-center align-self-stretch justify-content-between px-3">
        <div style={{ flex: '1 1 0' }} />
        <ToggleGroup
          onValueChange={(_value) => onButtonPropertyChange('buttonIconAlignment', _value)}
          defaultValue={button?.buttonIconAlignment || 'left'}
          style={{ flex: '1 1 0' }}
        >
          <ToggleGroupItem value="left">
            <AlignLeftinspector width={14} fill="#C1C8CD" />
          </ToggleGroupItem>
          <ToggleGroupItem value="right">
            <AlignRightinspector width={14} fill="#C1C8CD" />
          </ToggleGroupItem>
        </ToggleGroup>
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
