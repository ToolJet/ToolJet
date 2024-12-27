import React, { useState } from 'react';
import cx from 'classnames';
import OrgConstantVariablesPreviewBox from '../../_components/OrgConstantsVariablesResolver';
import SolidIcon from '../Icon/SolidIcons';
import { toast } from 'react-hot-toast';
import InputComponent from '@/components/ui/Input/Index';

const InputV3 = ({ helpText, validate, ...props }) => {
  const { workspaceVariables, workspaceConstants, value, ui_widget, disabled, encrypted } = props;
  const [isFocused, setIsFocused] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyToClipboard = async () => {
    if (ui_widget === 'copyToClipboard') {
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

  return (
    <div className="tj-app-input">
      <div
        className={cx('', {
          'tj-app-input-wrapper': ui_widget === 'password' || ui_widget === 'copyToClipboard' || encrypted,
        })}
        style={{ alignItems: 'flex-start' }}
      >
        {ui_widget === 'text-v3' && (
          <InputComponent
            {...props}
            value={value}
            styles="tw-bg-transparent"
            label={props.ui_label}
            placeholder={props.placeholder}
            required={props.isRequired}
            validation={(e) => validate(e)}
          />
        )}
        {(ui_widget === 'password-v3' || encrypted) && (
          <div style={{ flex: '1' }}>
            <InputComponent
              {...props}
              type="password"
              value={value}
              styles="tw-bg-transparent"
              label={props.ui_label}
              placeholder={props.placeholder}
              required={props.isRequired}
              validation={(e) => validate(e)}
            />
          </div>
        )}
        {ui_widget === 'copyToClipboard' &&
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

export default InputV3;
