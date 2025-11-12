import React from 'react';
import { IconEyeClosed, IconEye } from '@tabler/icons-react';

import { BaseInput } from './BaseComponents/BaseInput';
import { useInput } from './BaseComponents/hooks/useInput';

export const PasswordInput = (props) => {
  const inputLogic = useInput(props);
  const toggleVisibility = () => {
    inputLogic.setIconVisibility(!inputLogic.iconVisibility);
  };
  const { width, direction, auto, alignment } = props?.styles || {};
  const defaultAlignment = alignment === 'side' || alignment === 'top' ? alignment : 'side';
  const { label } = props?.properties || {};
  const { labelWidth } = inputLogic;

  const TogglePasswordVisibilityIcon = !inputLogic.iconVisibility ? IconEye : IconEyeClosed;

  const passwordIcon = (
    <div
      onClick={toggleVisibility}
      style={{
        width: '16px',
        height: '16px',
        position: 'absolute',
        right:
          direction === 'right' &&
          defaultAlignment === 'side' &&
          ((label?.length > 0 && width > 0) || (auto && width == 0 && label && label?.length != 0))
            ? `${labelWidth + 11}px`
            : '11px',
        top: `${
          defaultAlignment === 'top'
            ? ((label?.length > 0 && width > 0) || (auto && width == 0 && label && label?.length != 0)) &&
              'calc(50% + 10px)'
            : ''
        }`,
        transform:
          defaultAlignment === 'top' &&
          ((label?.length > 0 && width > 0) || (auto && width == 0 && label && label?.length != 0)) &&
          ' translateY(-50%)',
        display: 'flex',
        zIndex: 3,
      }}
      stroke={1.5}
    >
      <TogglePasswordVisibilityIcon size={16} color="var(--icons-weak-disabled)" />
    </div>
  );

  return (
    <BaseInput
      {...props}
      {...inputLogic}
      inputType={inputLogic.iconVisibility ? 'text' : 'password'}
      additionalInputProps={{ autoComplete: 'new-password' }}
      rightIcon={!inputLogic.loading && passwordIcon}
    />
  );
};
