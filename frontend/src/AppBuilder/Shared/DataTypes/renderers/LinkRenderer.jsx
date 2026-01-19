import React, { useMemo } from 'react';

/**
 * LinkRenderer - Pure link/URL value renderer
 *
 * Renders a clickable link with customizable styling options.
 *
 * @param {Object} props
 * @param {string} props.value - The URL/href value
 * @param {string} props.displayText - Optional display text (defaults to value)
 * @param {string} props.linkTarget - Target attribute ('_self' | '_blank')
 * @param {string} props.textColor - Link text color
 * @param {string} props.underline - Underline behavior ('always' | 'hover' | 'never')
 * @param {string} props.underlineColor - Underline color
 * @param {boolean} props.darkMode - Whether dark mode is enabled
 */
export const LinkRenderer = ({
  value,
  displayText,
  linkTarget = '_blank',
  textColor,
  underline = 'hover',
  underlineColor,
  darkMode = false,
}) => {
  const linkTextColor = useMemo(() => {
    if (textColor && textColor !== '#1B1F24') {
      return textColor;
    }
    return darkMode ? '#FFFFFF' : '#1B1F24';
  }, [textColor, darkMode]);

  const getUnderlineClass = () => {
    switch (underline) {
      case 'hover':
        return 'table-link-hover';
      case 'always':
      case 'never':
      default:
        return 'table-link';
    }
  };

  return (
    <div className="h-100 d-flex align-items-center">
      <div className="w-100">
        <a
          className={getUnderlineClass()}
          href={value}
          target={linkTarget === '_self' || linkTarget === false ? '_self' : '_blank'}
          onClick={(e) => e.stopPropagation()}
          style={{
            color: linkTextColor,
            textDecoration: underline === 'always' ? 'underline' : 'none',
            textDecorationColor: underlineColor,
          }}
          rel="noopener noreferrer"
        >
          {displayText || String(value || '')}
        </a>
      </div>
    </div>
  );
};

export default LinkRenderer;
