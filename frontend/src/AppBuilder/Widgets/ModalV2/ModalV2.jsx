import React, { useRef, useState, useEffect } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useExposeState } from '@/AppBuilder/Widgets/ModalV2/hooks/useModalCSA';
import { useResetZIndex } from '@/AppBuilder/Widgets/ModalV2/hooks/useModalZIndex';
import { useModalEventSideEffects } from '@/AppBuilder/Widgets/ModalV2/hooks/useResizeSideEffects';
import { useEventListener } from '@/_hooks/use-event-listener';
import { ModalWidget } from '@/AppBuilder/Widgets/ModalV2/Components/Modal';

import {
  getModalBodyHeight,
  getModalHeaderHeight,
  getModalFooterHeight,
} from '@/AppBuilder/Widgets/ModalV2/helpers/utils';
import { createModalStyles } from '@/AppBuilder/Widgets/ModalV2/helpers/stylesFactory';
import { onShowSideEffects, onHideSideEffects } from '@/AppBuilder/Widgets/ModalV2/helpers/sideEffects';

import '@/AppBuilder/Widgets/ModalV2/style.scss';

export const ModalV2 = function Modal({
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
    showHeader,
    showFooter,
    headerHeight,
    footerHeight,
  } = properties;
  const {
    headerBackgroundColor,
    footerBackgroundColor,
    bodyBackgroundColor,
    triggerButtonBackgroundColor,
    triggerButtonTextColor,
    boxShadow,
  } = styles;
  const isInitialRender = useRef(true);
  const title = properties.title ?? '';
  const titleAlignment = properties.titleAlignment ?? 'left';
  const size = properties.size ?? 'lg';
  const setSelectedComponentAsModal = useStore((state) => state.setSelectedComponentAsModal, shallow);
  const mode = useStore((state) => state.currentMode, shallow);

  const computedModalBodyHeight = getModalBodyHeight(modalHeight, showHeader, showFooter, headerHeight, footerHeight);
  const headerHeightPx = getModalHeaderHeight(showHeader, headerHeight);
  const footerHeightPx = getModalFooterHeight(showFooter, footerHeight);
  const isFullScreen = properties.size === 'fullscreen';
  const computedCanvasHeight = isFullScreen
    ? `calc(100vh - 48px - 40px - ${headerHeightPx} - ${footerHeightPx})`
    : computedModalBodyHeight;

  useEffect(() => {
    const exposedVariables = {
      open: async () => {
        setExposedVariable('show', true);
        setShowModal(true);
      },
      close: async () => {
        setExposedVariable('show', false);
        setShowModal(false);
      },
    };
    setExposedVariables(exposedVariables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setExposedVariable, setExposedVariables]);

  function hideModal() {
    setExposedVariable('show', false);
    setShowModal(false);
  }

  function openModal() {
    setExposedVariable('show', true);
    setShowModal(true);
  }

  useEventListener('resize', onShowSideEffects, window);

  const onShowModal = () => {
    openModal();
    onShowSideEffects();
    fireEvent('onOpen');
    setSelectedComponentAsModal(id);
  };

  const onHideModal = () => {
    onHideSideEffects(() => fireEvent('onOpen'));
    hideModal();
    setSelectedComponentAsModal(null);
  };

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    const inputRef = document?.getElementsByClassName('tj-text-input-widget')?.[0];
    inputRef?.blur();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const { controlBoxRef } = useResetZIndex({ showModal, id, mode });
  const { isDisabledTrigger, isDisabledModal, isVisible, isLoading } = useExposeState({
    loadingState: properties.loadingState,
    visibleState: properties.visibility,
    disabledModalState: properties.disabledModal,
    disabledTriggerState: properties.disabledTrigger,
    setExposedVariables,
    setExposedVariable,
    onHideModal,
    onShowModal,
  });

  const customStyles = createModalStyles({
    height,
    modalHeight,
    computedCanvasHeight,
    bodyBackgroundColor,
    darkMode,
    isDisabledModal,
    headerBackgroundColor,
    headerHeightPx,
    footerBackgroundColor,
    footerHeightPx,
    triggerButtonBackgroundColor,
    triggerButtonTextColor,
    isVisible,
    boxShadow,
  });

  const { modalWidth, parentRef } = useModalEventSideEffects({
    showModal,
    size,
    id,
    onShowSideEffects,
    closeOnClickingOutside,
    onHideModal,
  });

  const setComponentProperty = useStore((state) => state.setComponentProperty, shallow);

  const updateSizeInStore = (newHeight) => {
    const _height = Number.parseInt(newHeight, 10);
    setComponentProperty(id, 'modalHeight', _height, 'properties', 'value', false);
  };

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
          type="button"
          data-cy={`${dataCy}-launch-button`}
        >
          {triggerButtonLabel ?? 'Show Modal'}
        </button>
      )}

      <ModalWidget
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
        dataCy={dataCy}
        initialModalHeight={properties.modalHeight}
        updateSizeInStore={updateSizeInStore}
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
          hideOnEsc,
          modalHeight,
          isLoading,
          isDisabled: isDisabledModal,
          showConfigHandler: mode === 'edit',
          fullscreen: isFullScreen,
          showHeader,
          showFooter,
          headerHeight: headerHeightPx,
          footerHeight: footerHeightPx,
          modalBodyHeight: computedCanvasHeight,
          modalWidth,
          onSelectModal: setSelectedComponentAsModal,
        }}
      />
    </div>
  );
};
