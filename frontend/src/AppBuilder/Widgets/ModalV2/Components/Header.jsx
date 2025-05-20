import React from 'react';
import { default as BootstrapModal } from 'react-bootstrap/Modal';
import { getCanvasHeight } from '@/AppBuilder/Widgets/ModalV2/helpers/utils';
import { HorizontalSlot } from '@/AppBuilder/Widgets/Form/Components/HorizontalSlot';
import { MODAL_CANVAS_PADDING } from '@/AppBuilder/AppCanvas/appCanvasConstants';

export const ModalHeader = React.memo(
  ({
    id,
    isDisabled,
    customStyles,
    hideCloseButton,
    darkMode,
    width,
    onHideModal,
    headerHeight,
    onClick,
    isEditing,
    updateHeaderSizeInStore,
    activeSlot,
    headerMaxHeight,
  }) => {
    const canvasHeaderHeight = getCanvasHeight(headerHeight);
    return (
      <BootstrapModal.Header style={{ ...customStyles.modalHeader }} data-cy={`modal-header`} onClick={onClick}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <HorizontalSlot
            slotName={'header'}
            slotStyle={{
              height: `100%`,
              padding: `${4.5}px ${MODAL_CANVAS_PADDING}px`,
              maxHeight: `${headerMaxHeight}px`,
            }}
            isEditing={isEditing}
            id={`${id}-header`}
            height={canvasHeaderHeight}
            width={width}
            darkMode={darkMode}
            isDisabled={isDisabled}
            isActive={activeSlot === `${id}-header`}
            onResize={updateHeaderSizeInStore}
            componentType="ModalV2"
            maxHeight={headerMaxHeight}
          />
        </div>
        {isDisabled && (
          <div
            id={`${id}-header-disabled`}
            className="tj-modal-disabled-overlay"
            style={{ height: headerHeight || '100%' }}
            onClick={onClick}
            onDrop={(e) => e.stopPropagation()}
          />
        )}
        {!hideCloseButton && (
          <div className="tw-w-14 tw-h-14 tw-flex tw-items-center tw-justify-center tw-pr-4 tw-relative">
            <span
              className={`tj-modal-close-button ${isDisabled ? 'is-disabled' : ''}`}
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
          </div>
        )}
      </BootstrapModal.Header>
    );
  }
);
