import React, { useMemo } from 'react';
import useTextColor from '../DataTypes/_hooks/useTextColor';

export const LinkColumn = ({
  cellValue,
  linkTarget,
  underline,
  underlineColor,
  textColor,
  displayText,
  darkMode,
  id,
}) => {
  const cellTextColor = useTextColor(id, textColor);
  const linkTextColor = useMemo(
    () =>
      cellTextColor !== '#1B1F24' ? cellTextColor : darkMode && cellTextColor === '#1B1F24' ? '#FFFFFF' : cellTextColor,
    [cellTextColor, darkMode]
  );

  return (
    <div className="h-100 d-flex align-items-center">
      <div className="w-100">
        <a
          className={underline === 'hover' ? 'table-link-hover' : 'table-link'}
          href={cellValue}
          target={linkTarget === '_self' || linkTarget == false ? '_self' : '_blank'}
          onClick={(e) => e.stopPropagation()}
          style={{
            color: linkTextColor,
            textDecoration: underline === 'always' && 'underline',
            textDecorationColor: underlineColor,
          }}
          rel="noopener noreferrer"
        >
          {displayText || String(cellValue)}
        </a>
      </div>
    </div>
  );
};
