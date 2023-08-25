import React from 'react';
import ToggleGroup from '@/ToolJetUI/SwitchGroup/ToggleGroup';
import ToggleGroupItem from '@/ToolJetUI/SwitchGroup/ToggleGroupItem';
import AlignLeft from '@/_ui/Icon/solidIcons/AlignLeft';
import AlignCenter from '@/_ui/Icon/solidIcons/AlignCenter';
import AlignRight from '@/_ui/Icon/solidIcons/AlignRight';
import AlignJustify from '@/_ui/Icon/solidIcons/AlignJustify';

export const AlignButtons = ({ value, onChange, forceCodeBox, meta }) => {
  function handleOptionChanged(_value) {
    onChange(_value);
  }
  return (
    <ToggleGroup onValueChange={handleOptionChanged} defaultValue={value} className="inspector-align-buttons">
      <ToggleGroupItem value="left">
        <AlignLeft width={14} />
      </ToggleGroupItem>
      <ToggleGroupItem value="center">
        <AlignCenter width={14} />
      </ToggleGroupItem>
      <ToggleGroupItem value="right">
        <AlignRight width={14} />
      </ToggleGroupItem>
      <ToggleGroupItem value="justify">
        <AlignJustify width={14} />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};
