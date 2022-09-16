import React, { useRef, useState, useEffect } from 'react';
import { default as BootstrapModal } from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { SubCustomDragLayer } from '../SubCustomDragLayer';
import { SubContainer } from '../SubContainer';
import { ConfigHandle } from '../ConfigHandle';

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
}) {
  const [showModal, setShowModal] = useState(false);
  const { hideOnEsc, hideCloseButton, hideTitleBar } = properties;
  const parentRef = useRef(null);

  const title = properties.title ?? '';
  const size = properties.size ?? 'lg';

  const { disabledState } = styles;

  registerAction('open', async function () {
    setExposedVariable('show', true);
    setShowModal(true);
  });
  registerAction('close', async function () {
    setShowModal(false);
    setExposedVariable('show', false);
  });

  useEffect(() => {
    const canShowModal = exposedVariables.show ?? false;
    setShowModal(canShowModal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exposedVariables.show]);

  function hideModal() {
    setExposedVariable('show', false);
    setShowModal(false);
  }

  console.log('config ==>', containerProps);

  return (
    <div className="container" data-disabled={disabledState}>
      <Button variant="primary" onClick={() => setShowModal(true)}>
        Show Modal
      </Button>
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
        // scrollable={true}
        modalProps={{
          height,
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
        <SubContainer parent={id} {...containerProps} parentRef={parentRef} />
        <SubCustomDragLayer
          snapToGrid={true}
          parentRef={parentRef}
          parent={id}
          currentLayout={containerProps.currentLayout}
        />
      </Modal.Component>
    </div>
  );
};

const Component = ({ children, ...restProps }) => {
  const {
    height,
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
          customClassName="modalWidget-config-handle"
        />
      )}
      {!hideTitleBar && (
        <BootstrapModal.Header>
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
      <BootstrapModal.Body style={{ height }} ref={parentRef} id={id}>
        {children}
      </BootstrapModal.Body>
      <BootstrapModal.Footer></BootstrapModal.Footer>
    </BootstrapModal>
  );
};

Modal.Component = Component;
