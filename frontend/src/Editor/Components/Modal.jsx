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
}) {
  const [show, showModal] = useState(false);
  const parentRef = useRef(null);

  const title = properties.title ?? '';
  const size = properties.size ?? 'lg';

  const { disabledState } = styles;

  useEffect(() => {
    const canShowModel = exposedVariables.show ?? false;
    showModal(canShowModel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exposedVariables.show]);

  function hideModal() {
    setExposedVariable('show', false);
    showModal(false);
  }

  return (
    <div data-disabled={disabledState}>
      <BootstrapModal
        contentClassName="modal-component"
        show={show}
        container={document.getElementsByClassName('canvas-area')[0]}
        size={size}
        backdrop={true}
        keyboard={true}
        enforceFocus={false}
        animation={false}
        onEscapeKeyDown={() => showModal(false)}
      >
        {containerProps.mode === 'edit' && (
          <ConfigHandle id={id} component={component} configHandleClicked={containerProps.onComponentClick} />
        )}
        <BootstrapModal.Header>
          <BootstrapModal.Title>{title}</BootstrapModal.Title>
          <div>
            <Button variant={darkMode ? 'secondary' : 'light'} size="sm" onClick={hideModal}>
              x
            </Button>
          </div>
        </BootstrapModal.Header>

        <BootstrapModal.Body style={{ height }} ref={parentRef} id={id}>
          <SubContainer parent={id} {...containerProps} parentRef={parentRef} />
          <SubCustomDragLayer
            snapToGrid={true}
            parentRef={parentRef}
            parent={id}
            currentLayout={containerProps.currentLayout}
          />
        </BootstrapModal.Body>
      </BootstrapModal>
    </div>
  );
};
