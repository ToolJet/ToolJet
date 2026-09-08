import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { ModalWidget } from '../Modal';

// Renders with isLoading/showHeader/showFooter/showConfigHandler all false so
// the widget mounts without its SubContainer/Header/Footer subtrees, which
// need App Builder drag-drop context this test doesn't set up.
const buildModalProps = (overrides = {}) => ({
  customStyles: { modalBody: {} },
  parentRef: { current: null },
  id: 'modal-test-1',
  showConfigHandler: false,
  isDisabled: false,
  isLoading: true,
  modalBodyHeight: '800px',
  onHideModal: () => {},
  hideCloseButton: false,
  darkMode: false,
  modalWidth: 500,
  showHeader: false,
  hideOnEsc: true,
  showFooter: false,
  headerHeight: 80,
  footerHeight: 80,
  onSelectModal: () => {},
  modalHeight: '1000',
  isFullScreen: false,
  subContainerIndex: null,
  isDynamicHeightEnabled: false,
  ...overrides,
});

describe('ModalWidget - static height application', () => {
  // Break this catches: reverting `max-height` back to the raw `modalHeight`
  // value (no unit) makes this assert '' instead of '1000px', reproducing
  // the "modal renders far smaller than configured" bug.
  it('applies max-height with the same unit-suffixed value as height', async () => {
    render(<ModalWidget show={true} modalProps={buildModalProps()} />);

    await waitFor(() => {
      const modalContent = document.querySelector('.tj-modal-content-modal-test-1');
      expect(modalContent.style.height).toBe('1000px');
    });

    const modalContent = document.querySelector('.tj-modal-content-modal-test-1');
    expect(modalContent.style.maxHeight).toBe('1000px');
  });
});
