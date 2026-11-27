import { useMemo } from 'react';
import { themedRadius, themedShadow } from '@/AppBuilder/_helpers/themeStyles';

export const useComputedStyles = (styles) => {
  return useMemo(() => {
    const computedStyles = {
      container: {},
      messageContent: {
        name: '',
        message: '',
        timestamp: '',
      },
      chatInput: {
        backgroundColor: '',
        borderColor: '',
        accentColor: '',
        textColor: '',
        sendIconColor: '',
      },
    };

    // Ensure styles is an object
    if (!styles || typeof styles !== 'object') {
      console.warn('useComputedStyles received invalid styles:', styles);
      return computedStyles;
    }

    // Container styles

    if (
      styles?.containerBackgroundColor &&
      ['#FFFFFF', '#FFFFFFFF', '#fff', '#ffffff', '#ffffffff'].includes(styles.containerBackgroundColor)
    ) {
      computedStyles.container.backgroundColor = 'var(--surfaces-surface-01)';
    } else {
      computedStyles.container.backgroundColor = styles.containerBackgroundColor;
    }

    if (
      styles?.borderColorContainer &&
      ['#E4E7EB', '#e4e7eb', '#e4e7ebff', '#E4E7EBFF'].includes(styles.borderColorContainer)
    ) {
      computedStyles.container.border = '1px solid var(--borders-disabled-on-white)';
    } else {
      computedStyles.container.border = `1px solid ${styles.borderColorContainer}`;
    }

    // Box shadow is a colour (Custom): a shadow drawn in it, the default #121212 meaning the elevation shadow. A theme
    // shadow (boxShadowContainerStyle) replaces it, with the colour's shadow as the fallback.
    const colourShadow =
      styles?.boxShadowContainer && ['#121212', '#121212ff'].includes(styles.boxShadowContainer)
        ? 'var(--elevation-400-box-shadow) var(--elevation-700-box-shadow)'
        : `0px 8px 16px 0px ${styles.boxShadowContainer}, 0px 0px 1px 0px ${styles.boxShadowContainer}`;
    computedStyles.container.boxShadow = themedShadow(styles?.boxShadowContainerStyle, colourShadow);

    computedStyles.container.borderRadius = themedRadius(styles?.borderRadiusStyle, styles.borderRadius);

    // message styles
    if (styles?.message && ['#1B1F24', '#1b1f24', '#1b1f24ff', '#1B1F24FF'].includes(styles.message)) {
      computedStyles.messageContent.message = 'var(--text-primary)';
    } else {
      computedStyles.messageContent.message = styles.message;
    }

    if (styles?.timestamp && ['#6A727C', '#6a727c', '#6a727cff', '#6A727CFF'].includes(styles.timestamp)) {
      computedStyles.messageContent.timestamp = 'var(--text-placeholder)';
    } else {
      computedStyles.messageContent.timestamp = styles.timestamp;
    }

    if (styles?.name && ['#1B1F24', '#1b1f24', '#1b1f24ff', '#1B1F24FF'].includes(styles.name)) {
      computedStyles.messageContent.name = 'var(--text-primary)';
    } else {
      computedStyles.messageContent.name = styles.name;
    }

    if (
      styles.backgroundColorField &&
      ['#FFFFFF', '#ffffff', '#ffffffff', '#FFFFFFFF'].includes(styles.backgroundColorField)
    ) {
      computedStyles.chatInput.backgroundColor = 'var(--surfaces-surface-01)';
    } else {
      computedStyles.chatInput.backgroundColor = styles.backgroundColorField;
    }

    if (styles.borderColorField && ['#CCD1D5', '#ccd1d5', '#ccd1d5ff', '#CCD1D5FF'].includes(styles.borderColorField)) {
      computedStyles.chatInput.borderColor = 'var(--borders-default)';
    } else {
      computedStyles.chatInput.borderColor = styles.borderColorField;
    }

    if (styles.accentColorField && ['#4368E3', '#4368e3', '#4368e3ff', '#4368E3FF'].includes(styles.accentColorField)) {
      computedStyles.chatInput.accentColor = 'var(--primary-accent-strong)';
    } else {
      computedStyles.chatInput.accentColor = styles.accentColorField;
    }

    if (styles.textColorField && ['#11181C', '#11181c', '#11181cff', '#11181CFF'].includes(styles.textColorField)) {
      computedStyles.chatInput.textColor = 'var(--slate12)';
    } else {
      computedStyles.chatInput.textColor = styles.textColorField;
    }

    if (
      styles.sendIconColorField &&
      ['#4368E3', '#4368e3', '#4368e3ff', '#4368E3FF'].includes(styles.sendIconColorField)
    ) {
      computedStyles.chatInput.sendIconColor = 'var(--primary-brand)';
    } else {
      computedStyles.chatInput.sendIconColor = styles.sendIconColorField;
    }

    // Log final computed styles
    return computedStyles;
  }, [
    // Explicitly list all style properties we depend on
    styles?.containerBackgroundColor,
    styles?.borderColorContainer,
    styles?.boxShadowContainer,
    styles?.boxShadowContainerStyle,
    styles?.message,
    styles?.timestamp,
    styles?.name,
    styles?.backgroundColorField,
    styles?.borderColorField,
    styles?.accentColorField,
    styles?.textColorField,
    styles?.sendIconColorField,
    styles?.borderRadius,
    styles?.borderRadiusStyle,
  ]);
};
