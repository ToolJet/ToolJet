import React from 'react';
import { BaseInput } from './BaseComponents/BaseInput';
import { useInput } from './BaseComponents/hooks/useInput';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const PasswordInput = (props) => {
  const inputLogic = useInput(props);

  const toggleVisibility = () => {
    inputLogic.setIconVisibility(!inputLogic.iconVisibility);
  };

  const passwordIcon = (
    <div
      onClick={toggleVisibility}
      style={{
        width: '16px',
        height: '16px',
        position: 'absolute',
        right: '11px',
        display: 'flex',
        zIndex: 3,
      }}
    >
      <SolidIcon
        width={16}
        fill={'var(--icons-weak-disabled)'}
        className="password-component-eye"
        name={!inputLogic.iconVisibility ? 'eye1' : 'eyedisable'}
      />
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
