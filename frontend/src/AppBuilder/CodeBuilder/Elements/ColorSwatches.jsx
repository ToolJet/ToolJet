import React, { useState } from 'react';
import ToggleGroup from '@/ToolJetUI/SwitchGroup/ToggleGroup';
import ToggleGroupItem from '@/ToolJetUI/SwitchGroup/ToggleGroupItem';
import cx from 'classnames';
import { Color } from './Color';
import CheckIcon from '@/components/ui/Checkbox/CheckboxUtils/CheckIcon';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

export const ColorSwatches = ({
  value,
  onChange,
  pickerStyle = {},
  cyLabel,
  asBoxShadowPopover = true,
  meta,
  outerWidth = '142px',
  component,
  styleDefinition,
}) => {
  const [componentType, setComponentType] = useState('color');
  const selectedTheme = useStore((state) => state.globalSettings.theme, shallow);
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const brandColors = selectedTheme?.definition?.brand?.colors || {};
  //Todo: Remove all hardcoded brand once all theme values are added.
  return (
    <Color
      value={value}
      colorMap={Object.keys(brandColors)?.reduce((acc, colorType) => {
        acc[`var(--${colorType}-brand)`] = colorType;
        return acc;
      }, {})}
      onChange={onChange}
      pickerStyle={pickerStyle}
      cyLabel={cyLabel}
      asBoxShadowPopover={asBoxShadowPopover}
      meta={meta}
      outerWidth={outerWidth}
      component={component}
      styleDefinition={styleDefinition}
      componentType={componentType}
      SwatchesToggle={() => (
        <>
          <SwatchesToggle value={componentType} onChange={setComponentType} />
        </>
      )}
      CustomOptionList={() => (
        <div style={{ padding: '8px' }}>
          {Object.keys(brandColors)?.map((colorType, index) => (
            <CustomOption
              color={brandColors[colorType][darkMode ? 'dark' : 'light']}
              colorType={colorType}
              key={index}
              onChange={onChange}
              value={value}
              darkMode={darkMode}
            />
          ))}
        </div>
      )}
    />
  );
};

const SwatchesToggle = ({ value, onChange }) => {
  return (
    <div className={cx('codebuilder-color-swatches-wrapper')}>
      <div className={cx('codebuilder-color-swatches')}>
        <ToggleGroup
          onValueChange={(value) => {
            onChange(value);
          }}
          defaultValue={value}
        >
          <ToggleGroupItem key={'swatches'} value={'swatches'}>
            Swatches
          </ToggleGroupItem>
          <ToggleGroupItem key={'color'} value={'color'}>
            Color picker
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
};

const CustomOption = ({ darkMode, onChange, colorType, color, value }) => {
  const isSelected = `var(--${colorType}-brand)` === value;
  return (
    <div className={cx({ 'dark-theme': darkMode })}>
      <div
        className="codebuilder-color-swatches-options"
        onClick={() => {
          onChange(`var(--${colorType}-brand)`);
        }}
      >
        <div className="d-flex align-items-center">
          {isSelected && <CheckIcon size="large" fill="#4368E3" />}
          <div className="color-icon" style={{ backgroundColor: color, marginLeft: !isSelected && '20px' }} />
          <span style={{ marginLeft: '5px' }}>Brand/{colorType.charAt(0).toUpperCase() + colorType.slice(1)}</span>
        </div>
      </div>
    </div>
  );
};
