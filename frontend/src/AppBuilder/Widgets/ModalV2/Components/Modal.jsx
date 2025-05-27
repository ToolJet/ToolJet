import React, { useEffect } from 'react';
import { default as BootstrapModal } from 'react-bootstrap/Modal';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import { ConfigHandle } from '@/AppBuilder/AppCanvas/ConfigHandle/ConfigHandle';
import { ModalHeader } from '@/AppBuilder/Widgets/ModalV2/Components/Header';
import { ModalFooter } from '@/AppBuilder/Widgets/ModalV2/Components/Footer';
import useStore from '@/AppBuilder/_stores/store';
import { useActiveSlot } from '@/AppBuilder/_hooks/useActiveSlot';
export const ModalWidget = ({ ...restProps }) => {
  const {
    customStyles,
    parentRef,
    id,
    showConfigHandler,
    isDisabled,
    isLoading,
    modalBodyHeight,
    onHideModal,
    hideCloseButton,
    darkMode,
    modalWidth,
    showHeader,
    hideOnEsc,
    showFooter,
    headerHeight,
    footerHeight,
    onSelectModal,
    modalHeight,
    isFullScreen,
  } = restProps['modalProps'];

  const isEditing = useStore((state) => state.currentMode === 'edit');
  const setComponentProperty = useStore((state) => state.setComponentProperty);
  const activeSlot = useActiveSlot(isEditing ? id : null); // Track the active slot for this widget
  const _modalHeight = isFullScreen ? '100vh' : `${modalHeight}px`;
  const headerMaxHeight = isFullScreen
    ? `calc(${_modalHeight} - ${footerHeight} - 100px - 10px)`
    : parseInt(_modalHeight, 10) - parseInt(footerHeight, 10) - 100 - 10;
  const footerMaxHeight = isFullScreen
    ? `calc(${_modalHeight} - ${headerHeight} - 100px - 10px)`
    : parseInt(_modalHeight, 10) - parseInt(headerHeight, 10) - 100 - 10;

  // const headerMaxHeight = `calc(${_modalHeight} - ${footerHeight} - 100px - 10px)`;
  // const footerMaxHeight = `calc(${_modalHeight} - ${headerHeight} - 100px - 10px)`;

  // const headerMaxHeight = parseInt(_modalHeight, 10) - parseInt(footerHeight, 10) - 100 - 10;
  // const footerMaxHeight = parseInt(_modalHeight, 10) - parseInt(headerHeight, 10) - 100 - 10;
  console.log(headerMaxHeight, modalHeight, isFullScreen, 'headerMaxHeight');
  console.log(footerMaxHeight, 'footerMaxHeight');
  const updateHeaderSizeInStore = ({ newHeight }) => {
    const _height = parseInt(newHeight, 10);
    setComponentProperty(id, `headerHeight`, _height, 'properties', 'value', false);
  };

  const updateFooterSizeInStore = ({ newHeight }) => {
    const _height = parseInt(newHeight, 10);
    setComponentProperty(id, `footerHeight`, _height, 'properties', 'value', false);
  };

  // When the modal body is clicked capture it and use the callback to set the selected component as modal
  const handleModalSlotClick = (event) => {
    const clickedComponentId = event.target.getAttribute('component-id');
    const clickedId = event.target.getAttribute('id');

    // Check if the clicked element is part of the modal canvas & same widget with id
    if (clickedComponentId?.includes(id)) {
      onSelectModal(id);
    } else if (clickedId?.includes(id)) {
      onSelectModal(id);
    }
  };

  useEffect(() => {
    // When modal is active, prevent drop event on backdrop (else widgets droppped will get added to canvas)
    const preventBackdropDrop = (e) => {
      if (e.target.className === 'fade modal show') {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('drop', preventBackdropDrop);
    return () => {
      document.removeEventListener('drop', preventBackdropDrop);
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      const modalContent = document.querySelector(`.tj-modal-content-${id}`);
      if (restProps.show && modalContent) {
        console.log(_modalHeight, 'modalContent');
        modalContent.style.height = isFullScreen ? '100vh' : `${modalHeight}px`;
      }
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalHeight, restProps.show, isFullScreen]);

  return (
    <BootstrapModal
      {...restProps}
      contentClassName={`modal-component tj-modal--container tj-modal-widget-content tj-modal-content-${id}`}
      animation={true}
      onEscapeKeyDown={(e) => {
        e.preventDefault();
        if (hideOnEsc) {
          onHideModal();
        }
      }}
      onClick={handleModalSlotClick}
    >
      {showConfigHandler && (
        <ConfigHandle
          id={id}
          customClassName={showHeader ? '' : 'modalWidget-config-handle tw-h-0'}
          showHandle={showConfigHandler}
          setSelectedComponentAsModal={onSelectModal}
          componentType="Modal"
          isModalOpen={true}
        />
      )}
      {showHeader && (
        <ModalHeader
          id={id}
          isDisabled={isDisabled}
          customStyles={customStyles}
          hideCloseButton={hideCloseButton}
          darkMode={darkMode}
          width={modalWidth}
          onHideModal={onHideModal}
          headerHeight={headerHeight}
          onClick={handleModalSlotClick}
          isEditing={isEditing}
          updateHeaderSizeInStore={updateHeaderSizeInStore}
          activeSlot={activeSlot}
          headerMaxHeight={headerMaxHeight}
          isFullScreen={isFullScreen}
        />
      )}
      <BootstrapModal.Body style={{ ...customStyles.modalBody }} ref={parentRef} id={id} data-cy={`modal-body`}>
        {isDisabled && (
          <div
            id={`${id}-body-disabled`}
            className="tj-modal-disabled-overlay"
            style={{
              height: modalBodyHeight || '100%',
            }}
            onDrop={(e) => e.stopPropagation()}
          />
        )}
        {!isLoading ? (
          <>
            <SubContainer
              id={`${id}`}
              canvasHeight={modalBodyHeight}
              styles={{ backgroundColor: customStyles.modalBody.backgroundColor }}
              canvasWidth={modalWidth}
              darkMode={darkMode}
              componentType="ModalV2"
            />
          </>
        ) : (
          <div className="p-2">
            <center>
              <div className="spinner-border mt-5" role="status"></div>
            </center>
          </div>
        )}
      </BootstrapModal.Body>
      {showFooter && (
        <ModalFooter
          id={id}
          isDisabled={isDisabled}
          darkMode={darkMode}
          customStyles={customStyles}
          width={modalWidth}
          footerHeight={footerHeight}
          onClick={handleModalSlotClick}
          isEditing={isEditing}
          updateFooterSizeInStore={updateFooterSizeInStore}
          activeSlot={activeSlot}
          footerMaxHeight={footerMaxHeight}
          isFullScreen={isFullScreen}
        />
      )}
    </BootstrapModal>
  );
};
