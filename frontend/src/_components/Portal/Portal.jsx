import React from 'react';
import { ReactPortal } from './ReactPortal.js';
import { Rnd } from 'react-rnd';
import { Button } from '@/_ui/LeftSidebar';

const Portal = ({ children, ...restProps }) => {
  const { isOpen, trigger, styles, className, componentName, dragResizePortal, callgpt, isCopilotEnabled } = restProps;

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
    backgroundColor: darkMode ? '#151718' : '#FBFCFD',
    borderRadius: '0px',
    width: '500px',
    border: `1px solid ${darkMode ? '#151718' : '#FBFCFD'}`,
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
          callgpt={callgpt}
          isCopilotEnabled={isCopilotEnabled}
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

const Modal = ({
  children,
  handleClose,
  portalStyles,
  styles,
  componentName,
  darkMode,
  dragResizePortal,
  callgpt,
  isCopilotEnabled,
}) => {
  const [loading, setLoading] = React.useState(false);

  const handleCallGpt = () => {
    setLoading(true);

    callgpt().then(() => setLoading(false));
  };

  const includeGPT = ['Runjs', 'Runpy', 'transformation'].includes(componentName) && isCopilotEnabled;

  const renderModalContent = () => (
    <div className="modal-content" style={{ ...portalStyles, ...styles }} onClick={(e) => e.stopPropagation()}>
      <div
        className={`resize-handle portal-header d-flex ${darkMode ? 'dark-mode-border' : ''}`}
        style={{ ...portalStyles }}
      >
        <div className="w-100">
          <span
            style={{
              textTransform: 'none',
            }}
            className="color-indigo9"
            data-cy="codehinder-popup-badge"
          >
            {componentName ?? 'Editor'}
          </span>
        </div>

        {includeGPT && (
          <div className="mx-2">
            <Button
              onClick={handleCallGpt}
              darkMode={darkMode}
              size="sm"
              classNames={`${loading ? (darkMode ? 'btn-loading' : 'button-loading') : ''}`}
              styles={{ width: '100%', fontSize: '12px', fontWeight: 500, borderColor: darkMode && 'transparent' }}
            >
              <Button.Content title={'Generate code'} />
            </Button>
          </div>
        )}

        <Button
          title={'close'}
          onClick={handleClose}
          darkMode={darkMode}
          size="sm"
          styles={{ width: '50px', padding: '2px' }}
        >
          <Button.Content
            iconSrc={'assets/images/icons/portal-close.svg'}
            direction="left"
            dataCy={`codehinder-popup-close`}
          />
        </Button>
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
