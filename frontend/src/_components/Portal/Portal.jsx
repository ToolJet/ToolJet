import React from 'react';
import { ReactPortal } from './ReactPortal.js';
import { Rnd } from 'react-rnd';

const Portal = ({ children, ...restProps }) => {
  const { isOpen, trigger, styles, className, componentName, dragResizePortal } = restProps;
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
          dragResizePortal={dragResizePortal}
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

const Modal = ({ children, handleClose, portalStyles, styles, componentName, darkMode, dragResizePortal }) => {
  const renderModalContent = () => (
    <div className="modal-content" style={{ ...portalStyles, ...styles }}>
      <div
        className={`resize-handle portal-header d-flex ${darkMode ? 'dark-mode-border' : ''}`}
        style={{ ...portalStyles }}
      >
        <div className="w-100">
          <code className="mx-2 text-info">{componentName ?? 'Editor'}</code>
        </div>

        <button
          type="button"
          className="btn mx-2 btn-light"
          onClick={handleClose}
          data-tip="Hide code editor modal"
          style={{ backgroundColor: darkMode && '#42546a' }}
        >
          <img
            style={{ transform: 'rotate(-90deg)', filter: darkMode && 'brightness(0) invert(1)' }}
            src="/assets/images/icons/portal-close.svg"
            width="12"
            height="12"
          />
        </button>
      </div>
      <div
        className={`modal-body ${darkMode ? 'dark-mode-border' : ''}`}
        style={{ background: 'transparent', height: 300 }}
      >
        {children}
      </div>
    </div>
  );

  return (
    <div className={dragResizePortal ? 'resize-modal' : 'modal-dialog'} role="document">
      {dragResizePortal ? (
        <Rnd
          default={{
            x: -150,
            y: 0,
            height: 350,
          }}
          bounds="body"
          dragHandleClassName={'resize-handle'}
          minWidth={'500px'}
          minHeight={'350px'}
        >
          {renderModalContent()}
        </Rnd>
      ) : (
        renderModalContent()
      )}
    </div>
  );
};

Portal.Container = Container;
Portal.Modal = Modal;

export { Portal };
