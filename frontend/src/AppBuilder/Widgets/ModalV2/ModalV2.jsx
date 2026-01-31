import React, { useRef, useState, useEffect } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useExposeState } from '@/AppBuilder/Widgets/ModalV2/hooks/useModalCSA';
import { useResetZIndex } from '@/AppBuilder/Widgets/ModalV2/hooks/useModalZIndex';
import { useModalEventSideEffects } from '@/AppBuilder/Widgets/ModalV2/hooks/useResizeSideEffects';
import { useEventListener } from '@/_hooks/use-event-listener';
import { ModalWidget } from '@/AppBuilder/Widgets/ModalV2/Components/Modal';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import {
  getModalBodyHeight,
  getModalHeaderHeight,
  getModalFooterHeight,
} from '@/AppBuilder/Widgets/ModalV2/helpers/utils';
import { createModalStyles } from '@/AppBuilder/Widgets/ModalV2/helpers/stylesFactory';
import { onShowSideEffects, onHideSideEffects } from '@/AppBuilder/Widgets/ModalV2/helpers/sideEffects';
import '@/AppBuilder/Widgets/ModalV2/style.scss';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import * as Icons from '@tabler/icons-react';

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
  currentMode,
  adjustComponentPositions,
  currentLayout,
  componentCount,
  subContainerIndex,
}) {
  const { moduleId } = useModuleContext();
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
    dynamicHeight,
  } = properties;
  const {
    iconColor,
    direction,
    iconVisibility,
    headerBackgroundColor,
    footerBackgroundColor,
    bodyBackgroundColor,
    triggerButtonBackgroundColor,
    triggerButtonTextColor,
    boxShadow,
    headerDividerColor,
    footerDividerColor,
  } = styles;
  const isInitialRender = useRef(true);
  const title = properties.title ?? '';
  const titleAlignment = properties.titleAlignment ?? 'left';
  const size = properties.size ?? 'lg';
  const setSelectedComponentAsModal = useStore((state) => state.setSelectedComponentAsModal, shallow);
  const mode = useStore((state) => state.modeStore.modules[moduleId].currentMode, shallow);
  const isDynamicHeightEnabled = dynamicHeight && currentMode === 'view';
  const iconName = styles.icon;
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[iconName] === undefined ? Icons['IconHome2'] : Icons[iconName];

  const computedModalBodyHeight = getModalBodyHeight(modalHeight, showHeader, showFooter, headerHeight, footerHeight);
  const headerHeightPx = getModalHeaderHeight(showHeader, headerHeight);
  const footerHeightPx = getModalFooterHeight(showFooter, footerHeight);
  const isFullScreen = properties.size === 'fullscreen';
  const computedCanvasHeight = isFullScreen
    ? `calc(100vh - 48px - 40px - ${headerHeightPx} - ${footerHeightPx})`
    : computedModalBodyHeight;

  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    height,
    adjustComponentPositions,
    currentLayout,
    isContainer: true,
    componentCount,
    value: JSON.stringify({ headerHeight, showHeader, showModal }),
    visibility: isVisible,
    subContainerIndex,
  });

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
    fireEvent('onClose');
    setExposedVariable('show', false);
    setShowModal(false);
  }

  function openModal() {
    setExposedVariable('show', true);
    setShowModal(true);
  }

  const onShowModal = () => {
    openModal();
    setSelectedComponentAsModal(id);
  };

  const onHideModal = () => {
    hideModal();
  };

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    if (showModal) {
      onShowSideEffects();
    } else {
      onHideSideEffects();
    }

    const inputRef = document?.getElementsByClassName('tj-text-input-widget')?.[0];
    inputRef?.blur();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

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
    headerDividerColor,
    footerDividerColor,
    direction,
  });

  const { modalWidth, parentRef } = useModalEventSideEffects({
    showModal,
    size,
    id,
    onShowSideEffects,
    closeOnClickingOutside,
    onHideModal,
  });

  return (
    <div
      className="d-flex align-items-center"
      data-disabled={isDisabledTrigger}
      data-cy={dataCy}
      style={{
        height: '100%',
      }}
    >
      {useDefaultButton && isVisible && (
        <button
          disabled={isDisabledTrigger}
          className="jet-button btn btn-primary overflow-hidden"
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
          {/* To maintain backward compatibility, apply class only if icon is visible */}
          <span className={`${iconVisibility && 'tw-max-w-full tw-min-w-0 tw-overflow-hidden'}`}>
            {triggerButtonLabel ?? 'Show Modal'}
          </span>
          {iconVisibility && (
            <IconElement
              style={{
                width: '16px',
                height: '16px',
                color: iconColor,
              }}
              className="tw-flex-shrink-0"
              stroke={1.5}
            />
          )}
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
        onShow={() => {
          onShowModal();
          fireEvent('onOpen');
        }}
        onHide={() => {
          onHideModal();
        }}
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
          isFullScreen,
          darkMode,
          subContainerIndex,
          isDynamicHeightEnabled,
        }}
      />
    </div>
  );
};
