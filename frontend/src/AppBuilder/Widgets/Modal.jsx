import React, { useRef, useState, useEffect } from 'react';
import { default as BootstrapModal } from 'react-bootstrap/Modal';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import { ConfigHandle } from '@/AppBuilder/AppCanvas/ConfigHandle/ConfigHandle';
import { useGridStore } from '@/_stores/gridStore';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
var tinycolor = require('tinycolor2');

// STYLE CONSTANTS
// 1. Modal header
const MODAL_HEADER = {
  HEIGHT: 80,
  HEIGHT_PX: `80px`,
  CANVAS_HEIGHT: 10,
};
const MODAL_FOOTER = {
  HEIGHT: 80,
  HEIGHT_PX: `80px`,
  CANVAS_HEIGHT: 10,
};

const getModalBodyHeight = (height, showHeader, showFooter) => {
  let modalHeight = height.includes('px') ? parseInt(height, 10) : height;
  if (showHeader) {
    modalHeight = modalHeight - MODAL_HEADER.HEIGHT;
  }
  if (showFooter) {
    modalHeight = modalHeight - MODAL_FOOTER.HEIGHT;
  }
  return `${Math.max(modalHeight, 40)}px`;
};

export const Modal = function Modal({
  id,
  component,
  darkMode,
  properties,
  styles,
  setExposedVariable,
  setExposedVariables,
  fireEvent,
  dataCy,
  height,
}) {
  const [showModal, setShowModal] = useState(false);
  const {
    closeOnClickingOutside = false,
    hideOnEsc,
    hideCloseButton,
    loadingState,
    useDefaultButton,
    triggerButtonLabel,
    modalHeight,
    showHeader,
    showFooter,
  } = properties;

  const {
    headerBackgroundColor,
    footerBackgroundColor,
    bodyBackgroundColor,
    disabledState,
    visibility,
    triggerButtonBackgroundColor,
    triggerButtonTextColor,
    boxShadow,
  } = styles;
  const parentRef = useRef(null);
  const controlBoxRef = useRef(null);
  const isInitialRender = useRef(true);
  const size = properties.size ?? 'lg';
  const [modalWidth, setModalWidth] = useState();
  const mode = useStore((state) => state.currentMode, shallow);
  const isFullScreen = properties.size === 'fullscreen';
  const computedHeight = getModalBodyHeight(modalHeight, showHeader, showFooter);

  /**** Start - Logic to reset the zIndex of modal control box ****/
  useEffect(() => {
    if (!showModal && mode === 'edit') {
      controlBoxRef.current?.classList?.remove('modal-moveable');
      controlBoxRef.current = null;
    }
    if (showModal) {
      useGridStore.getState().actions.setOpenModalWidgetId(id);
    } else {
      if (useGridStore.getState().openModalWidgetId === id) {
        useGridStore.getState().actions.setOpenModalWidgetId(null);
      }
    }
  }, [showModal, id, mode]);
  /**** End - Logic to reset the zIndex of modal control box ****/

  // Adjust height as viewport height changes
  const useViewportHeightChange = (callback) => {
    useEffect(() => {
      window.addEventListener('resize', onShowSideEffects);

      // Cleanup event listener on unmount
      return () => {
        window.removeEventListener('resize', onShowSideEffects);
      };
    }, [callback]);
  };

  useViewportHeightChange();

  function hideModal() {
    setExposedVariable('show', false);
    setShowModal(false);
  }

  function openModal() {
    setExposedVariable('show', true);
    setShowModal(true);
  }

  // Side effects for modal, which include dom manipulation to hide overflow when opening
  // And cleaning up dom when modal is closed

  const onShowSideEffects = () => {
    const canvasElement = document.querySelector('.page-container.canvas-container');
    const realCanvasEl = document.getElementsByClassName('real-canvas')[0];
    const modalCanvasEl = document.getElementById(`canvas-${id}`);
    const modalContainer = realCanvasEl.querySelector('.modal');

    if (canvasElement && realCanvasEl && modalContainer) {
      const currentScroll = canvasElement.scrollTop;
      canvasElement.style.overflow = 'hidden';

      modalContainer.style.height = `${canvasElement.offsetHeight}px`;
      modalContainer.style.top = `${currentScroll}px`;
      modalCanvasEl.style.height = isFullScreen ? '100%' : computedHeight;
      fireEvent('onOpen');
    }
  };

  const onHideSideEffects = () => {
    const canvasElement = document.querySelector('.page-container.canvas-container');
    const realCanvasEl = document.getElementsByClassName('real-canvas')[0];
    const modalContainer = realCanvasEl.querySelector('.modal');

    if (canvasElement && realCanvasEl && modalContainer) {
      canvasElement.style.overflow = 'auto';
      modalContainer.style.height = ``;
      modalContainer.style.top = ``;
      fireEvent('onClose');
    }
  };

  const onShowModal = () => {
    openModal();
    onShowSideEffects();
  };

  const onHideModal = () => {
    onHideSideEffects();
    hideModal();
  };

  useEffect(() => {
    const exposedVariables = {
      open: async function () {
        onShowModal();
      },
      close: async function () {
        onHideModal();
      },
    };
    setExposedVariables(exposedVariables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    const inputRef = document?.getElementsByClassName('tj-text-input-widget')?.[0];
    inputRef?.blur();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  useEffect(() => {
    if (showModal) {
      onShowModal();
    } else {
      if (document.getElementsByClassName('modal-content')[0] == undefined) {
        onHideModal();
      }
    }

    // Cleanup the effect
    return () => {
      if (document.getElementsByClassName('modal-content')[0] == undefined) {
        onHideModal();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalHeight]);

  const backwardCompatibilityCheck = height == '34' || modalHeight != undefined ? true : false;

  const customStyles = {
    modalBody: {
      height: backwardCompatibilityCheck ? computedHeight : height,
      backgroundColor:
        ['#fff', '#ffffffff'].includes(bodyBackgroundColor) && darkMode ? '#1F2837' : bodyBackgroundColor,
      overflowX: 'hidden',
      overflowY: 'auto',
    },
    modalHeader: {
      backgroundColor:
        ['#fff', '#ffffffff'].includes(headerBackgroundColor) && darkMode ? '#1F2837' : headerBackgroundColor,
      height: MODAL_HEADER.HEIGHT_PX,
      padding: 0,
    },
    modalFooter: {
      backgroundColor:
        ['#000', '#000000', '#000000ff'].includes(footerBackgroundColor) && darkMode ? '#fff' : footerBackgroundColor,
      height: MODAL_FOOTER.HEIGHT_PX,
      padding: 0,
      borderTop: `1px solid var(--border-weak)`,
    },
    buttonStyles: {
      backgroundColor: triggerButtonBackgroundColor,
      color: triggerButtonTextColor,
      width: '100%',
      display: visibility ? '' : 'none',
      '--tblr-btn-color-darker': tinycolor(triggerButtonBackgroundColor).darken(8).toString(),
      boxShadow,
    },
  };

  useEffect(() => {
    if (closeOnClickingOutside) {
      const handleClickOutside = (event) => {
        const modalRef = parentRef?.current?.parentElement?.parentElement?.parentElement;

        if (modalRef && modalRef === event.target) {
          onHideModal();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeOnClickingOutside, parentRef]);

  useEffect(() => {
    if (showModal && parentRef.current) {
      setModalWidth(parentRef.current.offsetWidth);
    }
  }, [showModal, properties.size, id]);

  return (
    <div
      className="container d-flex align-items-center"
      data-disabled={disabledState}
      data-cy={dataCy}
      style={{ height }}
    >
      {useDefaultButton && (
        <button
          disabled={disabledState}
          className="jet-button btn btn-primary p-1 overflow-hidden"
          style={customStyles.buttonStyles}
          onClick={(event) => {
            /**** Start - Logic to reduce the zIndex of modal control box ****/
            controlBoxRef.current = document.querySelector(`.selected-component.sc-${id}`)?.parentElement;
            if (mode === 'edit' && controlBoxRef.current) {
              controlBoxRef.current.classList.add('modal-moveable');
            }
            /**** End - Logic to reduce the zIndex of modal control box ****/

            event.stopPropagation();
            setShowModal(true);
          }}
          data-cy={`${dataCy}-launch-button`}
        >
          {triggerButtonLabel ?? 'Show Modal'}
        </button>
      )}

      <Modal.Component
        show={showModal}
        contentClassName="modal-component"
        container={document.getElementsByClassName('real-canvas')[0]}
        size={size}
        keyboard={true}
        enforceFocus={false}
        animation={false}
        onShow={() => onShowModal()}
        onHide={() => onHideModal()}
        onEscapeKeyDown={() => hideOnEsc && onHideModal()}
        id="modal-container"
        component-id={id}
        backdrop={'static'}
        scrollable={true}
        modalProps={{
          customStyles,
          parentRef,
          id,
          hideCloseButton,
          hideModal,
          component,
          showConfigHandler: mode === 'edit',
          fullscreen: isFullScreen,
          darkMode,
          width: modalWidth,
          showHeader,
          showFooter,
        }}
      >
        {!loadingState ? (
          <>
            <SubContainer
              id={`${id}`}
              canvasHeight={computedHeight}
              styles={{ backgroundColor: customStyles.modalBody.backgroundColor, height: computedHeight }}
              canvasWidth={modalWidth}
              darkMode={darkMode}
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

const ModalHeader = ({ id, customStyles, hideCloseButton, darkMode, width }) => {
  return (
    <BootstrapModal.Header
      style={{ ...customStyles.modalHeader }}
      data-cy={`modal-header`}
      closeButton={!hideCloseButton}
    >
      <SubContainer
        id={`${id}-header`}
        canvasHeight={MODAL_HEADER.CANVAS_HEIGHT}
        canvasWidth={width}
        allowContainerSelect={false}
        darkMode={darkMode}
        styles={{
          backgroundColor: 'transparent',
        }}
      />
    </BootstrapModal.Header>
  );
};

const ModalFooter = ({ id, customStyles, darkMode, width }) => {
  return (
    <BootstrapModal.Footer style={{ ...customStyles.modalFooter }} data-cy={`modal-footer`}>
      <SubContainer
        id={`${id}-footer`}
        canvasHeight={MODAL_FOOTER.CANVAS_HEIGHT}
        canvasWidth={width}
        allowContainerSelect={false}
        darkMode={darkMode}
        styles={{
          margin: 0,
          backgroundColor: 'transparent',
        }}
      />
    </BootstrapModal.Footer>
  );
};

const Component = ({ children, ...restProps }) => {
  const {
    customStyles,
    parentRef,
    id,
    hideCloseButton,
    showConfigHandler,
    fullscreen,
    darkMode,
    width,
    showHeader,
    showFooter,
  } = restProps['modalProps'];

  const setSelectedComponentAsModal = useStore((state) => state.setSelectedComponentAsModal, shallow);

  // When the modal body is clicked capture it and use the callback to set the selected component as modal
  const handleModalBodyClick = (event) => {
    const clickedComponentId = event.target.getAttribute('component-id');

    // Check if the clicked element is part of the modal canvas & same widget with id
    if (id === clickedComponentId) {
      setSelectedComponentAsModal(id);
    }
  };

  return (
    <BootstrapModal {...restProps} onClick={handleModalBodyClick} fullscreen={fullscreen} animation={true}>
      {showConfigHandler && (
        <ConfigHandle
          id={id}
          customClassName={showHeader ? '' : 'modalWidget-config-handle'}
          showHandle={showConfigHandler}
          setSelectedComponentAsModal={setSelectedComponentAsModal}
          componentType="Modal"
          isModalOpen={true}
        />
      )}
      {showHeader && (
        <ModalHeader
          id={id}
          customStyles={customStyles}
          hideCloseButton={hideCloseButton}
          darkMode={darkMode}
          width={width}
        />
      )}
      <BootstrapModal.Body style={{ ...customStyles.modalBody }} ref={parentRef} id={id} data-cy={`modal-body`}>
        {children}
      </BootstrapModal.Body>
      {showFooter && <ModalFooter id={id} darkMode={darkMode} customStyles={customStyles} width={width} />}
    </BootstrapModal>
  );
};

Modal.Component = Component;
