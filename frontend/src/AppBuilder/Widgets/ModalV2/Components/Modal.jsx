import React, { useEffect } from 'react';
import { useResizable } from '@/AppBuilder/_hooks/useMoveable';
import { default as BootstrapModal } from 'react-bootstrap/Modal';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import { ConfigHandle } from '@/AppBuilder/AppCanvas/ConfigHandle/ConfigHandle';
import { ModalHeader } from '@/AppBuilder/Widgets/ModalV2/Components/Header';
import { ModalFooter } from '@/AppBuilder/Widgets/ModalV2/Components/Footer';

export const ModalWidget = ({ updateSizeInStore, ...restProps }) => {
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
    isFullScreen,
  } = restProps.modalProps;

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

  const { getRootProps, getHandleProps, getResizeState } = useResizable({
    parentRef,
    initialHeight: modalBodyHeight ?? 56, // Use passed initialModalHeight or fallback
    initialWidth: '100%', // Modal width is typically controlled by 'size' prop or specific width style
    minHeight: 100, // Minimum sensible height for a modal body
    maxHeight: typeof window !== 'undefined' ? window.innerHeight * 0.9 : 800, // Max 90% of viewport height
    minWidth: 200, // Minimum sensible width
    maxWidth: '100%',
    stepHeight: 1,
    onResize: ({ newHeight }) => {},
    onDragEnd: ({ newHeight }) => {
      // Calculate total modal height: body + header + footer
      const headerH = showHeader ? Number.parseInt(headerHeight, 10) : 0;
      const footerH = showFooter ? Number.parseInt(footerHeight, 10) : 0;
      const totalHeight = Number.parseInt(newHeight, 10) + headerH + footerH;
      if (updateSizeInStore) {
        updateSizeInStore(totalHeight);
      }
    },
    isReverseVerticalDrag: false, // Typically false for bottom handle
  });
  const { height: liveResizedHeight, isDragging } = getResizeState();

  const actualModalBodyHeight = liveResizedHeight ? `${liveResizedHeight}` : modalBodyHeight;

  const contentClasses = [
    'modal-component',
    'tj-modal--container',
    'tj-modal-widget-content',
    showConfigHandler ? 'is-editing' : '',
    isDragging ? 'dragging' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <BootstrapModal
      {...restProps}
      contentClassName={contentClasses}
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
      <BootstrapModal.Body
        style={{
          ...customStyles.modalBody,
          overflowY: 'auto',
        }}
        // ref={parentRef}
        id={id}
        data-cy={'modal-body'}
        className="modal-body-resizable"
      >
        {isDisabled && (
          <div
            id={`${id}-body-disabled`}
            className="tj-modal-disabled-overlay"
            style={{
              height: actualModalBodyHeight || '100%',
            }}
            onDrop={(e) => e.stopPropagation()}
          />
        )}
        {!isLoading ? (
          <div
            style={{
              backgroundColor: customStyles.modalBody.backgroundColor,
              height: actualModalBodyHeight,
              overflowY: 'auto',
            }}
            {...getRootProps()} // Apply root props for resizable area
          >
            <SubContainer
              id={`${id}`}
              canvasHeight={actualModalBodyHeight}
              styles={{
                backgroundColor: customStyles.modalBody.backgroundColor,
                height: actualModalBodyHeight,
              }}
              canvasWidth={modalWidth}
              darkMode={darkMode}
              componentType="ModalV2"
            />
          </div>
        ) : (
          <div className="p-2">
            <center>
              <div className="spinner-border mt-5" role="status" />
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
      {/* Resize Handle */}
      {!isFullScreen && showConfigHandler && (
        <div className="resize-handle modal-resize-handle-bottom" {...getHandleProps()} />
      )}
    </BootstrapModal>
  );
};
