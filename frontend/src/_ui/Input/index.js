import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import OrgConstantVariablesPreviewBox from '../../_components/OrgConstantsVariablesResolver';
import SolidIcon from '../Icon/SolidIcons';
import { toast } from 'react-hot-toast';

const Input = ({ helpText, onBlur, ...props }) => {
  const { workspaceVariables, workspaceConstants, value, type, disabled, encrypted } = props;
  const [isFocused, setIsFocused] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
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

  const handleCopyToClipboard = async () => {
    if (type === 'copyToClipboard') {
      try {
        await navigator.clipboard.writeText(value);
        toast.success('Copied to clipboard');
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 4000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  useEffect(() => {
    if (disabled && encrypted) setShowPasswordProps({ inputType: 'password', iconType: 'eyedisable' });
  }, [disabled]);

  const { inputType, iconType } = showPasswordProps;

  return (
    <div className="tj-app-input">
      <div
        className={cx('', { 'tj-app-input-wrapper': type === 'password' || type === 'copyToClipboard' || encrypted })}
      >
        <input
          {...props}
          type={inputType}
          onFocus={() => setIsFocused(true)}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur(event);
          }}
        />
        {(type === 'password' || encrypted) && (
          <div onClick={!disabled && toggleShowPassword}>
            {' '}
            <SolidIcon className="eye-icon" name={iconType} />
          </div>
        )}
        {type === 'copyToClipboard' &&
          value &&
          (!isCopied ? (
            <div style={{ cursor: 'pointer' }} onClick={handleCopyToClipboard}>
              {' '}
              <SolidIcon className="copy-icon" name="copy" />
            </div>
          ) : (
            <div style={{ color: 'green' }}>
              {' '}
              <span>Copied!</span>
            </div>
          ))}
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
