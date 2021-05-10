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
  mode,
  containerProps
}) {
  const [show, showModal] = useState(false);
  const parentRef = useRef(null);

  const titleProp = component.definition.properties.title;
  const title = titleProp ? titleProp.value : '';

  const sizeProp = component.definition.properties.size;
  const size = sizeProp ? sizeProp.value : 'lg';

  useEffect(() => {
    const componentState = containerProps.currentState.components[component.name];
    const canShowModel = componentState ? componentState.show : false;
    showModal(canShowModel);
  }, [containerProps.currentState.components[component.name]]);

  function hideModal() {
    containerProps.onComponentOptionChanged(component, 'show', false);
    showModal(false);
  }

  return (
    <div>
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
        <ConfigHandle 
          id={id} 
          component={component}
          configHandleClicked={containerProps.onComponentClick}
        /> 
        <BootstrapModal.Header>
          <BootstrapModal.Title>
            {title}
          </BootstrapModal.Title>
          <div>
            <Button variant="light" size="sm" onClick={hideModal}>
              x
            </Button>
          </div>
        </BootstrapModal.Header>

        <BootstrapModal.Body style={{ height }} ref={parentRef}>
            <SubContainer
              parent={id}
              {...containerProps}
              parentRef={parentRef}
            />
            <SubCustomDragLayer
              snapToGrid={true}
              parentRef={parentRef}
            />
        </BootstrapModal.Body>
      </BootstrapModal>
    </div>
  );
};
