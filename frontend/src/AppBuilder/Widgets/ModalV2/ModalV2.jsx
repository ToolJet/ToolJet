import React, { useRef, useState, useEffect, useMemo } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useExposeState } from '@/AppBuilder/Widgets/ModalV2/hooks/useModalCSA';
import { useResetZIndex } from '@/AppBuilder/Widgets/ModalV2/hooks/useModalZIndex';
import { useModalEventSideEffects } from '@/AppBuilder/Widgets/ModalV2/hooks/useResizeSideEffects';
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
import TablerIcon from '@/_ui/Icon/TablerIcon';
import { useSubcontainerContext } from '@/AppBuilder/_contexts/SubcontainerContext';
import WidgetTooltip from '@/AppBuilder/AppCanvas/WidgetTooltip';

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
  currentLayout,
  componentCount,
  subContainerIndex,
  componentType,
  tooltipProps,
}) {
  const { moduleId } = useModuleContext();
  const { contextPath } = useSubcontainerContext();
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
    triggerButtonBackgroundColor: rawTriggerButtonBackgroundColor,
    triggerButtonHoverBackgroundMode,
    triggerButtonHoverBackgroundColor: rawTriggerButtonHoverBackgroundColor = 'var(--cc-primary-brand)',
    triggerButtonTextColor: rawTriggerButtonTextColor,
    triggerButtonTextSize = 14,
    triggerButtonFontWeight,
    triggerButtonContentAlignment,
    boxShadow,
    headerDividerColor,
    footerDividerColor,
  } = styles;
  // A colour or label bound to a non-text value (a number, `false`, an object) falls back to the definition default
  // rather than crashing the hover-shade maths or rendering an object as a React child. An unset value keeps its old
  // behaviour.
  const textOr = (value, fallback) => (value == null || typeof value === 'string' ? value : fallback);
  const triggerButtonBackgroundColor = textOr(rawTriggerButtonBackgroundColor, 'var(--cc-primary-brand)');
  const triggerButtonHoverBackgroundColor = textOr(rawTriggerButtonHoverBackgroundColor, 'var(--cc-primary-brand)');
  const triggerButtonTextColor = textOr(rawTriggerButtonTextColor, 'var(--cc-surface1-surface)');
  const computedTriggerButtonLabel =
    typeof triggerButtonLabel === 'number'
      ? String(triggerButtonLabel)
      : textOr(triggerButtonLabel, null) ?? 'Show Modal';
  const normalizedTriggerButtonTextSize = Number(triggerButtonTextSize);
  const computedTriggerButtonFontSize = Number.isFinite(normalizedTriggerButtonTextSize)
    ? normalizedTriggerButtonTextSize
    : 14;
  const computedTriggerButtonLineHeight = computedTriggerButtonFontSize * 1.42;
  const computedTriggerButtonIconSize = computedTriggerButtonLineHeight * 0.8;
  const normalizedTriggerButtonFontWeight = triggerButtonFontWeight === 'medium' ? 500 : triggerButtonFontWeight;
  const computedTriggerButtonFontWeight = normalizedTriggerButtonFontWeight
    ? normalizedTriggerButtonFontWeight
    : normalizedTriggerButtonFontWeight === '0'
    ? 0
    : 'normal';
  const isInitialRender = useRef(true);
  const title = properties.title ?? '';
  const titleAlignment = properties.titleAlignment ?? 'left';
  const size = properties.size ?? 'lg';
  const setSelectedComponentAsModal = useStore((state) => state.setSelectedComponentAsModal, shallow);
  const clearSelectedComponents = useStore((state) => state.clearSelectedComponents, shallow);
  const mode = useStore((state) => state.modeStore.modules[moduleId].currentMode, shallow);
  const isDynamicHeightEnabled = dynamicHeight && currentMode === 'view';
  const iconName = styles.icon;

  const computedModalBodyHeight = getModalBodyHeight(modalHeight, showHeader, showFooter, headerHeight, footerHeight);
  const headerHeightPx = getModalHeaderHeight(showHeader, headerHeight);
  const footerHeightPx = getModalFooterHeight(showFooter, footerHeight);
  const isFullScreen = properties.size === 'fullscreen';
  // The shadcn pack's Dialog is this widget in the pack's look (Widgets/Shadcn/ShadOverlays.jsx), optionally a side
  // sheet at full height.
  const skin = componentType === 'ShadDialog' ? 'shadcn' : undefined;
  const sheetSide =
    skin && properties.variant === 'sheet' ? (properties.side === 'left' ? 'left' : 'right') : undefined;
  const computedCanvasHeight = isFullScreen
    ? `calc(100vh - 48px - 40px - ${headerHeightPx} - ${footerHeightPx})`
    : computedModalBodyHeight;

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
    clearSelectedComponents();
  };

  const showModalRef = useRef(false);
  useEffect(() => {
    showModalRef.current = showModal;
  }, [showModal]);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    if (showModal) {
      onShowSideEffects(id);
    } else {
      onHideSideEffects(id);
    }

    const inputRef = document?.getElementsByClassName('tj-text-input-widget')?.[0];
    inputRef?.blur();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  // If modal is unmounted while open (e.g. parent page switches via an action
  // fired from inside the modal), onHide never runs and canvas-content keeps
  // the inline `overflow: hidden !important` set by onShowSideEffects, leaving
  // the next page unscrollable.
  useEffect(() => {
    return () => {
      if (showModalRef.current) {
        onHideSideEffects(id);
      }
    };
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
  // Memoized: this lands in useDynamicHeight's effect deps. A fresh array per
  // render (e.g. inside a Listview row, where Viewer re-renders on every
  // canvasUpdater tick) would refire the effect → scheduleReflow → flushReflows →
  // incrementCanvasUpdater → re-render, freezing the preview in a reflow loop.
  const contextIndices = useMemo(
    () => (contextPath.length > 0 ? contextPath.map((segment) => segment.index) : subContainerIndex),
    [contextPath, subContainerIndex]
  );

  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    height,
    currentLayout,
    isContainer: true,
    componentCount,
    // Includes footerHeight + showFooter so resizing/toggling the footer
    // also triggers a reflow (configured slot heights feed into the modal's
    // computed body height).
    value: JSON.stringify({ headerHeight, footerHeight, showHeader, showFooter, showModal }),
    visibility: isVisible,
    subContainerIndex: contextIndices,
    componentType,
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
    triggerButtonHoverBackgroundMode,
    triggerButtonHoverBackgroundColor,
    triggerButtonTextColor,
    isVisible,
    boxShadow,
    headerDividerColor,
    footerDividerColor,
    direction,
    triggerButtonContentAlignment,
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
        <WidgetTooltip {...tooltipProps} darkMode={darkMode}>
          <button
            disabled={isDisabledTrigger}
            className={`jet-btn btn btn-primary overflow-hidden${skin ? ' tj-shad-trigger' : ''}`}
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
            <span
              className={`${iconVisibility && 'tw-max-w-full tw-min-w-0 tw-overflow-hidden'}`}
              style={{
                fontSize: `${computedTriggerButtonFontSize}px`,
                lineHeight: `${computedTriggerButtonLineHeight}px`,
                fontWeight: computedTriggerButtonFontWeight,
              }}
            >
              {computedTriggerButtonLabel}
            </span>
            {iconVisibility && (
              <TablerIcon
                iconName={iconName}
                fallbackIcon="IconHome2"
                style={{
                  width: `${computedTriggerButtonIconSize}px`,
                  height: `${computedTriggerButtonIconSize}px`,
                  color: iconColor,
                }}
                className="tw-flex-shrink-0"
                stroke={1.5}
              />
            )}
          </button>
        </WidgetTooltip>
      )}

      <ModalWidget
        show={showModal}
        contentClassName="modal-component"
        container={() =>
          document.getElementsByClassName('tj-canvas-area')?.[0] || document.getElementsByClassName('real-canvas')?.[0]
        }
        size={size}
        keyboard={true}
        enforceFocus={false}
        restoreFocus={false}
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
        scrollable={isFullScreen}
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
          subContainerIndex: contextIndices,
          isDynamicHeightEnabled,
          skin,
          sheetSide,
        }}
      />
    </div>
  );
};
