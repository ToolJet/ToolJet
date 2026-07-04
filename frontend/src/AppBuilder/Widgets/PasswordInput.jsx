import React from 'react';
import { IconEyeClosed, IconEye } from '@tabler/icons-react';

import { BaseInput } from './BaseComponents/BaseInput';
import { useControlledInput } from './BaseComponents/hooks/useControlledInput';

export const PasswordInput = (props) => {
  const inputLogic = useControlledInput(props);
  const toggleVisibility = () => {
    inputLogic.setIconVisibility(!inputLogic.iconVisibility);
  };

  const TogglePasswordVisibilityIcon = !inputLogic.iconVisibility ? IconEye : IconEyeClosed;

  const passwordIcon = (
    <div onClick={toggleVisibility} data-cy={`password-visibility-icon`}>
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
