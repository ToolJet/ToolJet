import React from 'react';
import { ReactPortal } from './ReactPortal.js';

const Portal = ({ children, ...restProps }) => {
  const { isOpen, trigger, styles, className, componentName } = restProps;
  console.log('render-re', componentName);
  const [name, setName] = React.useState(componentName);
  const handleClose = (e) => {
    e.stopPropagation();
    trigger(false);
  };

  React.useEffect(() => {
    setName(componentName);
  }, [componentName]);

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
    width: '500px',
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

const Modal = ({ children, handleClose, portalStyles, styles, componentName }) => {
  return (
    <div className="modal-dialog shadow bg-black rounded" role="document">
      <div className="modal-content" style={{ ...portalStyles, ...styles }}>
        <div className="portal-header d-flex" style={{ ...portalStyles }}>
          <div className="w-100">
            <code className="mx-2 text-info">{componentName ?? 'Editor'}</code>
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
        <div className="modal-body" style={{ background: 'transparent', height: 300 }}>
          {children}
        </div>
      </div>
    </div>
  );
};

Portal.Container = Container;
Portal.Modal = Modal;

export { Portal };
