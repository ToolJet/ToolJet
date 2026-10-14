import React from 'react';
import { ToolTip } from '@/_components/ToolTip';
import './_styles/config-handle-button.scss';

const ConfigHandleButton = ({
  message = '',
  show = false,
  className = '',
  customStyles = {},
  children = null,
  onClick = () => {},
  dataCy = '',
  onMouseEnter = () => {},
  onMouseLeave = () => {},
  shouldHide = false,
}) => {
  if (shouldHide) {
    return null;
  }
  return (
    <span className={`config-handle-button ${className}`}>
      <ToolTip message={message} show={show} delay={{ show: 500, hide: 50 }}>
        <button
          style={{
            background: 'var(--background-accent-strong)',
            color: 'var(--text-on-solid)',
            ...customStyles,
          }}
          className="badge text-truncate"
          onClick={onClick}
          data-cy={dataCy}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {children}
        </button>
      </ToolTip>
    </span>
  );
};

export default ConfigHandleButton;
