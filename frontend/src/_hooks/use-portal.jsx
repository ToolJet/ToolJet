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
  } = restProps;

  const renderCustomComponent = customComponent && customComponent();

  React.useEffect(() => {
    if (isOpen) {
      forceUpdate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentName, isOpen]);

  return (
    <React.Fragment>
      {isOpen && (
        <Portal className="modal-portal-wrapper" isOpen={isOpen} trigger={callback} componentName={componentName}>
          <div className="editor-container" key={key}>
            {React.cloneElement(children, { ...optionalProps })}
          </div>
          {renderCustomComponent}
        </Portal>
      )}
      {children}
    </React.Fragment>
  );
};

export default usePortal;
