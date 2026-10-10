import React, { useEffect, useState } from 'react';
import { default as BootstrapModal } from 'react-bootstrap/Modal';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import { ConfigHandle } from '@/AppBuilder/AppCanvas/ConfigHandle/ConfigHandle';
import { getCanvasHeight, isFalsyOrMultipleZeros } from '@/AppBuilder/Widgets/ModalV2/helpers/utils';
import { ModalHeader } from '@/AppBuilder/Widgets/ModalV2/Components/Header';
import { ModalFooter } from '@/AppBuilder/Widgets/ModalV2/Components/Footer';
import useStore from '@/AppBuilder/_stores/store';
import { useActiveSlot } from '@/AppBuilder/_hooks/useActiveSlot';
import Spinner from '@/_ui/Spinner';
import classNames from 'classnames';
import { shallow } from 'zustand/shallow';
import { getDynamicLayoutKey } from '@/AppBuilder/_stores/utils/dynamicHeightReflow';

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
    subContainerIndex,
    isDynamicHeightEnabled,
    skin,
    sheetSide,
  } = restProps['modalProps'];

  const setComponentProperty = useStore((state) => state.setComponentProperty);
  const activeSlot = useActiveSlot(id); // Track the active slot for this widget
  const temporaryLayouts = useStore((state) => {
    return state.temporaryLayouts?.[getDynamicLayoutKey(id, subContainerIndex, '-body')];
  }, shallow);
  const [needsBodyScroll, setNeedsBodyScroll] = useState(false);
  const _modalHeight = isFullScreen ? '100vh' : `${modalHeight}px`;

  const headerMaxHeight = isFullScreen
    ? `calc(${_modalHeight} - ${footerHeight} - 100px - 10px)`
    : parseInt(_modalHeight, 10) - parseInt(footerHeight, 10) - 100 - 10;
  const footerMaxHeight = isFullScreen
    ? `calc(${_modalHeight} - ${headerHeight} - 100px - 10px)`
    : parseInt(_modalHeight, 10) - parseInt(headerHeight, 10) - 100 - 10;

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
    // If shift is pressed, don't select the component since its used for multi select
    const isShiftPressed = event.shiftKey || event.nativeEvent?.shiftKey || false;
    if (isShiftPressed) return;

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
        if (sheetSide) {
          // A side sheet spans the visible height of the window; its body scrolls. The modal layer is as tall as the
          // window but can start below a bar (the viewer's Preview header), so 100% ran past the bottom and hid the
          // footer buttons: size the dialog to what is visible from the layer's top.
          const layerTop = Math.max(0, modalContent.closest('.modal')?.getBoundingClientRect().top ?? 0);
          const visibleHeight = `${Math.max(0, window.innerHeight - layerTop)}px`;
          const dialog = modalContent.closest('.modal-dialog');
          dialog?.style.setProperty('height', visibleHeight, 'important');
          dialog?.style.setProperty('max-height', visibleHeight, 'important');
          modalContent.style.setProperty('height', '100%', 'important');
          modalContent.style.setProperty('max-height', '100%', 'important');
          setNeedsBodyScroll(true);
        } else if (!isFalsyOrMultipleZeros(modalHeight)) {
          if (isDynamicHeightEnabled) {
            const canvasHeaderHeight = getCanvasHeight(headerHeight);
            const canvasFooterHeight = getCanvasHeight(footerHeight);
            const canvasContentHeight = temporaryLayouts?.height
              ? temporaryLayouts?.height
              : getCanvasHeight(modalBodyHeight);
            const totalHeight = canvasHeaderHeight + canvasFooterHeight + canvasContentHeight;
            modalContent.style.setProperty('height', `${totalHeight}px`, 'important');
            modalContent.style.setProperty('min-height', isFullScreen ? '100%' : `${modalHeight}px`, 'important');
            modalContent.style.setProperty('max-height', isFullScreen ? '100%' : `85vh`, 'important');
            const maxModalHeightPx = isFullScreen ? window.innerHeight : window.innerHeight * 0.85;
            setNeedsBodyScroll(totalHeight > maxModalHeightPx);
          } else {
            modalContent.style.setProperty('height', _modalHeight, 'important');
            modalContent.style.setProperty('max-height', isFullScreen ? '100%' : _modalHeight, 'important');
            setNeedsBodyScroll(false);
          }
        } else {
          modalContent.style.setProperty('height', '5px', 'important');
        }
      }
    }, 100);
  }, [
    modalHeight,
    modalBodyHeight,
    headerHeight,
    footerHeight,
    showHeader,
    showFooter,
    restProps.show,
    isFullScreen,
    isDynamicHeightEnabled,
    temporaryLayouts,
    _modalHeight,
    id,
    sheetSide,
  ]);

  return (
    <BootstrapModal
      {...restProps}
      contentClassName={classNames(
        `modal-component tj-modal--container tj-modal-widget-content tj-modal-content-${id}`,
        isDynamicHeightEnabled && `dynamic-${id}`,
        (isDynamicHeightEnabled || sheetSide) && needsBodyScroll && 'tj-modal-allow-body-scroll',
        skin && 'tj-shad-tokens tj-shad-dialog-content'
      )}
      dialogClassName={classNames(skin && 'tj-shad-dialog', sheetSide && `tj-shad-sheet tj-shad-sheet--${sheetSide}`)}
      backdropClassName={skin ? 'tj-shad-backdrop' : undefined}
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
          visibility={true}
          subContainerIndex={null}
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
              styles={{
                backgroundColor: customStyles.modalBody.backgroundColor,
                overflowY: isDisabled || (isDynamicHeightEnabled && !needsBodyScroll) ? 'hidden' : 'auto',
              }}
              canvasWidth={modalWidth}
              darkMode={darkMode}
              componentType="ModalV2"
            />
          </>
        ) : (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
            <center>
              <Spinner />
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
          updateFooterSizeInStore={updateFooterSizeInStore}
          activeSlot={activeSlot}
          footerMaxHeight={footerMaxHeight}
          isFullScreen={isFullScreen}
        />
      )}
    </BootstrapModal>
  );
};
