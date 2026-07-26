import React from 'react';
import { ReactPortal } from './ReactPortal.js';
import { Rnd } from 'react-rnd';
import { Button } from '@/_ui/LeftSidebar';
import { noop } from 'lodash';
import {
  readCodehinterPopupEditorDimensions,
  getDefaultCodehinterPopupEditorDimensions,
} from '@/_helpers/codehinterPortalDimensions';
import { Button as ButtonComponent } from '@/components/ui/Button/Button.jsx';

export const formatHeaderTitle = (name) => {
  if (!name || typeof name !== 'string') return 'Editor';

  let formatted = name.trim();
  if (!formatted) return 'Editor';

  if (formatted.startsWith('component/')) {
    formatted = formatted.replace('component/', '');
  }

  // Remove '/default' if present (e.g. table1/default::columns -> table1::columns)
  formatted = formatted.replace(/\/default(?=::|$)/, '');

  if (formatted.includes('::')) {
    const segments = formatted.split('::').filter((p) => Boolean(p) && isNaN(p));
    formatted = segments
      .map((seg) => seg.split('/').filter(Boolean).join(' - '))
      .join(' - ');
  } else if (formatted.includes('/')) {
    const parts = formatted.split('/').filter(Boolean);
    formatted = parts.join(' - ');
  }

  return formatted || 'Editor';
};

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
    canRefresh = false,
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
          canRefresh={canRefresh}
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
  canRefresh = false,
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

  console.log('Rendering Portal Modal with componentName:', componentName, 'and canRefresh:', canRefresh);
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
            className="codehinder-popup-badge codehinter-popup-badge"
            data-cy="codehinder-popup-badge"
          >
            {formatHeaderTitle(componentName)}
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

        {canRefresh && (
          <div className="mx-2">
            <ButtonComponent
              iconOnly
              isLucid
              leadingIcon="refresh-ccw"
              size="medium"
              variant="outline"
              ariaLabel="Refresh"
              className="codehinter-refresh-btn"
            />
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
