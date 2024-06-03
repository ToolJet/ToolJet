export const getInputFocusedColor = ({ accentColor }) => {
  if (accentColor !== '#4368E3') {
    return accentColor;
  }
  return 'var(--primary-accent-strong)';
};

export const getInputBorderColor = ({ isValid, isFocused, fieldBorderColor, accentColor, isLoading, isDisabled }) => {
  if (!isValid) {
    return 'var(--status-error-strong)';
  }

  if (isFocused) {
    return getInputFocusedColor({ accentColor });
  }

  if (fieldBorderColor !== '#CCD1D5') {
    return fieldBorderColor;
  }

  if (isLoading || isDisabled) {
    return '1px solid var(--borders-disabled-on-white)';
  }

  return 'var(--borders-default)';
};

export const getInputBackgroundColor = ({ fieldBackgroundColor, darkMode, isLoading, isDisabled }) => {
  if (!['#ffffff', '#ffffffff', '#fff'].includes(fieldBackgroundColor)) {
    return fieldBackgroundColor;
  }

  if (isLoading || isDisabled) {
    if (darkMode) {
      return 'var(--surfaces-app-bg-default)';
    } else {
      return 'var(--surfaces-surface-03)';
    }
  }

  return 'var(--surfaces-surface-01)';
};
