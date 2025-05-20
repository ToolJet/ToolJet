import React from 'react';
import { default as BootstrapModal } from 'react-bootstrap/Modal';
import { getCanvasHeight } from '@/AppBuilder/Widgets/ModalV2/helpers/utils';
import { HorizontalSlot } from '@/AppBuilder/Widgets/Form/Components/HorizontalSlot';
import { MODAL_CANVAS_PADDING } from '@/AppBuilder/AppCanvas/appCanvasConstants';

export const ModalFooter = React.memo(
  ({
    id,
    isDisabled,
    customStyles,
    darkMode,
    width,
    footerHeight,
    onClick,
    isEditing,
    updateFooterSizeInStore,
    activeSlot,
    footerMaxHeight,
  }) => {
    const canvasFooterHeight = getCanvasHeight(footerHeight);
    return (
      <BootstrapModal.Footer style={{ ...customStyles.modalFooter }} data-cy={`modal-footer`} onClick={onClick}>
        <HorizontalSlot
          slotName={'footer'}
          slotStyle={{
            width: `100%`,
            padding: `${4.5}px ${MODAL_CANVAS_PADDING}px`,
            margin: '0px',
          }}
          isEditing={isEditing}
          id={`${id}-footer`}
          height={canvasFooterHeight}
          width={width}
          darkMode={darkMode}
          isDisabled={isDisabled}
          isActive={activeSlot === `${id}-footer`}
          onResize={updateFooterSizeInStore}
          componentType="ModalV2"
          maxHeight={footerMaxHeight}
        />
        {isDisabled && (
          <div
            id={`${id}-footer-disabled`}
            className="tj-modal-disabled-overlay"
            style={{ height: footerHeight || '100%' }}
            onClick={onClick}
            onDrop={(e) => e.stopPropagation()}
          />
        )}
      </BootstrapModal.Footer>
    );
  }
);
