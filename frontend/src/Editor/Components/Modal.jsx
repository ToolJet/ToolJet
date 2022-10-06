import React, { useRef, useState, useEffect } from 'react';
import { default as BootstrapModal } from 'react-bootstrap/Modal';
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
  const { hideOnEsc, hideCloseButton, hideTitleBar, loadingState, useDefaultButton, triggerButtonLabel } = properties;
  const {
    headerBackgroundColor,
    headerTextColor,
    bodyBackgroundColor,
    disabledState,
    visibility,
    triggerButtonBackgroundColor,
    triggerButtonTextColor,
  } = styles;
  const parentRef = useRef(null);

  const title = properties.title ?? '';
  const size = properties.size ?? 'lg';

  registerAction(
    'open',
    async function () {
      setExposedVariable('show', true);
      setShowModal(true);
    },
    [setShowModal]
  );
  registerAction(
    'close',
    async function () {
      setShowModal(false);
      setExposedVariable('show', false);
    },
    [setShowModal]
  );

  useEffect(() => {
    if (exposedVariables.show !== showModal) {
      setExposedVariable('show', showModal).then(() => fireEvent(showModal ? 'onOpen' : 'onClose'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  useEffect(() => {
    const canShowModal = exposedVariables.show ?? false;
    if (canShowModal !== showModal) {
      setShowModal(canShowModal);
      fireEvent(canShowModal ? 'onOpen' : 'onClose');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exposedVariables.show]);

  function hideModal() {
    setShowModal(false);
  }

  const customStyles = {
    modalBody: {
      height,
      backgroundColor:
        ['#fff', '#ffffffff'].includes(bodyBackgroundColor) && darkMode ? '#1F2837' : bodyBackgroundColor,
      overflowX: 'hidden',
      overflowY: 'auto',
    },
    modalHeader: {
      backgroundColor:
        ['#fff', '#ffffffff'].includes(headerBackgroundColor) && darkMode ? '#1F2837' : headerBackgroundColor,
      color: ['#000', '#000000', '#000000ff'].includes(headerTextColor) && darkMode ? '#fff' : headerTextColor,
    },
    buttonStyles: {
      backgroundColor: triggerButtonBackgroundColor,
      color: triggerButtonTextColor,
      width: '100%',
      display: visibility ? '' : 'none',
      '--tblr-btn-color-darker': tinycolor(triggerButtonBackgroundColor).darken(8).toString(),
    },
  };

  useEffect(() => {
    if (containerProps.mode === 'view') {
      const handleClickOutside = (event) => {
        const modalRef = parentRef.current.parentElement.parentElement.parentElement;

        if (modalRef && modalRef === event.target) {
          hideModal();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [containerProps.mode, parentRef]);

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
          {triggerButtonLabel ?? 'Show Modal'}
        </button>
      )}

      <Modal.Component
        show={showModal}
        contentClassName="modal-component"
        container={document.getElementsByClassName('canvas-area')[0]}
        size={size}
        keyboard={true}
        enforceFocus={false}
        animation={false}
        onEscapeKeyDown={() => hideOnEsc && hideModal()}
        id="modal-container"
        backdrop={'static'}
        scrollable={true}
        modalProps={{
          customStyles,
          parentRef,
          id,
          title,
          hideTitleBar,
          hideCloseButton,
          hideModal,
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
            <span className="cursor-pointer" size="sm" onClick={() => hideModal()}>
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
          )}
        </BootstrapModal.Header>
      )}
      <BootstrapModal.Body style={{ ...customStyles.modalBody }} ref={parentRef} id={id}>
        {children}
      </BootstrapModal.Body>
    </BootstrapModal>
  );
};

Modal.Component = Component;
