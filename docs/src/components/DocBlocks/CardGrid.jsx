import React from 'react';
import clsx from 'clsx';
import './DocBlocks.css';

// A bare number (260 or "260") is a pixel width; anything else is used as written.
const toCssLength = (value) => (/^\d+(\.\d+)?$/.test(String(value)) ? `${value}px` : value);

/**
 * Grid wrapper for cards. By default it fits as many columns of at least
 * `min` px as the page allows. `columns` forces that many equal columns,
 * which collapse to a single column below 640px.
 */
export default function CardGrid({ min = 260, columns, children }) {
  const columnCount = Number(columns);
  const isFixed = Number.isInteger(columnCount) && columnCount > 0;
  const style = isFixed
    ? { '--docblk-grid-columns': columnCount }
    : { '--docblk-grid-min': toCssLength(min) };

  return (
    <div className={clsx('docblk-grid', isFixed ? 'docblk-grid--fixed' : 'docblk-grid--auto')} style={style}>
      {children}
    </div>
  );
}
