import React, { useRef, useState, useEffect } from 'react';
import { default as BootstrapModal } from 'react-bootstrap/Modal';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import { ConfigHandle } from '@/AppBuilder/AppCanvas/ConfigHandle/ConfigHandle';
import { useGridStore } from '@/_stores/gridStore';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useExposeState } from '@/AppBuilder/_hooks/useModalCSA';
import { useEventListener } from '@/_hooks/use-event-listener';
var tinycolor = require('tinycolor2');

const getModalBodyHeight = (height, headerHeightPx = '56px') => {
  let modalHeight = height.includes('px') ? parseInt(height, 10) : height;
  let headerHeight = parseInt(headerHeightPx, 10);

  modalHeight = modalHeight - headerHeight;
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
    hideTitleBar,
    useDefaultButton,
    triggerButtonLabel,
    modalHeight,
  } = properties;
  const {
    headerBackgroundColor,
    headerTextColor,
    bodyBackgroundColor,
    triggerButtonBackgroundColor,
    triggerButtonTextColor,
    boxShadow,
  } = styles;
  const parentRef = useRef(null);
  const controlBoxRef = useRef(null);
  const isInitialRender = useRef(true);
  const title = properties.title ?? '';
  const titleAlignment = properties.titleAlignment ?? 'left';
  const size = properties.size ?? 'lg';
  const [modalWidth, setModalWidth] = useState();
  const mode = useStore((state) => state.currentMode, shallow);
  const isFullScreen = properties.size === 'fullscreen';

  const computedModalBodyHeight = getModalBodyHeight(modalHeight);
  const computedCanvasHeight = isFullScreen ? `calc(100vh - 48px - 40px - 56px)` : computedModalBodyHeight;

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

  useEffect(() => {
    const exposedVariables = {
      open: async function () {
        setExposedVariable('show', true);
        setShowModal(true);
      },
      close: async function () {
        setExposedVariable('show', false);
        setShowModal(false);
      },
    };
    setExposedVariables(exposedVariables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function hideModal() {
    setExposedVariable('show', false);
    setShowModal(false);
  }

  function openModal() {
    setExposedVariable('show', true);
    setShowModal(true);
  }

  const { isDisabledTrigger, isDisabledModal, isVisible, isLoading } = useExposeState(
    properties.loadingState,
    properties.triggerVisibility,
    properties.disabledModal,
    properties.disabledTrigger,
    setExposedVariables,
    setExposedVariable
  );

  // Side effects for modal, which include dom manipulation to hide overflow when opening
  // And cleaning up dom when modal is closed

  const onShowSideEffects = () => {
    const canvasElement = document.querySelector('.page-container.canvas-container');
    const realCanvasEl = document.getElementsByClassName('real-canvas')[0];
    const allModalContainers = realCanvasEl.querySelectorAll('.modal');
    const modalContainer = allModalContainers[allModalContainers.length - 1];

    if (canvasElement && realCanvasEl && modalContainer) {
      const currentScroll = canvasElement.scrollTop;
      canvasElement.style.overflowY = 'hidden';

      modalContainer.style.height = `${canvasElement.offsetHeight}px`;
      modalContainer.style.top = `${currentScroll}px`;
      fireEvent('onOpen');
    }
  };

  const onHideSideEffects = () => {
    const canvasElement = document.querySelector('.page-container.canvas-container');
    const realCanvasEl = document.getElementsByClassName('real-canvas')[0];
    const allModalContainers = realCanvasEl.querySelectorAll('.modal');
    const modalContainer = allModalContainers[allModalContainers.length - 1];
    const hasManyModalsOpen = allModalContainers.length > 1;

    if (canvasElement && realCanvasEl && modalContainer) {
      modalContainer.style.height = ``;
      modalContainer.style.top = ``;
      fireEvent('onClose');
    }
    if (canvasElement && !hasManyModalsOpen) {
      canvasElement.style.overflow = 'auto';
    }
  };

  useEventListener('resize', onShowSideEffects, window);

  const onShowModal = () => {
    openModal();
    onShowSideEffects();
  };

  const onHideModal = () => {
    onHideSideEffects();
    hideModal();
  };

  // When query panel opens or closes, the modal container height should change to
  // accomodate the new height of the canvas

  useEffect(() => {
    // Select the DOM element
    const canvasElement = document.querySelector('.page-container.canvas-container');

    if (!canvasElement) return; // Ensure the element exists

    // Create a ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Update the height state when the element's height changes
        onShowSideEffects();
      }
    });

    // Observe the canvas element
    resizeObserver.observe(canvasElement);

    return () => {
      // Cleanup observer on component unmount
      resizeObserver.disconnect();
    };
  }, []);

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
  }, [modalHeight, size]);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    fireEvent(!showModal ? 'onClose' : 'onOpen');
    const inputRef = document?.getElementsByClassName('tj-text-input-widget')?.[0];
    inputRef?.blur();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  const backwardCompatibilityCheck = height == '34' || modalHeight != undefined ? true : false;

  const customStyles = {
    modalBody: {
      height: backwardCompatibilityCheck ? computedCanvasHeight : height,
      backgroundColor:
        ['#fff', '#ffffffff'].includes(bodyBackgroundColor) && darkMode ? '#1F2837' : bodyBackgroundColor,
      overflowX: 'hidden',
      overflowY: 'auto',
      position: 'relative',
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
      display: isVisible ? '' : 'none',
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
      data-disabled={isDisabledTrigger}
      data-cy={dataCy}
      style={{ height }}
    >
      {useDefaultButton && isVisible && (
        <button
          disabled={isDisabledTrigger}
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
          title,
          titleAlignment,
          hideTitleBar,
          hideCloseButton,
          onHideModal,
          component,
          modalHeight,
          isDisabled: isDisabledModal,
          showConfigHandler: mode === 'edit',
          fullscreen: isFullScreen,
        }}
      >
        {!isLoading ? (
          <>
            <SubContainer
              id={`${id}`}
              canvasHeight={computedCanvasHeight}
              styles={{ backgroundColor: customStyles.modalBody.backgroundColor, height: 'inherit' }}
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

const Component = ({ children, ...restProps }) => {
  const {
    customStyles,
    parentRef,
    id,
    title,
    titleAlignment,
    hideTitleBar,
    hideCloseButton,
    onHideModal,
    showConfigHandler,
    isDisabled,
    modalHeight,
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
    <BootstrapModal {...restProps} animation={true} onClick={handleModalBodyClick}>
      {showConfigHandler && (
        <ConfigHandle
          id={id}
          customClassName={hideTitleBar ? 'modalWidget-config-handle' : ''}
          showHandle={showConfigHandler}
          setSelectedComponentAsModal={setSelectedComponentAsModal}
          componentType="Modal"
          isModalOpen={true}
        />
      )}
      {!hideTitleBar && (
        <BootstrapModal.Header style={{ ...customStyles.modalHeader }} data-cy={`modal-header`}>
          <BootstrapModal.Title
            style={{
              textAlign: titleAlignment,
              width: '100%',
            }}
            id="contained-modal-title-vcenter"
            data-cy={`modal-title`}
          >
            {title}
          </BootstrapModal.Title>
          {!hideCloseButton && (
            <span
              className="cursor-pointer"
              data-cy={`modal-close-button`}
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onHideModal();
              }}
            >
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
      <BootstrapModal.Body style={{ ...customStyles.modalBody }} ref={parentRef} id={id} data-cy={`modal-body`}>
        {isDisabled && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              height: modalHeight || '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              zIndex: 1,
            }}
          />
        )}
        {children}
      </BootstrapModal.Body>
    </BootstrapModal>
  );
};

Modal.Component = Component;
