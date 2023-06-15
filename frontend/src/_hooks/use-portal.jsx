import React from 'react';
import { Portal } from '@/_components/Portal';

const usePortal = ({ children, ...restProps }) => {
  const {
    isOpen,
    callback,
    componentName,
    key = '',
    customComponent = () => null,
    forceUpdate,
    optionalProps = {},
    selectors = {},
    dragResizePortal = false,
    callgpt,
    isCopilotEnabled = false,
  } = restProps;

  const renderCustomComponent = ({ component, ...restProps }) => {
    const { selectors } = restProps;
    return React.createElement('div', { ...selectors }, component);
  };

  React.useEffect(() => {
    if (isOpen) {
      forceUpdate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentName, isOpen]);

  const styleProps = optionalProps?.styles;
  return (
    <React.Fragment>
      {isOpen && (
        <Portal
          className={`modal-portal-wrapper ${dragResizePortal && 'resize-modal-portal'}`}
          isOpen={isOpen}
          trigger={callback}
          componentName={componentName}
          dragResizePortal={dragResizePortal}
          callgpt={callgpt}
          isCopilotEnabled={isCopilotEnabled}
        >
          <div
            className={`editor-container ${optionalProps.cls ?? ''}`}
            key={key}
            data-cy={`codehinder-popup-input-field`}
          >
            {React.cloneElement(children, { ...styleProps })}
          </div>
          {renderCustomComponent({ component: customComponent(), selectors: selectors })}
        </Portal>
      )}
      {children}
    </React.Fragment>
  );
};

export default usePortal;
