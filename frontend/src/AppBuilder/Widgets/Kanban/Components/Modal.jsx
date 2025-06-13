import React, { useRef } from 'react';
import { default as BootstrapModal } from 'react-bootstrap/Modal';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import '@/_styles/widgets/kanban.scss';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

export const Modal = function Modal({ darkMode, showModal, setShowModal, kanbanProps, lastSelectedCard }) {
  const { moduleId } = useModuleContext();
  const updateCustomResolvables = useStore((state) => state.updateCustomResolvables, shallow);
  const parentRef = useRef(null);
  const { id, containerProps, component } = kanbanProps;
  const prevLastSelectedCard = useRef(lastSelectedCard);

  // Check if the previous lastSelectedCard data is different from the current lastSelectedCard data
  if (Object.keys(diff(lastSelectedCard, prevLastSelectedCard.current)).length > 0) {
    prevLastSelectedCard.current = lastSelectedCard;
    // Update the customResolvables with the lastSelectedCard
    updateCustomResolvables(`${id}-modal`, [{ cardData: lastSelectedCard }], 'cardData', moduleId);
  }

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
      container={document.getElementsByClassName('real-canvas')[0]}
      size={'lg'}
      keyboard={true}
      enforceFocus={false}
      animation={false}
      id="modal-container"
      backdrop={'static'}
      component-id={`${id}-modal`}
    >
      <BootstrapModal.Body ref={parentRef} id={`${id}-modal`} style={{ width: '100%', height: '400px' }}>
        {renderCloseButton()}
        <SubContainer
          canvasWidth={720}
          canvasHeight={400}
          id={`${id}-modal`}
          index={0} // index will be always 0 as it has only one container
          {...containerProps}
          parentRef={parentRef}
          customResolvables={{ cardData: lastSelectedCard }}
          parentComponent={component}
          styles={{
            backgroundColor: 'var(--base)',
          }}
          darkMode={darkMode}
        />
      </BootstrapModal.Body>
    </BootstrapModal>
  );
};
