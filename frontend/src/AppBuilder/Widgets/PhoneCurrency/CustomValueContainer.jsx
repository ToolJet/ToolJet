import React from 'react';
import { components } from 'react-select';
// eslint-disable-next-line import/no-unresolved
import flags from 'react-phone-number-input/flags';
import Planet from '@/_ui/Icon/bulkIcons/Planet';
import { getCountryCallingCodeSafe } from './utils';
import { CurrencyMap } from './constants';

export const CustomValueContainer = ({ getValue, ...props }) => {
  const selectedValue = getValue()[0];
  const country = selectedValue?.value;
  const { isCurrencyInput, isCountryChangeEnabled, showFlag = true } = props?.selectProps || {};
  const FlagIcon = selectedValue ? flags[selectedValue.value] : null;
  const countryCode = getCountryCallingCodeSafe(selectedValue.value);

  return (
    <components.ValueContainer {...props}>
      {FlagIcon && showFlag ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            marginLeft: isCountryChangeEnabled ? '4px' : '0px',
          }}
        >
          <>
            <FlagIcon style={{ height: '16px' }} />{' '}
            <span style={{ marginLeft: '6px', color: 'var(--cc-primary-text)' }}>
              {isCurrencyInput ? ` ${CurrencyMap?.[country]?.prefix}` : ` +${countryCode}`}
            </span>
          </>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            marginLeft: isCurrencyInput ? '6px' : '17px',
            justifyContent: 'center',
          }}
        >
          {showFlag ? (
            <span style={{ marginTop: '4px' }}>
              <Planet width={24} height={24} />
            </span>
          ) : (
            <span style={{ color: 'var(--cc-primary-text)' }}>
              {isCurrencyInput && ` ${CurrencyMap?.[country]?.prefix}`}
            </span>
          )}
        </div>
      )}
    </components.ValueContainer>
  );
};
