import React, { useRef } from 'react';
import { default as BootstrapModal } from 'react-bootstrap/Modal';
import { SubContainer } from '@/Editor/SubContainer';
import '@/_styles/widgets/kanban.scss';

export const Modal = function Modal({ showModal, setShowModal, kanbanProps }) {
  const parentRef = useRef(null);
  const { id, containerProps, exposedVariables } = kanbanProps;

  const renderCloseButton = () => {
    return (
      <span className="kanban-modal-close-icon cursor-pointer" size="sm" onClick={() => setShowModal(false)}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon icon-tabler icon-tabler-x"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </span>
    );
  };

  return (
    <BootstrapModal
      show={showModal}
      contentClassName="modal-component"
      container={document.getElementsByClassName('canvas-area')[0]}
      size={'lg'}
      keyboard={true}
      enforceFocus={false}
      animation={false}
      id="modal-container"
      backdrop={'static'}
    >
      <BootstrapModal.Body ref={parentRef} id={`${id}-modal`} style={{ width: '100%', height: '400px' }}>
        {renderCloseButton()}
        <SubContainer
          containerCanvasWidth={720}
          parent={`${id}-modal`}
          {...containerProps}
          parentRef={parentRef}
          customResolvables={{ cardData: exposedVariables?.lastSelectedCard }}
        />
      </BootstrapModal.Body>
    </BootstrapModal>
  );
};
