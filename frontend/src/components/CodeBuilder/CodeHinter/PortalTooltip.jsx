# Fix for Issue #6655: incorrect code-hinter header text

import React from 'react';
import { createPortal } from 'react-dom';
import cx from 'classnames';

const PortalTooltip = ({
  isOpen,
  onClose,
  children,
  darkMode,
  title = 'Editor',
  component,
  componentName,
  currentLayout,
  callgpt,
  isCopilotEnabled,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Use the title prop which now receives paramLabel, fallback to 'Editor' if empty
  const headerTitle = title || 'Editor';

  return createPortal(
    <div
      className={cx('codehinter-popup-portal', { 'theme-dark dark-theme': darkMode })}
      onClick={handleOverlayClick}
    >
      <div className="codehinter-popup-card">
        <div className="codehinter-popup-header">
          <div className="codehinter-popup-header-left">
            <span className="codehinter-popup-title">{headerTitle}</span>
            {componentName && (
              <span className="codehinter-popup-component-name">
                <span className="mx-1">•</span>
                {componentName}
              </span>
            )}
          </div>
          <div className="codehinter-popup-header-right">
            {isCopilotEnabled && callgpt && (
              <button className="codehinter-copilot-btn" onClick={callgpt}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M8 1L10 5L14 5.5L11 8.5L12 13L8 11L4 13L5 8.5L2 5.5L6 5L8 1Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Copilot</span>
              </button>
            )}
            <button className="codehinter-popup-close" onClick={onClose}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M9 3L3 9M3 3L9 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="codehinter-popup-body">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default PortalTooltip;