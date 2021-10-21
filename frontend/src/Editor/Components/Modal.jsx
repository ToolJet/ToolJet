import React, { useRef, useState, useEffect } from 'react';
import { default as BootstrapModal } from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { SubCustomDragLayer } from '../SubCustomDragLayer';
import { SubContainer } from '../SubContainer';
import { ConfigHandle } from '../ConfigHandle';
import { resolveWidgetFieldValue } from '@/_helpers/utils';

export const Modal = function Modal({ id, component, height, containerProps, currentState, darkMode }) {
  const [show, showModal] = useState(false);
  const parentRef = useRef(null);

  const titleProp = component.definition.properties.title;
  const title = titleProp ? titleProp.value : '';

  const sizeProp = component.definition.properties.size;
  const size = sizeProp ? sizeProp.value : 'lg';

  const disabledState = component.definition.styles?.disabledState?.value ?? false;

  const parsedDisabledState =
    typeof disabledState !== 'boolean' ? resolveWidgetFieldValue(disabledState, currentState) : disabledState;

  useEffect(() => {
    const componentState = containerProps.currentState.components[component.name];
    const canShowModel = componentState ? componentState.show : false;
    showModal(canShowModel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerProps.currentState.components[component.name]]);

  function hideModal() {
    containerProps.onComponentOptionChanged(component, 'show', false);
    showModal(false);
  }

  return (
    <div data-disabled={parsedDisabledState}>
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
          <BootstrapModal.Title>{resolveWidgetFieldValue(title, currentState)}</BootstrapModal.Title>
          <div>
            <Button variant={darkMode ? 'secondary' : 'light'} size="sm" onClick={hideModal}>
              x
            </Button>
          </div>
        </BootstrapModal.Header>

        <BootstrapModal.Body style={{ height }} ref={parentRef}>
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
