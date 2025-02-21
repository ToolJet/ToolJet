import React, { useEffect } from 'react';
import { default as BootstrapModal } from 'react-bootstrap/Modal';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import { ConfigHandle } from '@/AppBuilder/AppCanvas/ConfigHandle/ConfigHandle';
import { ModalHeader } from '@/AppBuilder/Widgets/ModalV2/Components/Header';
import { ModalFooter } from '@/AppBuilder/Widgets/ModalV2/Components/Footer';

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
  } = restProps['modalProps'];

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

  return (
    <BootstrapModal
      {...restProps}
      contentClassName="modal-component tj-modal-widget-content"
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
        />
      )}
    </BootstrapModal>
  );
};
