import React from 'react';
import { IconEyeClosed, IconEye } from '@tabler/icons-react';

import { BaseInput } from './BaseComponents/BaseInput';
import { useInput } from './BaseComponents/hooks/useInput';

export const PasswordInput = (props) => {
  const inputLogic = useInput(props);
  const toggleVisibility = () => {
    inputLogic.setIconVisibility(!inputLogic.iconVisibility);
  };

  const TogglePasswordVisibilityIcon = !inputLogic.iconVisibility ? IconEye : IconEyeClosed;

  const passwordIcon = (
    <div onClick={toggleVisibility}>
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
