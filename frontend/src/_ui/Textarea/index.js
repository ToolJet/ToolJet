import React, { useState } from 'react';
import { useSpring, config, animated } from 'react-spring';
import { resolveReferences } from '../../_helpers/utils';

const Textarea = ({ helpText, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

  const { workspaceVariables, value } = props;

  const getResolveValueType = (currentValue) => {
    if (!currentValue) return null;

    if (currentValue.includes('client')) {
      return 'client workspace variable';
    }

    if (currentValue.includes('server')) {
      return 'server workspace variable';
    }

    return null;
  };

  const shouldResolve = typeof value === 'string' && (value.includes('%%client') || value.includes('%%server'));
  const valueType = typeof value === 'string' && getResolveValueType(value);

  return (
    <div className="tj-app-input">
      <textarea {...props} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} />
      {shouldResolve && (
        <ResolvedValue value={value} isFocused={isFocused} state={workspaceVariables} type={valueType} />
      )}
      {helpText && <small className="text-muted" dangerouslySetInnerHTML={{ __html: helpText }} />}
    </div>
  );
};

const ResolvedValue = ({ value, isFocused, state = {}, type }) => {
  const slideInStyles = useSpring({
    config: config.stiff,
    from: { opacity: 0, height: 0 },
    to: {
      opacity: isFocused ? 1 : 0,
      height: isFocused ? 60 : 0,
    },
  });

  const [preview, error] = resolveReferences(value, state, null, {}, true, true);

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

  return (
    <animated.div className={themeCls} style={{ ...slideInStyles, overflow: 'hidden' }}>
      <div className={`dynamic-variable-preview px-1 py-1 ${isValidError ? 'bg-red-lt' : 'bg-green-lt'}`}>
        <div>
          <div className="d-flex my-1">
            <div className="flex-grow-1" style={{ fontWeight: 700, textTransform: 'capitalize' }}>
              {type}
            </div>
            <div className="" style={{ overflow: 'hidden' }}>
              <span class="badge badge-warning">Deprecating soon</span>
            </div>
          </div>
          {resolvedValue}
        </div>
      </div>
    </animated.div>
  );
};

export default Textarea;
