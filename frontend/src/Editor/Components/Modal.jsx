import React, { useRef, useState, useEffect } from 'react';
import { default as BootstrapModal } from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { SubCustomDragLayer } from '../SubCustomDragLayer';
import { SubContainer } from '../SubContainer';
import { ConfigHandle } from '../ConfigHandle';
var tinycolor = require('tinycolor2');

export const Modal = function Modal({
  id,
  component,
  height,
  containerProps,
  darkMode,
  properties,
  styles,
  exposedVariables,
  setExposedVariable,
  registerAction,
  fireEvent,
}) {
  const [showModal, setShowModal] = useState(false);
  const { hideOnEsc, hideCloseButton, hideTitleBar, loadingState, useDefaultButton, showButtonLabel } = properties;
  const {
    headerBackgroundColor,
    headerTextColor,
    bodyBackgroundColor,
    disabledState,
    visibility,
    showButtonBackgroundColor,
    showButtonTextColor,
  } = styles;
  const parentRef = useRef(null);

  const title = properties.title ?? '';
  const size = properties.size ?? 'lg';

  registerAction('open', async function () {
    setExposedVariable('show', true);
    setShowModal(true);
  });
  registerAction('close', async function () {
    setShowModal(false);
    setExposedVariable('show', false);
  });

  useEffect(() => {
    setExposedVariable('show', showModal).then(() => fireEvent(showModal ? 'onOpen' : 'onClose'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  useEffect(() => {
    const canShowModal = exposedVariables.show ?? false;
    if (canShowModal !== showModal) {
      setShowModal(canShowModal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exposedVariables.show]);

  function hideModal() {
    setExposedVariable('show', false);
    setShowModal(false);
  }

  const customStyles = {
    modalBody: {
      height,
      backgroundColor: bodyBackgroundColor,
    },
    modalHeader: {
      backgroundColor: headerBackgroundColor,
      color: headerTextColor,
    },
    buttonStyles: {
      backgroundColor: showButtonBackgroundColor,
      color: showButtonTextColor,
      width: '100%',
      display: visibility ? '' : 'none',
      '--tblr-btn-color-darker': tinycolor(showButtonBackgroundColor).darken(8).toString(),
    },
  };

  return (
    <div className="container" data-disabled={disabledState}>
      {useDefaultButton && (
        <button
          disabled={disabledState}
          className="jet-button btn btn-primary p-1 overflow-hidden"
          style={customStyles.buttonStyles}
          onClick={(event) => {
            event.stopPropagation();
            setShowModal(true);
          }}
        >
          {showButtonLabel ?? 'Show Modal'}
        </button>
      )}

      <Modal.Component
        show={showModal}
        onHide={hideModal}
        contentClassName="modal-component"
        container={document.getElementsByClassName('canvas-area')[0]}
        size={size}
        keyboard={true}
        enforceFocus={false}
        animation={false}
        onEscapeKeyDown={() => hideOnEsc && hideModal()}
        id="modal-container"
        backdrop={containerProps.mode === 'edit' ? 'static' : true}
        scrollable={true}
        modalProps={{
          customStyles,
          parentRef,
          id,
          title,
          hideTitleBar,
          hideCloseButton,
          hideModal,
          darkMode,
          component,
          showConfigHandler: containerProps.mode === 'edit',
          removeComponent: containerProps.removeComponent,
          setSelected: containerProps.setSelectedComponent,
        }}
      >
        {!loadingState ? (
          <>
            <SubContainer parent={id} {...containerProps} parentRef={parentRef} />
            <SubCustomDragLayer
              snapToGrid={true}
              parentRef={parentRef}
              parent={id}
              currentLayout={containerProps.currentLayout}
            />
          </>
        ) : (
          <div className="p-2">
            <center>
              <div className="spinner-border mt-5" role="status"></div>
            </center>
          </div>
        )}
      </Modal.Component>
    </div>
  );
};

const Component = ({ children, ...restProps }) => {
  const {
    customStyles,
    parentRef,
    id,
    title,
    hideTitleBar,
    hideCloseButton,
    hideModal,
    darkMode,
    component,
    showConfigHandler,
    removeComponent,
    setSelected,
  } = restProps['modalProps'];

  return (
    <BootstrapModal {...restProps}>
      {showConfigHandler && (
        <ConfigHandle
          id={id}
          component={component}
          removeComponent={removeComponent}
          setSelectedComponent={setSelected} //! Only Modal uses setSelectedComponent instead of selecto lib
          customClassName={hideTitleBar ? 'modalWidget-config-handle' : ''}
        />
      )}
      {!hideTitleBar && (
        <BootstrapModal.Header style={{ ...customStyles.modalHeader }}>
          <BootstrapModal.Title id="contained-modal-title-vcenter">{title}</BootstrapModal.Title>
          {!hideCloseButton && (
            <div>
              <Button variant={darkMode ? 'secondary' : 'light'} size="sm" onClick={() => hideModal()}>
                x
              </Button>
            </div>
          )}
        </BootstrapModal.Header>
      )}
      <BootstrapModal.Body style={{ ...customStyles.modalBody }} ref={parentRef} id={id}>
        {children}
      </BootstrapModal.Body>
      <BootstrapModal.Footer></BootstrapModal.Footer>
    </BootstrapModal>
  );
};

Modal.Component = Component;
