import React, { useRef, useState, useEffect } from 'react';
import { default as BootstrapModal} from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { SubCustomDragLayer } from '../SubCustomDragLayer';
import { SubContainer } from '../SubContainer';

export const Modal = function Modal({
  id,
  component,
  height,
  containerProps
}) {

  const [show, showModal] = useState(false);
  const parentRef = useRef(null);

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
        container={document.getElementsByClassName('real-canvas')[0]}
        size="lg" 
        backdrop="static" 
        keyboard={true} 
        animation={false}
        
        onEscapeKeyDown={() => showModal(false)}
      >
        <BootstrapModal.Header>
          <BootstrapModal.Title></BootstrapModal.Title>
          <div>
            <Button variant="light" size="sm" onClick={hideModal}>
              x
            </Button>
          </div>
        </BootstrapModal.Header>

        <BootstrapModal.Body style={{height}} ref={parentRef}>
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
