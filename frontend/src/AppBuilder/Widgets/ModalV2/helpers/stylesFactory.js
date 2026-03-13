import { MODAL_CANVAS_PADDING } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { getModifiedColor } from '@/AppBuilder/Widgets/utils';

export function createModalStyles({
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
  triggerButtonHoverBackgroundColor = 'var(--cc-primary-brand)',
  triggerButtonTextColor,
  isVisible,
  boxShadow,
  headerDividerColor,
  footerDividerColor,
  direction,
  triggerButtonContentAlignment,
}) {
  const backwardCompatibilityCheck = height == '34' || modalHeight != undefined ? true : false;
  const isReverseDirection = direction === 'left';
  const computedTriggerButtonContentAlignment =
    {
      left: isReverseDirection ? 'flex-end' : 'flex-start',
      center: 'center',
      right: isReverseDirection ? 'flex-start' : 'flex-end',
    }[triggerButtonContentAlignment] ?? 'center';
  return {
    modalBody: {
      height: backwardCompatibilityCheck ? computedCanvasHeight : height,
      backgroundColor:
        ['#fff', '#ffffffff'].includes(bodyBackgroundColor) && darkMode ? '#1F2837' : bodyBackgroundColor,
      padding: `${MODAL_CANVAS_PADDING}px`,
    },
    modalHeader: {
      backgroundColor:
        ['#fff', '#ffffffff'].includes(headerBackgroundColor) && darkMode ? '#1F2837' : headerBackgroundColor,
      overflowY: isDisabledModal ? 'hidden' : 'auto',
      '--cc-modal-header-divider-color': headerDividerColor,
      overflowX: 'hidden',
    },
    modalFooter: {
      backgroundColor:
        ['#fff', '#ffffffff'].includes(footerBackgroundColor) && darkMode ? '#1F2837' : footerBackgroundColor,
      overflowY: isDisabledModal ? 'hidden' : 'auto',
      '--cc-modal-footer-divider-color': footerDividerColor,
    },
    buttonStyles: {
      backgroundColor: triggerButtonBackgroundColor,
      color: triggerButtonTextColor,
      width: '100%',
      display: isVisible ? '' : 'none',
      flexDirection: direction === 'left' ? 'row-reverse' : 'row',
      justifyContent: computedTriggerButtonContentAlignment,
      gap: '6px',
      '--tblr-btn-color-darker':
        triggerButtonHoverBackgroundColor === 'var(--cc-primary-brand)'
          ? getModifiedColor(triggerButtonBackgroundColor, 'hover')
          : triggerButtonHoverBackgroundColor,
      boxShadow,
      borderColor: triggerButtonBackgroundColor,
      height: '100%',
    },
  };
}
