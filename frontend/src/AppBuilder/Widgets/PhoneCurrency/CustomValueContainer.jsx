import React from 'react';
import { components } from 'react-select';
// eslint-disable-next-line import/no-unresolved
import flags from 'react-phone-number-input/flags';
import Planet from '@/_ui/Icon/bulkIcons/Planet';
import { getCountryCallingCodeSafe } from './utils';

export const CustomValueContainer = ({ getValue, ...props }) => {
  const selectedValue = getValue()[0];
  const FlagIcon = selectedValue ? flags[selectedValue.value] : null;
  const countryCode = getCountryCallingCodeSafe(selectedValue.value);

  return (
    <components.ValueContainer {...props}>
      {FlagIcon ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <>
            <FlagIcon style={{ height: '16px' }} /> <span style={{ marginLeft: '2px' }}>{` +${countryCode}`}</span>
          </>
        </div>
      ) : (
        <div style={{ display: 'flex', marginLeft: '17px', marginTop: '4px', justifyContent: 'center' }}>
          <Planet width={24} height={24} />
        </div>
      )}
    </components.ValueContainer>
  );
};
