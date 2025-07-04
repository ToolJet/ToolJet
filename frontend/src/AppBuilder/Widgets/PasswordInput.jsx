import React from 'react';
import { BaseInput } from './BaseComponents/BaseInput';
import { useInput } from './BaseComponents/hooks/useInput';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const PasswordInput = (props) => {
  const inputLogic = useInput(props);

  const toggleVisibility = () => {
    inputLogic.setIconVisibility(!inputLogic.iconVisibility);
  };

  // Get alignment and label info from styles and properties
  const { alignment, width, auto, direction } = props.styles;
  const { label } = props.properties;
  const defaultAlignment = alignment === 'side' || alignment === 'top' ? alignment : 'side';

  // Calculate positioning based on alignment
  const getRightIconPosition = () => {
    const hasLabel = (label?.length > 0 && width > 0) || (auto && width == 0 && label && label?.length != 0);

    const position = {
      right:
        direction === 'right' && defaultAlignment === 'side' && hasLabel ? `${inputLogic.labelWidth + 11}px` : '11px',
    };

    if (defaultAlignment === 'top' && hasLabel) {
      position.top = 'calc(50% + 10px)';
      position.transform = 'translateY(-50%)';
    } else {
      position.top = '50%';
      position.transform = 'translateY(-50%)';
    }

    return position;
  };

  const passwordIcon = (
    <div
      onClick={toggleVisibility}
      style={{
        width: '16px',
        height: '16px',
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3,
        ...getRightIconPosition(),
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
