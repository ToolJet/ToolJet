import React from 'react';
import { default as BootstrapModal } from 'react-bootstrap/Modal';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import { getCanvasHeight } from '@/AppBuilder/Widgets/ModalV2/helpers/utils';

export const ModalFooter = React.memo(({ id, isDisabled, customStyles, darkMode, width, footerHeight, onClick }) => {
  const canvasFooterHeight = getCanvasHeight(footerHeight);
  return (
    <BootstrapModal.Footer style={{ ...customStyles.modalFooter }} data-cy={`modal-footer`} onClick={onClick}>
      <SubContainer
        id={`${id}-footer`}
        canvasHeight={canvasFooterHeight}
        canvasWidth={width}
        allowContainerSelect={false}
        darkMode={darkMode}
        styles={{
          margin: 0,
          backgroundColor: 'transparent',
          overflowX: 'hidden',
          overflowY: isDisabled ? 'hidden' : 'auto',
        }}
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
});
