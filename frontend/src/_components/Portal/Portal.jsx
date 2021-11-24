import React from 'react';
import { ReactPortal } from './ReactPortal.js';

const Portal = ({ children, ...restProps }) => {
  const { isOpen, trigger, styles, className, dependencies } = restProps;
  const handleClose = (e) => {
    e.stopPropagation();
    trigger(false);
  };

  const [name, setName] = React.useState(dependencies.componentName);

  React.useEffect(() => {
    setName(dependencies.componentName);
  }, [dependencies]);

  React.useEffect(() => {
    if (isOpen) {
      document.querySelector('#app').setAttribute('inert', 'true');
    }

    return () => {
      document.querySelector('#app').removeAttribute('inert');
    };
  }, [isOpen]);

  const darkMode = localStorage.getItem('darkMode') === 'true';

  const portalStyles = {
    background: 'transparent',
    backgroundColor: darkMode ? '#232E3C' : '#fff',
    borderRadius: '0px',
  };

  return (
    <Portal.Container {...restProps}>
      <div className={className}>
        <Portal.Modal
          handleClose={handleClose}
          portalStyles={portalStyles}
          darkMode={darkMode}
          styles={styles}
          componentName={name}
        >
          {children}
        </Portal.Modal>
      </div>
    </Portal.Container>
  );
};

const Container = ({ children, ...restProps }) => {
  return <ReactPortal {...restProps}>{children}</ReactPortal>;
};

const Modal = ({ children, handleClose, portalStyles, darkMode, styles, componentName }) => {
  return (
    <div className="modal-dialog" role="document">
      <div className="modal-content" style={{ ...portalStyles, ...styles }}>
        <div className="portal-header d-flex" style={{ ...portalStyles }}>
          <div className="w-100">
            <code className="mx-2 text-info">{componentName}</code>
          </div>

          <button type="button" className={`btn btn-light mx-2 flex-shrink-1`} onClick={handleClose} data-tip="Hide">
            <img
              style={{ transform: 'rotate(-90deg)' }}
              src="/assets/images/icons/portal-close.svg"
              width="12"
              height="12"
            />
          </button>
        </div>
        <div
          className="modal-body p-0"
          style={{ background: 'transparent', backgroundColor: darkMode ? '#272822' : '#fff', height: 210 }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

Portal.Container = Container;
Portal.Modal = Modal;

export { Portal };
