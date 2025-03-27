import React from 'react';
import { components } from 'react-select';
// eslint-disable-next-line import/no-unresolved
import flags from 'react-phone-number-input/flags';
import TickV3 from '@/_ui/Icon/solidIcons/TickV3';

export const CustomOption = (props) => {
  const { label, value: optionValue, isSelected, darkMode } = props;

  const optionStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'start',
    minHeight: '32px',
    gap: '6px',
    cursor: 'pointer',
    fontFamily: 'IBM Plex Sans',
    fontSize: '12px',
    lineHeight: '18px',
    fontWeight: '400',
    color: darkMode ? '#fff' : '#1B1F24',
    width: '100%',
  };
  const FlagIcon = flags[optionValue];

  return (
    <components.Option {...props}>
      <div style={optionStyle}>
        <div>{FlagIcon ? <FlagIcon style={{ width: '22px', height: '16px' }} /> : null}</div>
        {label}
        <div style={{ marginLeft: 'auto', display: isSelected ? 'block' : 'none' }}>
          <TickV3 width="13.33px" height="11.27px" />
        </div>
      </div>
    </components.Option>
  );
};
