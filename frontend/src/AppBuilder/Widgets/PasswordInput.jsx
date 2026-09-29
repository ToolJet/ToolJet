import React, { useState } from 'react';
import { IconEyeClosed, IconEye } from '@tabler/icons-react';

import { BaseInput } from './BaseComponents/BaseInput';
import { useInput } from './BaseComponents/hooks/useInput';

export const PasswordInput = (props) => {
  const inputLogic = useInput(props);
  // Owned here, not by useInput: no other input widget reveals its value, and the
  // hook never read this. Distinct from `styles.iconVisibility`, the left-icon gate.
  const [isRevealed, setIsRevealed] = useState(false);
  const toggleVisibility = () => {
    setIsRevealed(!isRevealed);
  };

  const TogglePasswordVisibilityIcon = !isRevealed ? IconEye : IconEyeClosed;

  const passwordIcon = (
    <div onClick={toggleVisibility} data-cy={`password-visibility-icon`}>
      <TogglePasswordVisibilityIcon size={16} color="var(--icons-weak-disabled)" />
    </div>
  );

  return (
    <BaseInput
      {...props}
      {...inputLogic}
      inputType={isRevealed ? 'text' : 'password'}
      additionalInputProps={{ autoComplete: 'new-password' }}
      rightIcon={!inputLogic.loading && passwordIcon}
    />
  );
};
