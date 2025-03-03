import React, { useState } from 'react';
import ToggleGroup from '@/ToolJetUI/SwitchGroup/ToggleGroup';
import ToggleGroupItem from '@/ToolJetUI/SwitchGroup/ToggleGroupItem';
import cx from 'classnames';
import { Color } from './Color';
import CheckIcon from '@/components/ui/Checkbox/CheckboxUtils/CheckIcon';

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

  return (
    <Color
      value={value}
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
          <CustomOption />
          <CustomOption />
          <CustomOption />
          <CustomOption />
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

const CustomOption = () => {
  return (
    <div className="codebuilder-color-swatches-options">
      <div className="d-flex align-items-center">
        <CheckIcon size="large" fill="#4368E3" />
        <div className="color-icon" />
        <span style={{ marginLeft: '5px' }}>Test</span>
      </div>
    </div>
  );
};
