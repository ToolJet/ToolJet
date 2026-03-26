import React from 'react';
import { ReactPortal } from './ReactPortal.js';
import { Rnd } from 'react-rnd';
import { Button } from '@/_ui/LeftSidebar';
import { noop } from 'lodash';
import {
  readCodehinterPopupEditorDimensions,
  getDefaultCodehinterPopupEditorDimensions,
} from '@/_helpers/codehinterPortalDimensions';

const Portal = ({ children, ...restProps }) => {
  const {
    isOpen,
    trigger,
    styles,
    className,
    componentName,
    dragResizePortal,
    callgpt,
    isCopilotEnabled,
    onPortalDimensionsChange = noop,
  } = restProps;

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
    borderRadius: '0px',
    width: dragResizePortal ? '100%' : '500px',
  };

  return (
    <Portal.Container {...restProps} componentName={name?.replace(/(\S)\s+(\S)/g, '$1$2')}>
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
          onPortalDimensionsChange={onPortalDimensionsChange}
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
  onPortalDimensionsChange,
}) => {
  const [loading, setLoading] = React.useState(false);

  const codehinterPopupRndDefault = React.useMemo(() => {
    if (!dragResizePortal) return null;
    return readCodehinterPopupEditorDimensions() || getDefaultCodehinterPopupEditorDimensions();
  }, [dragResizePortal]);

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
        <div className="w-100 ">
          <span
            style={{
              textTransform: 'none',
            }}
            className="codehinder-popup-badge"
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
      <div className={`modal-body `} style={{ background: 'transparent', height: 300 }}>
        {children}
      </div>
    </div>
  );

  return (
    <div className={dragResizePortal ? 'resize-modal' : 'modal-dialog'} role="document">
      {dragResizePortal ? (
        <Rnd
          default={{
            x: codehinterPopupRndDefault.x,
            y: codehinterPopupRndDefault.y,
            height: codehinterPopupRndDefault.height,
            width: codehinterPopupRndDefault.width,
          }}
          bounds="body"
          dragHandleClassName={'resize-handle'}
          minWidth={'500px'}
          minHeight={'350px'}
          onResizeStop={(_e, _dir, ref, delta, position) => {
            onPortalDimensionsChange?.({
              width: ref.offsetWidth,
              height: ref.offsetHeight,
              x: position.x,
              y: position.y,
            });
            console.log('onResizeStop', position);
          }}
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
