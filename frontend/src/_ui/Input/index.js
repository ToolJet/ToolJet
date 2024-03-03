import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import OrgConstantVariablesPreviewBox from '@/_components/OrgConstantsVariablesResolver';
import SolidIcon from '../Icon/SolidIcons';

const Input = ({ helpText, ...props }) => {
  const { workspaceVariables, workspaceConstants, value, type, disabled, encrypted } = props;
  const [isFocused, setIsFocused] = useState(false);
  const [showPasswordProps, setShowPasswordProps] = useState({
    inputType: type,
    iconType: 'eyedisable',
  });

  const toggleShowPassword = () => {
    if (inputType !== 'text') {
      setShowPasswordProps({ inputType: 'text', iconType: 'eye' });
    } else {
      setShowPasswordProps({ inputType: 'password', iconType: 'eyedisable' });
    }
  };

  useEffect(() => {
    if (disabled && encrypted) setShowPasswordProps({ inputType: 'password', iconType: 'eyedisable' });
  }, [disabled]);

  const { inputType, iconType } = showPasswordProps;

  return (
    <div className="tj-app-input">
      <div className={cx('', { 'tj-app-input-wrapper': type === 'password' || encrypted })}>
        <input {...props} type={inputType} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} />
        {(type === 'password' || encrypted) && (
          <div onClick={!disabled && toggleShowPassword}>
            {' '}
            <SolidIcon className="eye-icon" name={iconType} />
          </div>
        )}
      </div>
      <OrgConstantVariablesPreviewBox
        workspaceVariables={workspaceVariables}
        workspaceConstants={workspaceConstants}
        isFocused={isFocused}
        value={value}
      />
      {helpText && <small className="text-muted" dangerouslySetInnerHTML={{ __html: helpText }} />}
    </div>
  );
};

export default Input;
