import React from 'react';

export const getInputFocusedColor = ({ accentColor }) => {
  if (accentColor !== '#4368E3') {
    return accentColor;
  }
  return 'var(--cc-primary-brand)';
};

export const getInputBorderColor = ({
  isValid,
  isFocused,
  fieldBorderColor,
  accentColor,
  isLoading,
  isDisabled,
  userInteracted,
}) => {
  if (userInteracted && !isValid) {
    return 'var(--cc-error-systemStatus)';
  }

  if (isFocused) {
    return getInputFocusedColor({ accentColor });
  }

  if (fieldBorderColor !== '#CCD1D5') {
    return fieldBorderColor;
  }

  if (isLoading || isDisabled) {
    return '1px solid var(--cc-disabled-border)';
  }

  return 'var(--cc-default-border)';
};

export const getInputBackgroundColor = ({ fieldBackgroundColor, darkMode, isLoading, isDisabled }) => {
  if (!['#ffffff', '#ffffffff', '#fff', 'var(--cc-surface1-surface)'].includes(fieldBackgroundColor)) {
    return fieldBackgroundColor;
  }

  if (isLoading || isDisabled) {
    if (darkMode) {
      return 'var(--cc-appBackground-surface)';
    } else {
      return 'var(--cc-surface3-surface)';
    }
  }

  return 'var(--cc-surface1-surface)';
};

export const highlightText = (text = '', highlight) => {
  // Escape special regex characters in the highlight string
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const safeHighlight = highlight ? escapeRegExp(highlight) : '';
  const parts = text?.split(new RegExp(`(${safeHighlight})`, 'gi'));

  return (
    <span>
      {parts.map((part, index) =>
        part?.toLowerCase() === highlight?.toLowerCase() ? (
          <span key={index} style={{ backgroundColor: '#E3B643' }}>
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
};

export const sortArray = (arr, sort) => {
  if (sort === 'asc') {
    return arr.sort((a, b) => a.label?.localeCompare(b.label));
  } else if (sort === 'desc') {
    return arr.sort((a, b) => b.label?.localeCompare(a.label));
  }
  return arr;
};
