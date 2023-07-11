import React, { useState } from 'react';
import { useSpring, config, animated } from 'react-spring';
import { resolveReferences } from '../../_helpers/utils';
import { Alert } from '../Alert';
import useHeight from '@/_hooks/use-height-transition';

const Input = ({ helpText, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

  const { workspaceVariables, workspaceConstants, value } = props;

  const getResolveValueType = (currentValue) => {
    if (!currentValue) return null;

    if (currentValue.includes('client')) {
      return 'client workspace variable';
    }

    if (currentValue.includes('server')) {
      return 'server workspace variable';
    }

    if (currentValue.includes('constants')) {
      return 'Workspace Constant';
    }

    return null;
  };

  const shouldResolve =
    typeof value === 'string' &&
    ((value.includes('%%') && (value.includes('client.') || value.includes('server.'))) ||
      (value.includes('{{') && value.includes('constants.')));

  const valueType = typeof value === 'string' && getResolveValueType(value);

  return (
    <div className="tj-app-input">
      <textarea {...props} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} />
      {shouldResolve && (
        <ResolvedValue
          value={value}
          isFocused={isFocused}
          state={{ ...workspaceVariables, constants: workspaceConstants }}
          type={valueType}
        />
      )}
      {helpText && <small className="text-muted" dangerouslySetInnerHTML={{ __html: helpText }} />}
    </div>
  );
};

const ResolvedValue = ({ value, isFocused, state = {}, type }) => {
  const [preview, error] = resolveReferences(value, state, null, {}, true, true);
  const previewType = typeof preview;

  let resolvedValue = preview;

  const errorMessage = error?.toString().includes(`Server variables can't be used like this`)
    ? 'HiddenEnvironmentVariable'
    : error?.toString();
  const isValidError = error && errorMessage !== 'HiddenEnvironmentVariable';

  if (error && !isValidError) {
    resolvedValue = errorMessage;
  }

  const darkMode = localStorage.getItem('darkMode') === 'true';

  const themeCls = darkMode ? 'bg-dark  py-1' : 'bg-light  py-1';

  const getPreviewContent = (content, type) => {
    if (!content) return value;

    try {
      switch (type) {
        case 'object':
          return JSON.stringify(content);
        case 'boolean':
          return content.toString();
        default:
          return content;
      }
    } catch (e) {
      return undefined;
    }
  };

  const isConstant = type === 'Workspace Constant';
  const [heightRef, currentHeight] = useHeight();

  const slideInStyles = useSpring({
    config: config.stiff,
    from: { opacity: 0, height: 0 },
    to: {
      opacity: isFocused ? 1 : 0,
      height: isFocused ? (isConstant ? currentHeight : currentHeight + 30) : 0,
    },
  });

  return (
    <React.Fragment>
      <animated.div className={themeCls} style={{ ...slideInStyles, overflow: 'hidden' }}>
        <div
          ref={heightRef}
          className={`dynamic-variable-preview px-1 py-1 ${isValidError ? 'bg-red-lt' : 'bg-green-lt'}`}
        >
          <div className="alert-banner-type-text">
            <div className="d-flex my-1">
              <div className="flex-grow-1" style={{ fontWeight: 800, textTransform: 'capitalize' }}>
                {isValidError ? 'Error' : ` ${type} - ${previewType}`}
              </div>
            </div>
            {getPreviewContent(resolvedValue, previewType)}
          </div>
        </div>
        <DepericatedAlerForWorkspaceVariable text="Workspace variables deprecating soon" shouldShow={!isConstant} />
      </animated.div>
    </React.Fragment>
  );
};

const DepericatedAlerForWorkspaceVariable = ({ text, shouldShow }) => {
  if (!shouldShow) return null;

  return (
    <Alert
      svg="tj-info-warning"
      cls="codehinter workspace-variables-alert-banner p-1 mb-0"
      imgHeight={16}
      imgWidth={16}
    >
      <div className="d-flex align-items-center">
        <div class="">{text}</div>
      </div>
    </Alert>
  );
};

export default Input;
