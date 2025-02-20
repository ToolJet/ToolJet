var tinycolor = require('tinycolor2');

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
  triggerButtonTextColor,
  isVisible,
  boxShadow,
}) {
  const backwardCompatibilityCheck = height == '34' || modalHeight != undefined ? true : false;

  return {
    modalBody: {
      height: backwardCompatibilityCheck ? computedCanvasHeight : height,
      backgroundColor:
        ['#fff', '#ffffffff'].includes(bodyBackgroundColor) && darkMode ? '#1F2837' : bodyBackgroundColor,
      overflowY: isDisabledModal ? 'hidden' : 'auto',
    },
    modalHeader: {
      backgroundColor:
        ['#fff', '#ffffffff'].includes(headerBackgroundColor) && darkMode ? '#1F2837' : headerBackgroundColor,
      height: headerHeightPx,
      overflowY: isDisabledModal ? 'hidden' : 'auto',
    },
    modalFooter: {
      backgroundColor:
        ['#fff', '#ffffffff'].includes(footerBackgroundColor) && darkMode ? '#1F2837' : footerBackgroundColor,
      height: footerHeightPx,
      overflowY: isDisabledModal ? 'hidden' : 'auto',
    },
    buttonStyles: {
      backgroundColor: triggerButtonBackgroundColor,
      color: triggerButtonTextColor,
      width: '100%',
      display: isVisible ? '' : 'none',
      '--tblr-btn-color-darker': tinycolor(triggerButtonBackgroundColor).darken(8).toString(),
      boxShadow,
    },
  };
}
