import React from 'react';
import { components } from 'react-select';
// eslint-disable-next-line import/no-unresolved
import flags from 'react-phone-number-input/flags';
import Planet from '@/_ui/Icon/bulkIcons/Planet';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { getCountryCallingCodeSafe } from './utils';
import { CurrencyMap } from './constants';

export const CustomValueContainer = ({ getValue, ...props }) => {
  const selectedValue = getValue()[0];
  const country = selectedValue?.value;
  const menuIsOpen = props?.selectProps?.menuIsOpen;
  const { isCurrencyInput, isCountryChangeEnabled } = props?.selectProps || {};
  const FlagIcon = selectedValue ? flags[selectedValue.value] : null;
  const countryCode = getCountryCallingCodeSafe(selectedValue.value);

  return (
    <components.ValueContainer {...props}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          marginLeft: '10px',
        }}
      >
        {FlagIcon ? (
          <>
            <FlagIcon
              style={{
                height: '18px',
                border: '2px solid var(--cc-primary-white, #FFFFFF)',
                borderRadius: '3px',
              }}
            />{' '}
            <span style={{ marginLeft: '4px' }}>
              {isCurrencyInput ? ` ${CurrencyMap?.[country]?.prefix}` : ` +${countryCode}`}
            </span>
          </>
        ) : (
          <div
            style={{
              display: 'flex',
              marginTop: '4px',
              justifyContent: 'center',
            }}
          >
            <Planet width={24} height={24} />
          </div>
        )}

        <div style={{ position: 'relative', display: 'flex', marginLeft: '8px', marginRight: '13px' }}>
          {menuIsOpen ? (
            <SolidIcon name="TriangleDownCenter" width="16" height="16" />
          ) : (
            <SolidIcon name="TriangleUpCenter" width="16" height="16" />
          )}
        </div>
      </div>
    </components.ValueContainer>
  );
};
